import Link from 'next/link';
import { createSupabaseServerClient } from '@/lib/server/supabase-server';
import { createSupabaseAdminClient } from '@/lib/server/supabase-admin';

const ALERT_RATING_THRESHOLD = 3;
const RECENT_DAYS = 7;

export default async function CoachDashboardPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const adminSupabase = createSupabaseAdminClient();
  const weekAgo = new Date(Date.now() - RECENT_DAYS * 24 * 60 * 60 * 1000).toISOString();

  const [clientsRes, bookingsRes, convsRes, authListRes] = await Promise.all([
    adminSupabase
      .from('coach_clients')
      .select('id, user_id, assigned_at')
      .eq('coach_id', user.id)
      .eq('status', 'active'),
    adminSupabase
      .from('bookings')
      .select('id, user_id, scheduled_at, status')
      .eq('coach_id', user.id)
      .in('status', ['pending', 'confirmed'])
      .gte('scheduled_at', new Date().toISOString())
      .order('scheduled_at')
      .limit(5),
    adminSupabase
      .from('conversations')
      .select('id, user_id, last_message_at')
      .eq('coach_id', user.id)
      .order('last_message_at', { ascending: false, nullsFirst: false })
      .limit(5),
    adminSupabase.auth.admin.listUsers({ perPage: 1000 }),
  ]);

  const clients    = clientsRes.data ?? [];
  const bookings   = bookingsRes.data ?? [];
  const convs      = convsRes.data ?? [];
  const emailMap   = new Map((authListRes.data?.users ?? []).map((u) => [u.id, u.email ?? '—']));
  const clientUserIds = clients.map((c) => c.user_id);

  // Fetch recent outcome logs for all clients to detect alerts
  const outcomesRes = clientUserIds.length > 0
    ? await adminSupabase
        .from('outcome_logs')
        .select('id, user_id, rating, logged_at, metadata')
        .in('user_id', clientUserIds)
        .gte('logged_at', weekAgo)
        .order('logged_at', { ascending: false })
    : { data: [] };

  const recentOutcomes = outcomesRes.data ?? [];

  // Compute per-client avg rating + severe flag this week
  type ClientAlert = { userId: string; email: string; avgRating: number; hasSevere: boolean; lastLogged: string };
  const clientAlerts: ClientAlert[] = [];

  for (const client of clients) {
    const logs = recentOutcomes.filter((o) => o.user_id === client.user_id);
    if (logs.length === 0) continue;

    const avgRating = logs.reduce((s, o) => s + o.rating, 0) / logs.length;
    const hasSevere = logs.some((o) => {
      const meta = (o.metadata ?? {}) as Record<string, unknown>;
      return meta.side_effects === 'severe';
    });

    if (avgRating < ALERT_RATING_THRESHOLD || hasSevere) {
      clientAlerts.push({
        userId: client.user_id,
        email: emailMap.get(client.user_id) ?? '—',
        avgRating: Math.round(avgRating * 10) / 10,
        hasSevere,
        lastLogged: logs[0]!.logged_at,
      });
    }
  }

  const pendingBookings = bookings.filter((b) => b.status === 'pending');

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Coach Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Good {getTimeOfDay()} — here&apos;s your overview.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Active clients', value: clients.length, href: '/coach/clients' },
          { label: 'Pending bookings', value: pendingBookings.length, href: '/coach/schedule' },
          { label: 'Upcoming sessions', value: bookings.length, href: '/coach/schedule' },
          { label: 'Conversations', value: convs.length, href: '/coach/messages' },
        ].map(({ label, value, href }) => (
          <Link
            key={label}
            href={href}
            className="rounded-2xl border border-border bg-card p-4 text-center card-shadow hover:bg-secondary transition-colors"
          >
            <p className="font-display text-2xl font-medium text-primary">{value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
          </Link>
        ))}
      </div>

      {/* Outcome alerts */}
      {clientAlerts.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500" aria-hidden="true">
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            <h2 className="text-sm font-semibold text-foreground">Client alerts — last 7 days</h2>
          </div>
          <div className="space-y-2">
            {clientAlerts.map((alert) => (
              <Link
                key={alert.userId}
                href={`/coach/clients/${alert.userId}`}
                className="flex items-center justify-between rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 hover:bg-amber-100 transition-colors"
              >
                <div className="space-y-0.5">
                  <p className="text-sm font-medium text-amber-900">{alert.email}</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    {alert.hasSevere && (
                      <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-700">
                        Severe side effects reported
                      </span>
                    )}
                    {alert.avgRating < ALERT_RATING_THRESHOLD && (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                        Avg effectiveness {alert.avgRating}/5
                      </span>
                    )}
                    <span className="text-[10px] text-amber-600">
                      Last logged {new Date(alert.lastLogged).toLocaleDateString('en-US', { dateStyle: 'medium' })}
                    </span>
                  </div>
                </div>
                <span className="text-amber-600 text-sm">→</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Upcoming bookings */}
      {bookings.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground">Upcoming sessions</h2>
          <div className="space-y-2">
            {bookings.map((b) => (
              <div key={b.id} className="flex items-center justify-between rounded-2xl border border-border bg-card px-4 py-3 card-shadow">
                <div className="space-y-0.5">
                  <p className="text-sm font-medium text-foreground">{emailMap.get(b.user_id) ?? '—'}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(b.scheduled_at).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
                  </p>
                </div>
                <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold capitalize ${
                  b.status === 'confirmed' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                }`}>
                  {b.status}
                </span>
              </div>
            ))}
          </div>
          <Link href="/coach/schedule" className="text-sm font-medium text-primary hover:underline">
            View full schedule →
          </Link>
        </section>
      )}

      {/* Recent conversations */}
      {convs.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground">Recent conversations</h2>
          <div className="space-y-2">
            {convs.map((c) => (
              <Link
                key={c.id}
                href={`/coach/messages/${c.id}`}
                className="flex items-center justify-between rounded-2xl border border-border bg-card px-4 py-3 hover:bg-secondary transition-colors card-shadow"
              >
                <span className="text-sm font-medium text-foreground">{emailMap.get(c.user_id) ?? '—'}</span>
                <span className="text-xs text-muted-foreground">
                  {c.last_message_at
                    ? new Date(c.last_message_at).toLocaleDateString('en-US', { dateStyle: 'medium' })
                    : 'No messages'}
                </span>
              </Link>
            ))}
          </div>
          <Link href="/coach/messages" className="text-sm font-medium text-primary hover:underline">
            View all messages →
          </Link>
        </section>
      )}

      {clients.length === 0 && clientAlerts.length === 0 && bookings.length === 0 && (
        <div className="rounded-2xl border border-border bg-card p-8 text-center space-y-2">
          <p className="text-sm text-muted-foreground">No active clients yet.</p>
          <p className="text-xs text-muted-foreground">Contact an admin to have users assigned to your coaching roster.</p>
        </div>
      )}
    </div>
  );
}

function getTimeOfDay(): string {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}
