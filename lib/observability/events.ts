import { PostHog } from 'posthog-node';

// Server-side Posthog client — for Server Actions and API routes.
// Per CLAUDE.md §8: events carry user_id and metadata only, never raw symptom text.

let _posthog: PostHog | null = null;

function getPosthog(): PostHog | null {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://app.posthog.com';
  if (!key) return null;
  if (!_posthog) {
    _posthog = new PostHog(key, { host, flushAt: 1, flushInterval: 0 });
  }
  return _posthog;
}

export type AppEvent =
  | { event: 'signup'; userId: string }
  | { event: 'intake_completed'; userId: string; sessionId: string }
  | { event: 'care_plan_generated'; userId: string; planId: string; itemCount: number }
  | { event: 'outcome_logged'; userId: string; carePlanItemId: string; rating: number }
  | { event: 'checkout_started'; userId: string }
  | { event: 'subscription_activated'; userId: string; tier: string };

export async function trackEvent(payload: AppEvent): Promise<void> {
  const ph = getPosthog();
  if (!ph) return;

  const { event, userId, ...properties } = payload;
  ph.capture({ distinctId: userId, event, properties });
  await ph.flush();
}
