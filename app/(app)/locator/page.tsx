import { createSupabaseServerClient } from '@/lib/server/supabase-server';
import { createSupabaseAdminClient } from '@/lib/server/supabase-admin';
import { FEATURE_FLAGS } from '@/lib/shared/config/feature-flags';
import { DISCLAIMERS } from '@/lib/shared/copy/disclaimers';

interface PageProps {
  searchParams: Promise<{ category?: string; state?: string }>;
}

export default async function LocatorPage({ searchParams }: PageProps) {
  if (!FEATURE_FLAGS.DISPENSARY_LOCATOR) {
    return (
      <div className="mx-auto max-w-2xl py-16 text-center space-y-4">
        <h1 className="text-2xl font-semibold text-foreground">Dispensary Locator</h1>
        <p className="text-muted-foreground">Coming soon — the product locator is not yet available in your area.</p>
      </div>
    );
  }

  const { category, state: stateParam } = await searchParams;

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const adminSupabase = createSupabaseAdminClient();

  // Get user's state for default filter
  const { data: profile } = await adminSupabase
    .from('profiles')
    .select('state')
    .eq('user_id', user.id)
    .single();

  const userState = stateParam ?? profile?.state ?? '';

  let query = adminSupabase
    .from('dispensary_products')
    .select('id, name, category, thc_percentage, cbd_percentage, terpene_profile, description, price_cents, in_stock, state, partner_id')
    .eq('in_stock', true);

  if (userState) query = query.eq('state', userState);
  if (category) query = query.eq('category', category);

  // Only show products from feature-flag-enabled partners
  const { data: enabledPartners } = await adminSupabase
    .from('partners')
    .select('id')
    .eq('feature_flag_enabled', true);

  const enabledIds = (enabledPartners ?? []).map((p) => p.id);
  if (enabledIds.length > 0) {
    query = query.in('partner_id', enabledIds);
  } else {
    return (
      <div className="mx-auto max-w-2xl py-16 text-center">
        <p className="text-muted-foreground">No products available in your area yet.</p>
      </div>
    );
  }

  const { data: products } = await query.order('name').limit(50);

  const CATEGORIES = ['flower', 'edible', 'tincture', 'topical', 'concentrate'];

  return (
    <div className="mx-auto max-w-4xl space-y-8 py-8">
      <h1 className="text-2xl font-semibold text-foreground">Product Locator</h1>

      {/* Filters */}
      <form className="flex flex-wrap gap-3 items-end">
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">State</label>
          <input
            type="text"
            name="state"
            defaultValue={userState}
            maxLength={2}
            placeholder="CA"
            className="w-20 rounded-md border border-input bg-background px-3 py-2 text-sm uppercase focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Category</label>
          <select
            name="category"
            defaultValue={category ?? ''}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">All</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c} className="capitalize">{c}</option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          className="rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-secondary"
        >
          Filter
        </button>
      </form>

      {/* Product grid */}
      {!products || products.length === 0 ? (
        <p className="text-sm text-muted-foreground">No products found matching your filters.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => {
            const terpenes = p.terpene_profile as Record<string, number> | null;
            const topTerpenes = terpenes
              ? Object.entries(terpenes)
                  .sort(([, a], [, b]) => b - a)
                  .slice(0, 3)
                  .map(([name]) => name)
              : [];

            return (
              <div key={p.id} className="rounded-lg border border-border bg-card p-4 space-y-3">
                <div>
                  <p className="text-sm font-semibold text-foreground">{p.name}</p>
                  <span className="inline-block rounded-full bg-muted px-2 py-0.5 text-xs capitalize text-muted-foreground">
                    {p.category}
                  </span>
                </div>

                <div className="flex gap-3 text-xs text-muted-foreground">
                  {p.thc_percentage != null && <span>THC {p.thc_percentage}%</span>}
                  {p.cbd_percentage != null && <span>CBD {p.cbd_percentage}%</span>}
                </div>

                {topTerpenes.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {topTerpenes.map((t) => (
                      <span key={t} className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary capitalize">
                        {t}
                      </span>
                    ))}
                  </div>
                )}

                {p.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2">{p.description}</p>
                )}

                <div className="flex items-center justify-between text-xs">
                  {p.price_cents != null && (
                    <span className="font-medium text-foreground">${(p.price_cents / 100).toFixed(2)}</span>
                  )}
                  <span className={`font-medium ${p.in_stock ? 'text-primary' : 'text-muted-foreground'}`}>
                    {p.in_stock ? 'In stock' : 'Out of stock'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Disclaimer */}
      <div className="rounded-lg bg-muted/50 px-4 py-3 text-xs text-muted-foreground space-y-1">
        <p>{DISCLAIMERS.standard}</p>
      </div>
    </div>
  );
}
