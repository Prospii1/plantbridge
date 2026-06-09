import { createSupabaseServerClient } from '@/lib/server/supabase-server';
import { createSupabaseAdminClient } from '@/lib/server/supabase-admin';
import { redirect } from 'next/navigation';
import type { SubscriptionTier } from '@/lib/server/stripe';
import { STRIPE_PRICE_IDS } from '@/lib/server/stripe';
import { TIER_LABELS } from '@/lib/shared/utils/tier';
import { createCheckoutSession, createPortalSession } from './actions';

interface AccountPageProps {
  searchParams: Promise<{ checkout?: string; error?: string }>;
}

const TIER_DETAILS: Record<SubscriptionTier, {
  price: string;
  period: string;
  features: string[];
  highlight?: boolean;
}> = {
  free: {
    price: '$0',
    period: '/mo',
    features: ['Wellness intake (free)', '2 starter education articles', 'Basic plant awareness'],
  },
  marketplace: {
    price: '$4.99',
    period: '/mo',
    features: ['Full Education Hub (17+ articles)', 'Marketplace discounts', 'Health & lab resource access', 'Certifications & tools'],
    highlight: true,
  },
  self_guided: {
    price: '$19.99',
    period: '/mo',
    features: ['Everything in Marketplace Access', 'Full personalized care plan', 'Dosing guidance per item', 'Outcome tracking', 'Titration path', 'Product matching'],
  },
  guided: {
    price: '$49.99',
    period: '/mo',
    features: ['Everything in Self-Guided', 'Dedicated cannabis coach', 'Monthly 1:1 check-in sessions', 'Priority support', 'Plan review & adjustments'],
  },
  concierge: {
    price: 'Contact us',
    period: '',
    features: ['Everything in Guided', '1:1 expert sessions', 'Dedicated wellness advisor', 'White-glove onboarding'],
  },
};

