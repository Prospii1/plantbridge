import { createSupabaseServerClient } from '@/lib/server/supabase-server';
import type { SubscriptionTier } from '@/lib/server/stripe';

/**
 * Returns the current subscription tier for the authenticated user.
 * Falls back to 'free' if no profile or subscription exists.
 * Uses profiles.subscription_tier which is kept in sync by the Stripe webhook.
 */
export async function getUserTier(userId: string): Promise<SubscriptionTier> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from('profiles')
    .select('subscription_tier')
    .eq('user_id', userId)
    .single();
  return (data?.subscription_tier ?? 'free') as SubscriptionTier;
}
