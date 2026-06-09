import Link from 'next/link';
import { createSupabaseAdminClient } from '@/lib/server/supabase-admin';
import { DataTable } from '@/components/admin/data-table';

const PAGE_SIZE = 25;
const TIERS = ['free', 'self_guided', 'guided', 'concierge'] as const;
type Tier = (typeof TIERS)[number];

interface PageProps {
  searchParams: Promise<{ page?: string; tier?: string }>;
}

export default async function AdminUsersPage({ searchParams }: PageProps) {
  const { page: pageStr, tier: tierParam } = await searchParams;
  const page = Math.max(1, parseInt(pageStr ?? '1', 10));
  const from = (page - 1) * PAGE_SIZE;
  const activeTier = TIERS.includes(tierParam as Tier) ? (tierParam as Tier) : null;

  const supabase = createSupabaseAdminClient();

  // Fetch profiles with pagination
  let query = supabase
    .from('profiles')
    .select('user_id, role, state, subscription_tier, age_verified_at, created_at', {
      count: 'exact',
    })
    .order('created_at', { ascending: false })
    .range(from, from + PAGE_SIZE - 1);

  if (activeTier) query = query.eq('subscription_tier', activeTier);

  const { data: profiles, count } = await query;

  const { data: authList } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  const emailMap = new Map(
    (authList?.users ?? []).map((u) => [u.id, u.email ?? '—']),
  );

  const rows = (profiles ?? []).map((p) => ({
    ...p,
    email: emailMap.get(p.user_id) ?? '—',
  }));

  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE);

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-foreground">Users</h1>
        <span className="text-sm text-muted-foreground">{count ?? 0} total</span>
      </div>

      {/* Tier filter */}
      <div className="flex flex-wrap gap-2">
        <Link
          href="/admin/users"
          className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${!activeTier ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:border-primary/50'}`}
        >
          All
        </Link>
        {TIERS.map((t) => (
          <Link
            key={t}
            href={`/admin/users?tier=${t}`}
            className={`rounded-full px-3 py-1 text-xs font-medium border capitalize transition-colors ${activeTier === t ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:border-primary/50'}`}
          >
            {t.replace('_', ' ')}
          </Link>
        ))}
      </div>

      <DataTable
        columns={[
          { key: 'email', header: 'Email', render: (r) => (
            <Link href={`/admin/users/${r.user_id}`} className="text-primary hover:underline">
              {r.email}
            </Link>
          )},
          { key: 'role', header: 'Role', render: (r) => (
            <span className={`capitalize ${r.role === 'admin' ? 'text-primary font-medium' : ''}`}>{r.role}</span>
          )},
          { key: 'state', header: 'State', render: (r) => r.state ?? '—' },
          { key: 'tier', header: 'Tier', render: (r) => (
            <span className="capitalize">{r.subscription_tier}</span>
          )},
          { key: 'age', header: 'Age verified', render: (r) => r.age_verified_at ? '✓' : '—' },
          { key: 'created', header: 'Joined', render: (r) => (
            new Date(r.created_at).toLocaleDateString('en-US', { dateStyle: 'medium' })
          )},
        ]}
        rows={rows}
        emptyMessage="No users found."
      />

      {totalPages > 1 && (
        <div className="flex gap-2">
          {page > 1 && (
            <Link href={`/admin/users?page=${page - 1}${activeTier ? `&tier=${activeTier}` : ''}`} className="rounded border border-border px-3 py-1 text-sm hover:bg-secondary">
              ← Previous
            </Link>
          )}
          <span className="px-3 py-1 text-sm text-muted-foreground">Page {page} of {totalPages}</span>
          {page < totalPages && (
            <Link href={`/admin/users?page=${page + 1}${activeTier ? `&tier=${activeTier}` : ''}`} className="rounded border border-border px-3 py-1 text-sm hover:bg-secondary">
              Next →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