export default async function AccountPage({ searchParams }: AccountPageProps) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const adminSupabase = createSupabaseAdminClient();

  const [profileRes, subRes, intakeCountRes, logCountRes, planItemsRes] = await Promise.all([
    supabase
      .from('profiles')
      .select('role, state, age_verified_at, subscription_tier')
      .eq('user_id', user.id)
      .single(),
    supabase
      .from('subscriptions')
      .select('tier, status, current_period_end, stripe_customer_id')
      .eq('user_id', user.id)
      .single(),
    adminSupabase
      .from('intake_sessions')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .not('completed_at', 'is', null),
    adminSupabase
      .from('outcome_logs')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id),
    adminSupabase
      .from('care_plan_items')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id),
  ]);

  const params       = await searchParams;
  const profile      = profileRes.data;
  const subscription = subRes.data;

  const isActive    = subscription?.status === 'active' || subscription?.status === 'trialing';
  const currentTier = (subscription?.tier ?? profile?.subscription_tier ?? 'free') as SubscriptionTier;

  const intakeCount    = intakeCountRes.count ?? 0;
  const logCount       = logCountRes.count ?? 0;
  const planItemsCount = planItemsRes.count ?? 0;

  const memberSince = user.created_at
    ? new Date(user.created_at).toLocaleDateString('en-US', { dateStyle: 'medium' })
    : '—';

  // Tiers available for checkout — only show if price ID is configured
  const checkoutableTiers: SubscriptionTier[] = [];
  if (STRIPE_PRICE_IDS.marketplace) checkoutableTiers.push('marketplace');
  if (STRIPE_PRICE_IDS.selfGuided)  checkoutableTiers.push('self_guided');
  if (STRIPE_PRICE_IDS.guided)      checkoutableTiers.push('guided');

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Toast messages */}
      {params.checkout === 'success' && (
        <div className="rounded-2xl bg-primary/10 px-4 py-3 text-sm font-semibold text-primary">
          ✓ Your subscription is now active. Thank you!
        </div>
      )}
      {params.checkout === 'cancelled' && (
        <div className="rounded-2xl bg-muted px-4 py-3 text-sm text-muted-foreground">
          Checkout cancelled. No charges were made.
        </div>
      )}
      {params.error === 'not_configured' && (
        <div className="rounded-2xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
          This plan is not yet available. Please try again later.
        </div>
      )}

      {/* Profile */}
      <div className="rounded-2xl border border-border bg-card p-5 space-y-4 card-shadow">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-display text-xl font-medium shrink-0">
            {(user.email?.[0] ?? 'U').toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-foreground">{user.email}</p>
            <p className="text-xs text-muted-foreground">Member since {memberSince} · {profile?.state ?? 'State not set'}</p>
          </div>
        </div>
      </div>

      {/* Usage stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Intakes', value: intakeCount },
          { label: 'Recommendations', value: planItemsCount },
          { label: 'Check-ins', value: logCount },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-2xl border border-border bg-card p-4 text-center card-shadow">
            <p className="font-display text-2xl font-medium text-primary">{value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Subscription */}
      <div className="rounded-2xl border border-border bg-card p-5 space-y-4 card-shadow">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">Current plan</h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold text-foreground text-lg">{TIER_LABELS[currentTier]}</p>
            {isActive && subscription?.current_period_end && (
              <p className="text-xs text-muted-foreground">
                {subscription.status === 'canceled' ? 'Access until' : 'Renews'}{' '}
                {new Date(subscription.current_period_end).toLocaleDateString('en-US', { dateStyle: 'medium' })}
              </p>
            )}
          </div>
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${isActive ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
            {isActive ? 'Active' : currentTier === 'free' ? 'Free' : (subscription?.status ?? 'Inactive')}
          </span>
        </div>
        <div className="flex items-center gap-4 flex-wrap">
          {isActive && (
            <form action={createPortalSession}>
              <button type="submit" className="text-sm font-medium text-primary hover:underline">
                Manage subscription →
              </button>
            </form>
          )}
          {/* Upgrade nudge: self_guided → guided */}
          {isActive && currentTier === 'self_guided' && STRIPE_PRICE_IDS.guided && (
            <form action={createCheckoutSession}>
              <input type="hidden" name="tier" value="guided" />
              <button type="submit" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Upgrade to Guided →
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Marketplace → Self-Guided upgrade card */}
      {isActive && currentTier === 'marketplace' && STRIPE_PRICE_IDS.selfGuided && (
        <div className="rounded-2xl border border-primary/30 bg-primary/5 p-5 space-y-3 card-shadow">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-foreground">Ready for your personalized care plan?</p>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                Upgrade to Self-Guided ($19.99/mo) to unlock your full intake-driven care plan with dosing guidance, outcome tracking, and a personalized titration path.
              </p>
            </div>
            <span className="shrink-0 rounded-full bg-primary/15 px-2.5 py-1 text-[10px] font-semibold text-primary">Self-Guided</span>
          </div>
          <ul className="space-y-1.5">
            {TIER_DETAILS.self_guided.features.map((f) => (
              <li key={f} className="flex items-start gap-2 text-xs text-foreground">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary mt-0.5 shrink-0" aria-hidden="true">
                  <path d="M5 12.5l4.5 4.5L19 7"/>
                </svg>
                {f}
              </li>
            ))}
          </ul>
          <form action={createCheckoutSession}>
            <input type="hidden" name="tier" value="self_guided" />
            <button type="submit"
              className="w-full rounded-full bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity">
              Upgrade to Self-Guided — $19.99/mo
            </button>
          </form>
        </div>
      )}

      {/* Guided upgrade card — shown inline for active self_guided users */}
      {isActive && currentTier === 'self_guided' && STRIPE_PRICE_IDS.guided && (
        <div className="rounded-2xl border border-primary/30 bg-primary/5 p-5 space-y-3 card-shadow">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-foreground">Ready for a coach?</p>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                Upgrade to Guided ($49.99/mo) and get a dedicated Cannabis Coach who reviews your plan, tracks your progress, and holds monthly 1:1 sessions with you.
              </p>
            </div>
            <span className="shrink-0 rounded-full bg-primary/15 px-2.5 py-1 text-[10px] font-semibold text-primary">Guided</span>
          </div>
          <ul className="space-y-1.5">
            {TIER_DETAILS.guided.features.map((f) => (
              <li key={f} className="flex items-start gap-2 text-xs text-foreground">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary mt-0.5 shrink-0" aria-hidden="true">
                  <path d="M5 12.5l4.5 4.5L19 7"/>
                </svg>
                {f}
              </li>
            ))}
          </ul>
          <form action={createCheckoutSession}>
            <input type="hidden" name="tier" value="guided" />
            <button type="submit"
              className="w-full rounded-full bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity">
              Upgrade to Guided — $49.99/mo
            </button>
          </form>
        </div>
      )}

      {/* Tier comparison + upgrade */}
      {!isActive && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">Upgrade your plan</h2>
          <div className="space-y-3">
            {(['marketplace', 'self_guided', 'guided', 'concierge'] as const).map((tier) => {
              const details      = TIER_DETAILS[tier];
              const isConfigured = checkoutableTiers.includes(tier);
              const isCurrent    = tier === currentTier;

              return (
                <div
                  key={tier}
                  className={`rounded-2xl border p-5 space-y-3 transition-colors ${
                    details.highlight
                      ? 'border-primary bg-primary/5'
                      : 'border-border bg-card'
                  } card-shadow`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-foreground">{TIER_LABELS[tier]}</p>
                        {details.highlight && !isCurrent && (
                          <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold text-primary">Most popular</span>
                        )}
                        {isCurrent && (
                          <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">Current</span>
                        )}
                      </div>
                      <p className="text-sm font-semibold text-primary mt-0.5">
                        {details.price}<span className="text-xs font-normal text-muted-foreground">{details.period}</span>
                      </p>
                    </div>
                  </div>

                  <ul className="space-y-1.5">
                    {details.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm text-foreground">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary mt-0.5 shrink-0" aria-hidden="true">
                          <path d="M5 12.5l4.5 4.5L19 7"/>
                        </svg>
                        {f}
                      </li>
                    ))}
                  </ul>

                  {!isCurrent && (
                    isConfigured ? (
                      <form action={createCheckoutSession}>
                        <input type="hidden" name="tier" value={tier} />
                        <button
                          type="submit"
                          className={`w-full rounded-full py-2.5 text-sm font-semibold transition-opacity hover:opacity-90 ${
                            details.highlight
                              ? 'bg-primary text-primary-foreground'
                              : 'border border-border bg-card text-foreground'
                          }`}
                        >
                          Get started with {TIER_LABELS[tier]}
                        </button>
                      </form>
                    ) : (
                      <p className="text-xs text-muted-foreground text-center py-1">
                        {tier === 'concierge' ? 'Contact us to learn more' : 'Coming soon'}
                      </p>
                    )
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Settings list */}
      <div className="rounded-2xl border border-border bg-card card-shadow">
        <div className="divide-y divide-border">
          {[
            ['Age verified', profile?.age_verified_at
              ? new Date(profile.age_verified_at).toLocaleDateString('en-US', { dateStyle: 'medium' })
              : 'Not verified'],
            ['State', profile?.state ?? 'Not set'],
            ['Account role', profile?.role ?? 'user'],
          ].map(([label, value]) => (
            <div key={label} className="flex items-center justify-between px-5 py-3.5 text-sm">
              <span className="text-muted-foreground">{label}</span>
              <span className="text-foreground font-medium capitalize">{value}</span>
            </div>
          ))}
          <form method="POST" action="/logout" className="px-5 py-3.5">
            <button type="submit" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Sign out
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
