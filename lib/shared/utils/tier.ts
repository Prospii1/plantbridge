import type { SubscriptionTier } from '@/lib/server/stripe';

export const TIER_ORDER: Record<SubscriptionTier, number> = {
  free: 0,
  marketplace: 1,
  self_guided: 2,
  consultation: 3,
  guided: 4,
  concierge: 5,
};

export const TIER_LABELS: Record<SubscriptionTier, string> = {
  free: 'Free',
  marketplace: 'Marketplace Access',
  self_guided: 'Self-Guided',
  consultation: 'Consultation',
  guided: 'Guided',
  concierge: 'Concierge',
};

export function hasAccess(userTier: SubscriptionTier, requiredTier: SubscriptionTier): boolean {
  return TIER_ORDER[userTier] >= TIER_ORDER[requiredTier];
}
