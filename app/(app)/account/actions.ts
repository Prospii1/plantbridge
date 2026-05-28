'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/server/supabase-server';
import { createSupabaseAdminClient } from '@/lib/server/supabase-admin';
import { getStripe, STRIPE_PRICE_IDS } from '@/lib/server/stripe';
import { log } from '@/lib/observability/log';
import { trackEvent } from '@/lib/observability/events';

const TierSchema = z.enum(['self_guided', 'guided', 'concierge']);

function priceIdForTier(tier: 'self_guided' | 'guided' | 'concierge'): string {
  if (tier === 'guided') return STRIPE_PRICE_IDS.guided;
  if (tier === 'concierge') return STRIPE_PRICE_IDS.concierge;
  return STRIPE_PRICE_IDS.selfGuided;
}

export async function createCheckoutSession(formData: FormData): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const tierResult = TierSchema.safeParse(formData.get('tier') ?? 'self_guided');
  const tier = tierResult.success ? tierResult.data : 'self_guided';
  const priceId = priceIdForTier(tier);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

  if (!priceId) {
    log.error('stripe price ID not configured', { tier });
    redirect('/account?error=not_configured');
  }

  const adminSupabase = createSupabaseAdminClient();

  const { data: existingSub } = await adminSupabase
    .from('subscriptions')
    .select('stripe_customer_id')
    .eq('user_id', user.id)
    .single();

  let customerId = existingSub?.stripe_customer_id ?? undefined;

  if (!customerId) {
    const customer = await getStripe().customers.create({
      email: user.email,
      metadata: { user_id: user.id },
      description: 'PlantBridge wellness education platform user',
    });
    customerId = customer.id;
  }

  const session = await getStripe().checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${appUrl}/account?checkout=success`,
    cancel_url: `${appUrl}/account?checkout=cancelled`,
    metadata: { user_id: user.id },
    allow_promotion_codes: true,
  });

  if (!session.url) {
    log.error('stripe checkout session missing url', { sessionId: session.id });
    redirect('/account?error=checkout_failed');
  }

  await trackEvent({ event: 'checkout_started', userId: user.id });
  redirect(session.url);
}

export async function createPortalSession(): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  const adminSupabase = createSupabaseAdminClient();

  const { data: subscription } = await adminSupabase
    .from('subscriptions')
    .select('stripe_customer_id')
    .eq('user_id', user.id)
    .single();

  if (!subscription?.stripe_customer_id) {
    redirect('/account?error=no_subscription');
  }

  const portalSession = await getStripe().billingPortal.sessions.create({
    customer: subscription.stripe_customer_id,
    return_url: `${appUrl}/account`,
  });

  redirect(portalSession.url);
}
