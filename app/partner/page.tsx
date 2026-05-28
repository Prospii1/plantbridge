import { createSupabaseServerClient } from '@/lib/server/supabase-server';
import { createSupabaseAdminClient } from '@/lib/server/supabase-admin';

export default async function PartnerDashboardPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const adminSupabase = createSupabaseAdminClient();

  const [partnerRes, productCountRes] = await Promise.all([
    adminSupabase.from('partners').select('*').eq('user_id', user.id).single(),
    adminSupabase
      .from('dispensary_products')
      .select('id', { count: 'exact', head: true })
      .eq('partner_id',
        (await adminSupabase.from('partners').select('id').eq('user_id', user.id).single()).data?.id ?? ''),
  ]);

  const partner = partnerRes.data;
  const productCount = productCountRes.count ?? 0;

  if (!partner) {
    return (
      <div className="max-w-2xl py-8">
        <p className="text-sm text-muted-foreground">Partner profile not found. Contact an admin.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-8 py-8">
      <h1 className="text-2xl font-semibold text-foreground">{partner.company_name}</h1>

      <div className="rounded-lg border border-border bg-card p-5 space-y-4">
        <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">Company Info</h2>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Type</dt>
            <dd className="capitalize text-foreground">{partner.type}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">States</dt>
            <dd className="text-foreground">{partner.region_states?.join(', ') || '—'}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Contact email</dt>
            <dd className="text-foreground">{partner.contact_email ?? '—'}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Locator enabled</dt>
            <dd className="text-foreground">{partner.feature_flag_enabled ? 'Yes' : 'No — contact admin'}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Products listed</dt>
            <dd className="text-foreground">{productCount}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
