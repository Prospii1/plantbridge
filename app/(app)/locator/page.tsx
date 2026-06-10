import Link from 'next/link';
import { createSupabaseServerClient } from '@/lib/server/supabase-server';
import { createSupabaseAdminClient } from '@/lib/server/supabase-admin';
import { FEATURE_FLAGS } from '@/lib/shared/config/feature-flags';
import { DISCLAIMERS } from '@/lib/shared/copy/disclaimers';
import { getUserTier } from '@/lib/server/subscriptions';
import { hasAccess } from '@/lib/shared/utils/tier';
import { UpgradeGate } from '@/components/shared/upgrade-gate';

interface PageProps {
  searchParams: Promise<{ category?: string; state?: string; terpene?: string }>;
}

const CATEGORIES = ['flower', 'edible', 'tincture', 'topical', 'concentrate'];
const COMMON_TERPENES = ['linalool', 'myrcene', 'caryophyllene', 'limonene', 'pinene', 'terpinolene'];

export default async function LocatorPage({ searchParams }: PageProps) {
  if (!FEATURE_FLAGS.DISPENSARY_LOCATOR) {
    return (
      <div className="mx-auto max-w-xl py-16 space-y-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mx-auto">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="text-primary" aria-hidden="true">
            <path d="M12 21s7-5.5 7-11a7 7 0 10-14 0c0 5.5 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/>
          </svg>
        </div>
        <div>
          <h1 className="font-display text-2xl font-medium text-foreground">Product Locator</h1>
          <p className="text-muted-foreground mt-2 text-sm">Coming soon — we&apos;re expanding to dispensary partners in your area.</p>
        </div>
        <Link href="/education" className="inline-flex rounded-full bg-secondary px-5 py-2.5 text-sm font-medium text-foreground hover:bg-primary/10 transition-colors">
          Browse Education Hub instead →
        </Link>
      </div>
    );
  }

  const { category, state: stateParam, terpene } = await searchParams;

  const supabase      = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const tier = await getUserTier(user.id);
  if (!hasAccess(tier, 'marketplace')) {
    return (
      <UpgradeGate
        requiredTier="marketplace"
        feature="Marketplace Access"
        description="Browse products from our lab-verified dispensary and brand partners, and access exclusive member discounts."
        bullets={[
          'Product locator across dispensary & brand partners',
          'Marketplace member discounts',
          'Health & lab resource access',
          'Full Education Hub (17+ articles)',
        ]}
      />
    );
  }

  const adminSupabase = createSupabaseAdminClient();

  const { data: profile } = await adminSupabase
    .from('profiles')
    .select('state')
    .eq('user_id', user.id)
    .single();

  const userState = stateParam ?? profile?.state ?? '';

  // Only show products from enabled partners
  const { data: enabledPartners } = await adminSupabase
    .from('partners')
    .select('id, company_name')
    .eq('feature_flag_enabled', true);

  const enabledIds = (enabledPartners ?? []).map((p) => p.id);

  if (enabledIds.length === 0) {
    return (
      <div className="mx-auto max-w-xl py-16 space-y-6">
        <h1 className="font-display text-2xl font-medium text-foreground">Product Locator</h1>
        <div className="rounded-2xl border border-border bg-secondary p-6 space-y-4">
          <p className="text-sm font-semibold text-foreground">No dispensary partners in your area yet</p>
          <p className="text-sm text-muted-foreground">
            We&apos;re actively adding dispensary partners across the US. In the meantime, you can order CBD &amp; hemp products online from our vetted partners — no dispensary required.
          </p>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p className="font-medium text-foreground text-xs uppercase tracking-wide">What to look for in any product:</p>
            <ul className="space-y-1 pl-4 list-disc">
              <li>Ask for a Certificate of Analysis (COA) — always</li>
              <li>Look for CBD/CBG percentages matching your care plan guidance</li>
              <li>Check the terpene profile on the COA</li>
              <li>Start with tinctures or capsules for consistent dosing</li>
            </ul>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Link href="/resources#cbd--hemp-product-partners" className="inline-flex rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity text-center justify-center">
              Browse CBD &amp; hemp partners →
            </Link>
            <Link href="/care-plan" className="inline-flex rounded-full border border-border bg-card px-5 py-2.5 text-sm font-medium text-foreground hover:bg-secondary transition-colors text-center justify-center">
              View my care plan
            </Link>
          </div>
        </div>
      </div>
    );
  }

  let query = adminSupabase
    .from('dispensary_products')
    .select('id, name, category, thc_percentage, cbd_percentage, terpene_profile, description, price_cents, in_stock, state')
    .eq('in_stock', true)
    .in('partner_id', enabledIds);

  if (userState) query = query.eq('state', userState);
  if (category)  query = query.eq('category', category);

  const { data: rawProducts } = await query.order('name').limit(60);

  // Filter by terpene in memory (JSONB key existence)
  const products = terpene
    ? (rawProducts ?? []).filter((p) => {
        const profile = p.terpene_profile as Record<string, number> | null;
        return profile && terpene in profile;
      })
    : (rawProducts ?? []);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="space-y-1 pt-2">
        <h1 className="font-display text-2xl font-medium text-foreground">Product Locator</h1>
        <p className="text-sm text-muted-foreground">
          {products.length} product{products.length === 1 ? '' : 's'} found
          {userState ? ` in ${userState}` : ''}
        </p>
      </div>

      {/* Filters */}
      <form className="flex flex-wrap gap-3 items-end p-4 rounded-2xl border border-border bg-card card-shadow">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">State</label>
          <input
            type="text"
            name="state"
            defaultValue={userState}
            maxLength={2}
            placeholder="CA"
            className="w-20 rounded-xl border border-border bg-background px-3 py-2 text-sm uppercase focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Category</label>
          <select
            name="category"
            defaultValue={category ?? ''}
            className="rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">All categories</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c} className="capitalize">{c}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Terpene</label>
          <select
            name="terpene"
            defaultValue={terpene ?? ''}
            className="rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Any terpene</option>
            {COMMON_TERPENES.map((t) => (
              <option key={t} value={t} className="capitalize">{t}</option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
        >
          Filter
        </button>
        {(category || terpene) && (
          <a href="/locator" className="text-sm text-muted-foreground hover:text-foreground transition-colors py-2">
            Clear filters
          </a>
        )}
      </form>

      {/* Product grid */}
      {products.length === 0 ? (
        <div className="rounded-2xl border border-border bg-muted/30 p-8 text-center space-y-2">
          <p className="text-sm font-semibold text-foreground">No products match these filters</p>
          <p className="text-xs text-muted-foreground">Try removing the terpene or category filter, or change the state.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => {
            const terpenes = p.terpene_profile as Record<string, number> | null;
            const topTerpenes = terpenes
              ? Object.entries(terpenes).sort(([, a], [, b]) => b - a).slice(0, 3).map(([name]) => name)
              : [];

            return (
              <div key={p.id} className="rounded-2xl border border-border bg-card p-4 space-y-3 card-shadow">
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-foreground leading-snug">{p.name}</p>
                  <span className="inline-block rounded-full bg-muted px-2 py-0.5 text-xs capitalize text-muted-foreground">
                    {p.category}
                  </span>
                </div>

                {/* Cannabinoid content */}
                {(p.thc_percentage != null || p.cbd_percentage != null) && (
                  <div className="flex gap-3">
                    {p.thc_percentage != null && (
                      <div className="text-center">
                        <p className="text-xs font-bold text-foreground">{p.thc_percentage}%</p>
                        <p className="text-[10px] text-muted-foreground">THC</p>
                      </div>
                    )}
                    {p.cbd_percentage != null && (
                      <div className="text-center">
                        <p className="text-xs font-bold text-primary">{p.cbd_percentage}%</p>
                        <p className="text-[10px] text-muted-foreground">CBD</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Terpenes */}
                {topTerpenes.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {topTerpenes.map((t) => (
                      <span key={t} className={`rounded-full px-2 py-0.5 text-[10px] font-medium capitalize ${terpene === t ? 'bg-primary text-primary-foreground' : 'bg-primary/10 text-primary'}`}>
                        {t}
                      </span>
                    ))}
                  </div>
                )}

                {p.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2">{p.description}</p>
                )}

                <div className="flex items-center justify-between">
                  {p.price_cents != null && (
                    <span className="text-sm font-semibold text-foreground">${(p.price_cents / 100).toFixed(2)}</span>
                  )}
                  <span className={`text-xs font-medium ${p.in_stock ? 'text-primary' : 'text-muted-foreground'}`}>
                    {p.in_stock ? '● In stock' : '○ Out of stock'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <p className="text-xs text-muted-foreground border-t border-border pt-4 pb-2">{DISCLAIMERS.standard}</p>
    </div>
  );
}
