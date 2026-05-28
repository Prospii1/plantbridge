import Link from 'next/link';
import { createSupabaseAdminClient } from '@/lib/server/supabase-admin';
import { DataTable } from '@/components/admin/data-table';

export default async function AdminCoachesPage() {
  const supabase = createSupabaseAdminClient();

  const [coachesRes, clientCountRes, authListRes] = await Promise.all([
    supabase.from('coaches').select('id, user_id, bio, verified_at, created_at').order('created_at', { ascending: false }),
    supabase.from('coach_clients').select('coach_id').eq('status', 'active'),
    supabase.auth.admin.listUsers({ perPage: 1000 }),
  ]);

  const emailMap = new Map(
    (authListRes.data?.users ?? []).map((u) => [u.id, u.email ?? '—']),
  );

  const clientCounts = (clientCountRes.data ?? []).reduce<Record<string, number>>((acc, row) => {
    acc[row.coach_id] = (acc[row.coach_id] ?? 0) + 1;
    return acc;
  }, {});

  const rows = (coachesRes.data ?? []).map((c) => ({
    id: c.id,
    user_id: c.user_id,
    email: emailMap.get(c.user_id) ?? '—',
    bio: c.bio ? c.bio.slice(0, 60) + (c.bio.length > 60 ? '…' : '') : '—',
    verified: c.verified_at ? new Date(c.verified_at).toLocaleDateString('en-US', { dateStyle: 'medium' }) : 'Pending',
    clients: clientCounts[c.user_id] ?? 0,
  }));

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-foreground">Coaches</h1>
        <span className="text-sm text-muted-foreground">{rows.length} total</span>
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">No coaches yet. Promote a user to coach role via User detail, then their profile will appear here.</p>
      ) : (
        <DataTable
          columns={[
            { key: 'email', header: 'Email' },
            { key: 'bio', header: 'Bio' },
            { key: 'verified', header: 'Verified' },
            { key: 'clients', header: 'Clients' },
            {
              key: 'actions',
              header: '',
              render: (row) => (
                <Link href={`/admin/coaches/${row.id}`} className="text-sm text-primary hover:underline">
                  Manage →
                </Link>
              ),
            },
          ]}
          rows={rows}
        />
      )}
    </div>
  );
}
