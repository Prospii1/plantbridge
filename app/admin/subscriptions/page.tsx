import Link from 'next/link';
import { createSupabaseAdminClient } from '@/lib/server/supabase-admin';
import { DataTable } from '@/components/admin/data-table';

const PAGE_SIZE = 25;

interface PageProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function AdminSubscriptionsPage({ searchParams }: PageProps) {
  const { page: pageStr } = await searchParams;
  const page = Math.max(1, parseInt(pageStr ?? '1', 10));
  const from = (page - 1) * PAGE_SIZE;

  const supabase = createSupabaseAdminClient();

  const { data: subs, count } = await supabase
    .from('subscriptions')
    .select('user_id, tier, status, stripe_customer_id, current_period_end, created_at', {
      count: 'exact',
    })
    .order('created_at', { ascending: false })
    .range(from, from + PAGE_SIZE - 1);

  // Fetch emails for this page
  const { data: authList } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  const emailMap = new Map(
    (authList?.users ?? []).map((u) => [u.id, u.email ?? '—']),
  );

  const rows = (subs ?? []).map((s) => ({
    ...s,
    email: emailMap.get(s.user_id) ?? '—',
  }));

  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE);

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-foreground">Subscriptions</h1>
        <span className="text-sm text-muted-foreground">{count ?? 0} total</span>
      </div>

      <DataTable
        columns={[
          { key: 'email', header: 'User', render: (r) => (
            <Link href={`/admin/users/${r.user_id}`} className="text-primary hover:underline">
              {r.email}
            </Link>
          )},
          { key: 'tier', header: 'Tier', render: (r) => (
            <span className="capitalize">{r.tier}</span>
          )},
          { key: 'status', header: 'Status', render: (r) => (
            <span className={`capitalize font-medium ${r.status === 'past_due' ? 'text-amber-600' : r.status === 'active' ? 'text-primary' : 'text-muted-foreground'}`}>
              {r.status}
            </span>
          )},
          { key: 'customer', header: 'Stripe customer', render: (r) =>
            r.stripe_customer_id ? (
              <span className="font-mono text-xs">{r.stripe_customer_id.slice(0, 14)}…</span>
            ) : '—'
          },
          { key: 'period_end', header: 'Period end', render: (r) =>
            r.current_period_end
              ? new Date(r.current_period_end).toLocaleDateString('en-US', { dateStyle: 'medium' })
              : '—'
          },
        ]}
        rows={rows}
        emptyMessage="No subscriptions found."
      />

      {totalPages > 1 && (
        <div className="flex gap-2">
          {page > 1 && (
            <Link href={`/admin/subscriptions?page=${page - 1}`} className="rounded border border-border px-3 py-1 text-sm hover:bg-secondary">
              ← Previous
            </Link>
          )}
          <span className="px-3 py-1 text-sm text-muted-foreground">Page {page} of {totalPages}</span>
          {page < totalPages && (
            <Link href={`/admin/subscriptions?page=${page + 1}`} className="rounded border border-border px-3 py-1 text-sm hover:bg-secondary">
              Next →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
