import { NextRequest, NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { getStripe, tierFromPriceId } from '@/lib/server/stripe';
import { createSupabaseAdminClient } from '@/lib/server/supabase-admin';
import { log } from '@/lib/observability/log';
import { trackEvent } from '@/lib/observability/events';

export async function POST(req: NextRequest): Promise<NextResponse> {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature');

  if (!sig) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
  }

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    log.error('STRIPE_WEBHOOK_SECRET not configured', {});
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    log.warn('stripe webhook signature verification failed', { error: (err as Error).message });
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();

  // Idempotency: skip already-processed events
  const { data: existing } = await supabase
    .from('stripe_events')
    .select('stripe_event_id')
    .eq('stripe_event_id', event.id)
    .single();

  if (existing) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  try {
    await handleEvent(event);

    await supabase.from('stripe_events').insert({
      stripe_event_id: event.id,
      processed_at: new Date().toISOString(),
    });

    return NextResponse.json({ received: true });
  } catch (err) {
    log.error('stripe webhook handler failed', {
      eventId: event.id,
      eventType: event.type,
      error: (err as Error).message,
    });
    // Return 500 so Stripe retries
    return NextResponse.json({ error: 'Handler failed' }, { status: 500 });
  }
}

function getSubscriptionPeriodEnd(subscription: Stripe.Subscription): string | null {
  // In Stripe API v2026+, current_period_end is on the subscription item, not the subscription
  const periodEnd = subscription.items.data[0]?.current_period_end;
  return periodEnd != null ? new Date(periodEnd * 1000).toISOString() : null;
}

async function handleEvent(event: Stripe.Event): Promise<void> {
  const supabase = createSupabaseAdminClient();

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.['user_id'];
      if (!userId || session.mode !== 'subscription') break;

      const subscriptionId =
        typeof session.subscription === 'string'
          ? session.subscription
          : session.subscription?.id;
      if (!subscriptionId) break;

      const subscription = await getStripe().subscriptions.retrieve(subscriptionId, {
        expand: ['items'],
      });

      const customerId =
        typeof session.customer === 'string' ? session.customer : session.customer?.id;

      const priceId = subscription.items.data[0]?.price?.id ?? '';
      const tier = tierFromPriceId(priceId);

      await supabase.from('subscriptions').upsert(
        {
          user_id: userId,
          stripe_customer_id: customerId,
          stripe_subscription_id: subscriptionId,
          tier,
          status: subscription.status,
          current_period_end: getSubscriptionPeriodEnd(subscription),
        },
        { onConflict: 'user_id' },
      );

      await supabase
        .from('profiles')
        .update({ subscription_tier: tier })
        .eq('user_id', userId);

      await trackEvent({ event: 'subscription_activated', userId, tier });
      break;
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId =
        typeof subscription.customer === 'string'
          ? subscription.customer
          : subscription.customer.id;
      const userId = await getUserIdByCustomer(customerId);
      if (!userId) break;

      const updatedPriceId = subscription.items.data[0]?.price?.id ?? '';
      const updatedTier = tierFromPriceId(updatedPriceId);

      await supabase.from('subscriptions').upsert(
        {
          user_id: userId,
          stripe_customer_id: customerId,
          stripe_subscription_id: subscription.id,
          tier: updatedTier,
          status: subscription.status,
          current_period_end: getSubscriptionPeriodEnd(subscription),
        },
        { onConflict: 'user_id' },
      );

      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId =
        typeof subscription.customer === 'string'
          ? subscription.customer
          : subscription.customer.id;
      const userId = await getUserIdByCustomer(customerId);
      if (!userId) break;

      await supabase
        .from('subscriptions')
        .update({ status: 'canceled', tier: 'free' })
        .eq('user_id', userId);

      await supabase
        .from('profiles')
        .update({ subscription_tier: 'free' })
        .eq('user_id', userId);

      break;
    }

    case 'invoice.payment_succeeded': {
      const invoice = event.data.object as Stripe.Invoice;
      // In Stripe API v2026+, subscription is in invoice.parent.subscription_details.subscription
      const subscriptionRef = invoice.parent?.subscription_details?.subscription;
      if (!subscriptionRef) break;

      const subscriptionId =
        typeof subscriptionRef === 'string' ? subscriptionRef : subscriptionRef.id;
      const customerId =
        typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id;
      if (!customerId) break;

      const userId = await getUserIdByCustomer(customerId);
      if (!userId) break;

      const subscription = await getStripe().subscriptions.retrieve(subscriptionId, {
        expand: ['items'],
      });

      await supabase
        .from('subscriptions')
        .update({
          status: 'active',
          current_period_end: getSubscriptionPeriodEnd(subscription),
        })
        .eq('user_id', userId);

      break;
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId =
        typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id;
      if (!customerId) break;

      const userId = await getUserIdByCustomer(customerId);
      if (!userId) break;

      await supabase
        .from('subscriptions')
        .update({ status: 'past_due' })
        .eq('user_id', userId);

      break;
    }

    default:
      break;
  }
}

async function getUserIdByCustomer(customerId: string): Promise<string | null> {
  const supabase = createSupabaseAdminClient();
  const { data } = await supabase
    .from('subscriptions')
    .select('user_id')
    .eq('stripe_customer_id', customerId)
    .single();
  return data?.user_id ?? null;
}
