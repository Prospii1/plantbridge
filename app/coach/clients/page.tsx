import Link from 'next/link';
import { createSupabaseServerClient } from '@/lib/server/supabase-server';
import { createSupabaseAdminClient } from '@/lib/server/supabase-admin';

export default async function CoachClientsPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const adminSupabase = createSupabaseAdminClient();

  const [clientsRes, authListRes] = await Promise.all([
    adminSupabase
      .from('coach_clients')
      .select('id, user_id, assigned_at, notes')
      .eq('coach_id', user.id)
      .eq('status', 'active')
      .order('assigned_at', { ascending: false }),
    adminSupabase.auth.admin.listUsers({ perPage: 1000 }),
  ]);

  const emailMap = new Map(
    (authListRes.data?.users ?? []).map((u) => [u.id, u.email ?? '—']),
  );

  const userIds = (clientsRes.data ?? []).map((c) => c.user_id);

  const [plansRes, outcomesRes] = await Promise.all([
    userIds.length > 0
      ? adminSupabase
          .from('care_plans')
          .select('user_id, status')
          .in('user_id', userIds)
          .eq('status', 'active')
      : Promise.resolve({ data: [] }),
    userIds.length > 0
      ? adminSupabase
          .from('outcome_logs')
          .select('user_id, logged_at')
          .in('user_id', userIds)
          .order('logged_at', { ascending: false })
      : Promise.resolve({ data: [] }),
  ]);

  const activePlanSet = new Set((plansRes.data ?? []).map((p) => p.user_id));
  const lastOutcomeMap = new Map<string, string>();
  for (const o of outcomesRes.data ?? []) {
    if (!lastOutcomeMap.has(o.user_id)) {
      lastOutcomeMap.set(o.user_id, o.logged_at);
    }
  }

  const clients = (clientsRes.data ?? []).map((c) => ({
    ...c,
    email: emailMap.get(c.user_id) ?? '—',
    hasActivePlan: activePlanSet.has(c.user_id),
    lastOutcome: lastOutcomeMap.get(c.user_id) ?? null,
  }));

  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-xl font-semibold text-foreground">My Clients</h1>

      {clients.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-8 text-center">
          <p className="text-sm text-muted-foreground">No active clients assigned yet. Contact an admin to assign users to your coaching roster.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {clients.map((c) => (
            <li key={c.id}>
              <Link
                href={`/coach/clients/${c.user_id}`}
                className="flex items-center justify-between rounded-lg border border-border bg-card p-4 transition-colors hover:bg-secondary"
              >
                <div className="space-y-0.5">
                  <p className="text-sm font-medium text-foreground">{c.email}</p>
                  <p className="text-xs text-muted-foreground">
                    Assigned {new Date(c.assigned_at).toLocaleDateString('en-US', { dateStyle: 'medium' })}
                    {c.lastOutcome && (
                      <> · Last outcome {new Date(c.lastOutcome).toLocaleDateString('en-US', { dateStyle: 'medium' })}</>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  {c.hasActivePlan && (
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-primary">Active plan</span>
                  )}
                  <span className="text-muted-foreground">→</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
