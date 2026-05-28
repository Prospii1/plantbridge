import { notFound } from 'next/navigation';
import { createSupabaseAdminClient } from '@/lib/server/supabase-admin';
import { updateDutchieRetailerId, triggerDutchieSync } from './actions';

interface PageProps {
  params: Promise<{ partnerId: string }>;
}

export default async function AdminPartnerDetailPage({ params }: PageProps) {
  const { partnerId } = await params;
  const supabase = createSupabaseAdminClient();

  const [partnerRes, syncLogRes] = await Promise.all([
    supabase
      .from('partners')
      .select('id, company_name, type, region_states, feature_flag_enabled, contact_email, dutchie_retailer_id')
      .eq('id', partnerId)
      .single(),
    supabase
      .from('dutchie_sync_log')
      .select('synced_at, product_count, error')
      .eq('partner_id', partnerId)
      .order('synced_at', { ascending: false })
      .limit(5),
  ]);

  if (!partnerRes.data) notFound();
  const partner = partnerRes.data;
  const syncLogs = syncLogRes.data ?? [];

  const updateWithId = updateDutchieRetailerId.bind(null, partnerId);
  const syncWithId = triggerDutchieSync.bind(null, partnerId);

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-foreground">{partner.company_name}</h1>
        <p className="text-sm text-muted-foreground capitalize">
          {partner.type} · {partner.region_states?.join(', ') || '—'}
        </p>
      </div>

      {/* Dutchie Integration */}
      <section className="rounded-lg border border-border bg-card p-5 space-y-4">
        <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">Dutchie Integration</h2>
        <form action={updateWithId} className="flex gap-3">
          <div className="flex-1 space-y-1">
            <label className="text-xs text-muted-foreground">Dutchie Retailer ID</label>
            <input
              type="text"
              name="dutchie_retailer_id"
              defaultValue={partner.dutchie_retailer_id ?? ''}
              placeholder="retailer-uuid-from-dutchie"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div className="flex items-end">
            <button type="submit"
              className="rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-secondary">
              Save
            </button>
          </div>
        </form>

        {partner.dutchie_retailer_id && (
          <form action={syncWithId}>
            <button type="submit"
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
              Trigger sync now
            </button>
          </form>
        )}
      </section>

      {/* Sync history */}
      {syncLogs.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">Recent Sync Runs</h2>
          <ul className="space-y-2">
            {syncLogs.map((log, i) => (
              <li key={i} className="rounded-lg border border-border bg-card p-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">
                    {new Date(log.synced_at).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
                  </span>
                  <span className={log.error ? 'text-destructive' : 'text-primary'}>
                    {log.error ? 'Failed' : `${log.product_count} products`}
                  </span>
                </div>
                {log.error && <p className="mt-1 text-destructive/80">{log.error}</p>}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
