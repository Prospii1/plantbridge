import Link from 'next/link';
import { createSupabaseAdminClient } from '@/lib/server/supabase-admin';
import { createPartner, togglePartnerFeatureFlag } from '../partners/actions';

const BRAND_TYPES = ['brand', 'cbd_vendor'] as const;

const TYPE_LABELS: Record<string, string> = {
  brand:      'Brand',
  cbd_vendor: 'CBD Vendor',
};

const TYPE_COLORS: Record<string, string> = {
  brand:      'bg-violet-100 text-violet-700',
  cbd_vendor: 'bg-green-100 text-green-700',
};

async function createBrandPartnerAction(formData: FormData): Promise<void> {
  'use server';
  await createPartner(formData);
}

export default async function AdminBrandPartnersPage() {
  const supabase = createSupabaseAdminClient();

  const [partnersRes, productCountRes, authListRes] = await Promise.all([
    supabase
      .from('partners')
      .select('id, user_id, company_name, type, region_states, feature_flag_enabled, created_at, website_url, notes, contact_email')
      .in('type', BRAND_TYPES)
      .order('created_at', { ascending: false }),
    supabase.from('dispensary_products').select('partner_id'),
    supabase.auth.admin.listUsers({ perPage: 1000 }),
  ]);

  const emailMap = new Map(
    (authListRes.data?.users ?? []).map((u) => [u.id, u.email ?? '—']),
  );

  const productCounts = (productCountRes.data ?? []).reduce<Record<string, number>>((acc, p) => {
    acc[p.partner_id] = (acc[p.partner_id] ?? 0) + 1;
    return acc;
  }, {});

  const partners = (partnersRes.data ?? []).map((p) => ({
    ...p,
    email: emailMap.get(p.user_id) ?? '—',
    productCount: productCounts[p.id] ?? 0,
  }));

  return (
    <div className="max-w-5xl space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Brand Partners</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Non-dispensary brands and CBD vendors. Products appear in the locator across all states.
          </p>
        </div>
        <Link href="/admin/partners" className="text-sm text-muted-foreground hover:text-foreground">
          ← All partners
        </Link>
      </div>

      {/* Add brand partner form */}
      <section className="rounded-lg border border-border bg-card p-5 space-y-4">
        <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">Add Brand Partner</h2>
        <form action={createBrandPartnerAction} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">User account email *</label>
              <input type="email" name="email" required placeholder="partner@brand.com"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Company / Brand name *</label>
              <input type="text" name="company_name" required placeholder="Acme CBD Co."
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Partner type *</label>
              <select name="type" required
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                {BRAND_TYPES.map((t) => (
                  <option key={t} value={t}>{TYPE_LABELS[t]}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Contact email</label>
              <input type="email" name="contact_email" placeholder="info@brand.com"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Website URL</label>
              <input type="url" name="website_url" placeholder="https://www.brand.com"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">States served (comma-separated, blank = all)</label>
              <input type="text" name="region_states" placeholder="Leave blank for nationwide"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Internal notes (optional)</label>
            <textarea name="notes" rows={2} maxLength={1000}
              placeholder="BD notes, deal terms, review date…"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>

          <button type="submit"
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
            Add brand partner
          </button>
        </form>
      </section>

      {/* Brand partners list */}
      {partners.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-8 text-center">
          <p className="text-sm text-muted-foreground">No brand partners yet. Add one above.</p>
          <p className="text-xs text-muted-foreground mt-1">
            Brand partners can add CBD and hemp products visible nationwide in the locator.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
              Brand Partners ({partners.length})
            </h2>
          </div>
          <div className="space-y-3">
            {partners.map((p) => {
              const toggleWithArgs = togglePartnerFeatureFlag.bind(null, p.id, p.feature_flag_enabled);
              return (
                <div key={p.id} className="rounded-lg border border-border bg-card p-4 space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Link href={`/admin/partners/${p.id}`}
                          className="text-sm font-semibold text-foreground hover:text-primary hover:underline">
                          {p.company_name}
                        </Link>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${TYPE_COLORS[p.type] ?? 'bg-muted text-muted-foreground'}`}>
                          {TYPE_LABELS[p.type] ?? p.type}
                        </span>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${p.feature_flag_enabled ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                          {p.feature_flag_enabled ? 'Locator ON' : 'Locator OFF'}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {p.email}
                        {p.contact_email && p.contact_email !== p.email && ` · ${p.contact_email}`}
                        {' · '}{p.productCount} product{p.productCount !== 1 ? 's' : ''}
                        {p.region_states && p.region_states.length > 0
                          ? ` · ${p.region_states.join(', ')}`
                          : ' · Nationwide'}
                      </p>
                      {p.website_url && (
                        <a href={p.website_url} target="_blank" rel="noopener noreferrer"
                          className="text-xs text-primary hover:underline">
                          {p.website_url}
                        </a>
                      )}
                      {p.notes && (
                        <p className="text-xs text-muted-foreground italic mt-1">{p.notes}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Link href={`/admin/partners/${p.id}`}
                        className="rounded border border-border px-3 py-1.5 text-xs hover:bg-secondary transition-colors">
                        Details
                      </Link>
                      <form action={toggleWithArgs}>
                        <button type="submit"
                          className="rounded border border-border px-3 py-1.5 text-xs hover:bg-secondary transition-colors">
                          {p.feature_flag_enabled ? 'Disable' : 'Enable'}
                        </button>
                      </form>
                    </div>
                  </div>

                  {/* Quick product count bar */}
                  <div className="flex items-center gap-3 text-xs text-muted-foreground pt-1 border-t border-border/50">
                    <Link href={`/admin/products?partner=${p.id}`}
                      className="text-primary hover:underline">
                      Manage products →
                    </Link>
                    <span>Added {new Date(p.created_at).toLocaleDateString('en-US', { dateStyle: 'medium' })}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <p className="text-xs text-muted-foreground border-t border-border pt-4">
        Brand partners are non-dispensary vendors. Their products appear in the locator for all users
        regardless of state, unless specific states are configured. All products require a COA URL
        before being shown to users.
      </p>
    </div>
  );
}
