import Link from 'next/link';
import { createSupabaseAdminClient } from '@/lib/server/supabase-admin';
import { createPartner, togglePartnerFeatureFlag } from './actions';

export default async function AdminPartnersPage() {
  const supabase = createSupabaseAdminClient();

  const [partnersRes, productCountRes, authListRes] = await Promise.all([
    supabase.from('partners').select('id, user_id, company_name, type, region_states, feature_flag_enabled, created_at').order('created_at', { ascending: false }),
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
      <h1 className="text-xl font-semibold text-foreground">Partners</h1>

      {/* Create partner form */}
      <section className="rounded-lg border border-border bg-card p-5 space-y-4">
        <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">Add Partner</h2>
        <form action={createPartner} className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">User email</label>
            <input type="email" name="email" required placeholder="user@example.com"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Company name</label>
            <input type="text" name="company_name" required placeholder="Green Leaf Wellness"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Type</label>
            <select name="type"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
              <option value="dispensary">Dispensary</option>
              <option value="delivery">Delivery</option>
              <option value="wholesaler">Wholesaler</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Contact email (optional)</label>
            <input type="email" name="contact_email" placeholder="info@example.com"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <div className="col-span-2 space-y-1">
            <label className="text-xs text-muted-foreground">States (comma-separated, e.g. CA, CO, WA)</label>
            <input type="text" name="region_states" placeholder="CA, CO, WA"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <div className="col-span-2">
            <button type="submit"
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
              Create partner
            </button>
          </div>
        </form>
      </section>

      {/* Partners list */}
      {partners.length === 0 ? (
        <p className="text-sm text-muted-foreground">No partners yet.</p>
      ) : (
        <ul className="space-y-3">
          {partners.map((p) => {
            const toggleWithArgs = togglePartnerFeatureFlag.bind(null, p.id, p.feature_flag_enabled);
            return (
              <li key={p.id} className="rounded-lg border border-border bg-card p-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-0.5">
                    <Link href={`/admin/partners/${p.id}`} className="text-sm font-medium text-foreground hover:underline">
                      {p.company_name}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      {p.email} · {p.type} · {p.region_states?.join(', ') || '—'} · {p.productCount} products
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-medium ${p.feature_flag_enabled ? 'text-primary' : 'text-muted-foreground'}`}>
                      {p.feature_flag_enabled ? 'Locator: ON' : 'Locator: OFF'}
                    </span>
                    <form action={toggleWithArgs}>
                      <button type="submit"
                        className="rounded border border-border px-3 py-1 text-xs hover:bg-secondary">
                        Toggle
                      </button>
                    </form>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
