import { createSupabaseAdminClient } from '@/lib/server/supabase-admin';
import { StatCard } from '@/components/admin/stat-card';
import Link from 'next/link';

async function getStats() {
  const supabase = createSupabaseAdminClient();
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [users, activeSubs, intakes, outcomes] = await Promise.all([
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
    supabase.from('subscriptions').select('id', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('intake_sessions').select('id', { count: 'exact', head: true }).gte('completed_at', weekAgo),
    supabase.from('outcome_logs').select('id', { count: 'exact', head: true }).gte('logged_at', weekAgo),
  ]);

  return {
    totalUsers: users.count ?? 0,
    activeSubs: activeSubs.count ?? 0,
    intakesThisWeek: intakes.count ?? 0,
    outcomesThisWeek: outcomes.count ?? 0,
  };
}

export default async function AdminDashboardPage() {
  const stats = await getStats();

  return (
    <div className="max-w-4xl space-y-8">
      <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Total users" value={stats.totalUsers} description="All registered profiles" />
        <StatCard label="Active subs" value={stats.activeSubs} description="Subscriptions with active status" />
        <StatCard label="Intakes (7d)" value={stats.intakesThisWeek} description="Completed this week" />
        <StatCard label="Outcomes (7d)" value={stats.outcomesThisWeek} description="Logs submitted this week" />
      </div>

      <nav className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { href: '/admin/users', label: 'Users' },
          { href: '/admin/subscriptions', label: 'Subscriptions' },
          { href: '/admin/content', label: 'Rules Engine' },
          { href: '/admin/education', label: 'Education' },
          { href: '/admin/coaches', label: 'Coaches' },
          { href: '/admin/partners', label: 'Partners' },
          { href: '/admin/brand-partners', label: 'Brand Partners' },
          { href: '/admin/products', label: 'Products & COAs' },
          { href: '/admin/media', label: 'Media Hub' },
          { href: '/admin/analytics', label: 'Analytics' },
        ].map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className="rounded-lg border border-border bg-card px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
          >
            {label} →
          </Link>
        ))}
      </nav>
    </div>
  );
}
