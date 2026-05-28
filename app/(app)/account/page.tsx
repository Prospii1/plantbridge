import { createSupabaseServerClient } from '@/lib/server/supabase-server';
import { redirect } from 'next/navigation';
import type { SubscriptionTier } from '@/lib/server/stripe';
import { TIER_LABELS } from '@/lib/shared/utils/tier';
import { createCheckoutSession, createPortalSession } from './actions';

interface AccountPageProps {
  searchParams: Promise<{ checkout?: string; error?: string }>;
}

const TIER_FEATURES: Record<SubscriptionTier, string[]> = {
  free: ['View your care plan', 'Access education hub'],
  self_guided: ['Full care plan', 'Outcome tracking', 'Education hub', 'Email support'],
  guided: ['Everything in Self-Guided', 'Coach access', 'Personalized check-ins', 'Priority support'],
  concierge: ['Everything in Guided', '1:1 expert sessions', 'Dedicated wellness advisor'],
};

export default async function AccountPage({ searchParams }: AccountPageProps) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, state, age_verified_at, subscription_tier')
    .eq('user_id', user.id)
    .single();

  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('tier, status, current_period_end, stripe_customer_id')
    .eq('user_id', user.id)
    .single();

  const params = await searchParams;
  const isActive = subscription?.status === 'active' || subscription?.status === 'trialing';
  const currentTier = (subscription?.tier ?? profile?.subscription_tier ?? 'free') as SubscriptionTier;

  return (
    <div className="mx-auto max-w-2xl space-y-8 py-8">
      <h1 className="text-2xl font-semibold text-foreground">Account</h1>

      {params.checkout === 'success' && (
        <div className="rounded-lg bg-primary/10 px-4 py-3 text-sm text-primary font-medium">
          Your subscription is now active. Thank you!
        </div>
      )}
      {params.checkout === 'cancelled' && (
        <div className="rounded-lg bg-muted px-4 py-3 text-sm text-muted-foreground">
          Checkout cancelled. No charges were made.
        </div>
      )}
      {params.error === 'not_configured' && (
        <div className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
          Stripe is not fully configured. Please try again later.
        </div>
      )}

      {/* Profile card */}
      <div className="rounded-lg border border-border bg-card p-5 space-y-4">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Profile</h2>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Email</dt>
            <dd className="text-foreground">{user.email}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">State</dt>
            <dd className="text-foreground">{profile?.state ?? '—'}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Age verified</dt>
            <dd className="text-foreground">
              {profile?.age_verified_at
                ? new Date(profile.age_verified_at).toLocaleDateString('en-US', { dateStyle: 'medium' })
                : '—'}
            </dd>
          </div>
        </dl>
      </div>

      {/* Current subscription */}
      <div className="rounded-lg border border-border bg-card p-5 space-y-4">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Subscription</h2>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Plan</dt>
            <dd className="text-foreground font-medium">{TIER_LABELS[currentTier]}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Status</dt>
            <dd className="capitalize text-foreground">
              {isActive ? 'Active' : (subscription?.status ?? 'Inactive')}
            </dd>
          </div>
          {subscription?.current_period_end && (
            <div className="flex justify-between">
              <dt className="text-muted-foreground">
                {subscription.status === 'canceled' ? 'Access until' : 'Renews'}
              </dt>
              <dd className="text-foreground">
                {new Date(subscription.current_period_end).toLocaleDateString('en-US', { dateStyle: 'medium' })}
              </dd>
            </div>
          )}
        </dl>

        {isActive && (
          <form action={createPortalSession}>
            <button
              type="submit"
              className="rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
            >
              Manage subscription
            </button>
          </form>
        )}
      </div>

      {/* Tier comparison */}
      {!isActive && (
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Plans</h2>
          <div className="grid gap-3 sm:grid-cols-3">
            {(['self_guided', 'guided', 'concierge'] as const).map((tier) => {
              const isComingSoon = tier === 'guided' || tier === 'concierge';
              return (
                <div
                  key={tier}
                  className={`rounded-lg border p-4 space-y-3 ${tier === 'self_guided' ? 'border-primary bg-primary/5' : 'border-border bg-card opacity-60'}`}
                >
                  <div className="space-y-0.5">
                    <p className="text-sm font-semibold text-foreground">{TIER_LABELS[tier]}</p>
                    {isComingSoon && (
                      <span className="inline-block rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                        Coming soon
                      </span>
                    )}
                  </div>
                  <ul className="space-y-1">
                    {TIER_FEATURES[tier].map((f) => (
                      <li key={f} className="text-xs text-muted-foreground flex gap-1.5">
                        <span className="text-primary">✓</span> {f}
                      </li>
                    ))}
                  </ul>
                  {!isComingSoon ? (
                    <form action={createCheckoutSession}>
                      <input type="hidden" name="tier" value={tier} />
                      <button
                        type="submit"
                        className="w-full rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
                      >
                        Get started
                      </button>
                    </form>
                  ) : (
                    <button
                      disabled
                      className="w-full rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground cursor-not-allowed"
                    >
                      Coming soon
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
