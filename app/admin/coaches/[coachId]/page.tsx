import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createSupabaseAdminClient } from '@/lib/server/supabase-admin';
import { verifyCoach, assignClientToCoach, removeClientAssignment } from '../actions';

interface Props {
  params: Promise<{ coachId: string }>;
}

export default async function AdminCoachDetailPage({ params }: Props) {
  const { coachId } = await params;
  const supabase = createSupabaseAdminClient();

  const coachRes = await supabase.from('coaches').select('*').eq('id', coachId).single();
  if (!coachRes.data) notFound();
  const coach = coachRes.data;

  const [clientsRes, authListRes] = await Promise.all([
    supabase
      .from('coach_clients')
      .select('id, user_id, assigned_at, status, notes')
      .eq('coach_id', coach.user_id)
      .eq('status', 'active'),
    supabase.auth.admin.listUsers({ perPage: 1000 }),
  ]);
  const emailMap = new Map(
    (authListRes.data?.users ?? []).map((u) => [u.id, u.email ?? '—']),
  );
  const coachEmail = emailMap.get(coach.user_id) ?? '—';
  const clients = clientsRes.data ?? [];

  const verifyWithId = verifyCoach.bind(null, coachId);
  const assignWithId = assignClientToCoach.bind(null, coach.user_id);

  return (
    <div className="max-w-2xl space-y-8">
      <div className="flex items-center gap-3">
        <Link href="/admin/coaches" className="text-sm text-muted-foreground hover:text-foreground">
          ← Coaches
        </Link>
        <h1 className="text-xl font-semibold text-foreground">{coachEmail}</h1>
      </div>

      {/* Coach profile */}
      <section className="rounded-lg border border-border bg-card p-5 space-y-4">
        <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">Profile</h2>
        <dl className="grid grid-cols-2 gap-3 text-sm">
          {[
            ['Email', coachEmail],
            ['Bio', coach.bio ?? '—'],
            ['Specialization', coach.specialization?.join(', ') || '—'],
            ['Timezone', coach.availability_timezone],
            ['Verified', coach.verified_at
              ? new Date(coach.verified_at).toLocaleDateString('en-US', { dateStyle: 'medium' })
              : 'Pending'],
          ].map(([label, val]) => (
            <div key={label as string}>
              <dt className="text-xs text-muted-foreground">{label}</dt>
              <dd className="text-foreground">{val as string}</dd>
            </div>
          ))}
        </dl>

        {!coach.verified_at && (
          <form action={verifyWithId}>
            <button
              type="submit"
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Verify coach
            </button>
          </form>
        )}
      </section>

      {/* Assign client */}
      <section className="rounded-lg border border-border bg-card p-5 space-y-4">
        <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">Assign Client</h2>
        <form action={assignWithId} className="flex gap-3">
          <input
            type="email"
            name="email"
            required
            placeholder="user@example.com"
            className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <button
            type="submit"
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Assign
          </button>
        </form>
      </section>

      {/* Active clients */}
      <section className="rounded-lg border border-border bg-card p-5 space-y-4">
        <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
          Active Clients ({clients.length})
        </h2>
        {clients.length === 0 ? (
          <p className="text-sm text-muted-foreground">No active clients assigned.</p>
        ) : (
          <ul className="space-y-3">
            {clients.map((c) => {
              const removeWithId = removeClientAssignment.bind(null, c.id, coach.user_id);
              return (
                <li key={c.id} className="flex items-center justify-between text-sm">
                  <div>
                    <p className="text-foreground">{emailMap.get(c.user_id) ?? c.user_id}</p>
                    <p className="text-xs text-muted-foreground">
                      Assigned {new Date(c.assigned_at).toLocaleDateString('en-US', { dateStyle: 'medium' })}
                    </p>
                  </div>
                  <form action={removeWithId}>
                    <button
                      type="submit"
                      className="rounded-md border border-border px-3 py-1.5 text-xs text-muted-foreground hover:bg-secondary"
                    >
                      End assignment
                    </button>
                  </form>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
