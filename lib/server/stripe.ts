import Stripe from 'stripe';

// Server-only — never import from app/, components/, or lib/client/
// When registering with Stripe, describe the business as
// "wellness education and content platform" — not as a cannabis marketplace.

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not configured');
  }
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2026-04-22.dahlia',
    });
  }
  return _stripe;
}

export const STRIPE_PRICE_IDS = {
  marketplace: process.env.STRIPE_MARKETPLACE_PRICE_ID ?? '',
  selfGuided: process.env.STRIPE_SELF_GUIDED_PRICE_ID ?? '',
  guided: process.env.STRIPE_GUIDED_PRICE_ID ?? '',
  concierge: process.env.STRIPE_CONCIERGE_PRICE_ID ?? '',
} as const;

export type SubscriptionTier = 'free' | 'marketplace' | 'self_guided' | 'guided' | 'concierge';

export function tierFromPriceId(priceId: string): SubscriptionTier {
  if (priceId && priceId === STRIPE_PRICE_IDS.marketplace) return 'marketplace';
  if (priceId && priceId === STRIPE_PRICE_IDS.guided) return 'guided';
  if (priceId && priceId === STRIPE_PRICE_IDS.concierge) return 'concierge';
  return 'self_guided';
}
