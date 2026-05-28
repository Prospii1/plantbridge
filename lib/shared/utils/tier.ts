import type { SubscriptionTier } from '@/lib/server/stripe';

export const TIER_ORDER: Record<SubscriptionTier, number> = {
  free: 0,
  self_guided: 1,
  guided: 2,
  concierge: 3,
};

export const TIER_LABELS: Record<SubscriptionTier, string> = {
  free: 'Free',
  self_guided: 'Self-Guided',
  guided: 'Guided',
  concierge: 'Concierge',
};

export function hasAccess(userTier: SubscriptionTier, requiredTier: SubscriptionTier): boolean {
  return TIER_ORDER[userTier] >= TIER_ORDER[requiredTier];
}
