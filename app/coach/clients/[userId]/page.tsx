import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createSupabaseServerClient } from '@/lib/server/supabase-server';
import { createSupabaseAdminClient } from '@/lib/server/supabase-admin';
import { updateCoachNotes } from '../actions';

interface Props {
  params: Promise<{ userId: string }>;
}

export default async function CoachClientDetailPage({ params }: Props) {
  const { userId } = await params;

  const supabase = await createSupabaseServerClient();
  const { data: { user: coach } } = await supabase.auth.getUser();
  if (!coach) return null;

  const adminSupabase = createSupabaseAdminClient();

  const [assignmentRes, authUserRes, planRes, outcomesRes] = await Promise.all([
    adminSupabase
      .from('coach_clients')
      .select('id, assigned_at, notes')
      .eq('coach_id', coach.id)
      .eq('user_id', userId)
      .eq('status', 'active')
      .single(),
    adminSupabase.auth.admin.getUserById(userId),
    adminSupabase
      .from('care_plans')
      .select('id, status, engine_version, rules_version, created_at')
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .single(),
    adminSupabase
      .from('outcome_logs')
      .select('id, logged_at, rating, notes, metadata')
      .eq('user_id', userId)
      .order('logged_at', { ascending: false })
      .limit(10),
  ]);

  if (!assignmentRes.data) notFound();

  const assignment = assignmentRes.data;
  const clientEmail = authUserRes.data.user?.email ?? userId;
  const plan = planRes.data;
  const outcomes = outcomesRes.data ?? [];

  const updateNotesWithId = updateCoachNotes.bind(null, userId);

  let planItems: { id: string; category: string; subject: string; confidence: number }[] = [];
  if (plan) {
    const itemsRes = await adminSupabase
      .from('care_plan_items')
      .select('id, category, subject, confidence')
      .eq('care_plan_id', plan.id)
      .order('display_order');
    planItems = itemsRes.data ?? [];
  }

  return (
    <div className="max-w-2xl space-y-8">
      <div className="flex items-center gap-3">
        <Link href="/coach/clients" className="text-sm text-muted-foreground hover:text-foreground">
          ← Clients
        </Link>
        <h1 className="text-xl font-semibold text-foreground">{clientEmail}</h1>
      </div>

      {/* Active care plan */}
      <section className="rounded-lg border border-border bg-card p-5 space-y-4">
        <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">Active Care Plan</h2>
        {plan ? (
          <>
            <p className="text-xs text-muted-foreground">
              Rules v{plan.rules_version} · Engine v{plan.engine_version} ·{' '}
              Created {new Date(plan.created_at).toLocaleDateString('en-US', { dateStyle: 'medium' })}
            </p>
            {planItems.length > 0 ? (
              <ul className="space-y-2">
                {planItems.map((item) => (
                  <li key={item.id} className="flex items-center justify-between text-sm">
                    <span className="capitalize text-foreground">
                      {item.category}: {item.subject}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {Math.round(item.confidence * 100)}% confidence
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No items in care plan.</p>
            )}
          </>
        ) : (
          <p className="text-sm text-muted-foreground">No active care plan.</p>
        )}
      </section>

      {/* Recent outcomes */}
      <section className="rounded-lg border border-border bg-card p-5 space-y-3">
        <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">Recent Outcome Logs</h2>
        {outcomes.length > 0 ? (
          <ul className="space-y-3">
            {outcomes.map((o) => {
              const meta = (o.metadata ?? {}) as Record<string, unknown>;
              const sideEffects  = meta.side_effects  as string | undefined;
              const symptomLevel = meta.symptom_level as number | undefined;
              const doseTaken    = meta.dose_taken    as string | undefined;
              const isSevere     = sideEffects === 'severe';

              return (
                <li
                  key={o.id}
                  className={`rounded-lg p-3 space-y-2 text-sm ${isSevere ? 'border border-red-200 bg-red-50' : 'border border-border/60 bg-muted/20'}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-foreground">{o.rating}/5 effective</span>
                      {symptomLevel !== undefined && (
                        <span className="text-xs text-muted-foreground">· symptom {symptomLevel}/10</span>
                      )}
                      {doseTaken && (
                        <span className="rounded-full border border-border bg-card px-2 py-0.5 text-xs text-muted-foreground">
                          {doseTaken}
                        </span>
                      )}
                      {sideEffects && sideEffects !== 'none' && (
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          isSevere ? 'bg-red-100 text-red-700'
                          : sideEffects === 'moderate' ? 'bg-orange-100 text-orange-700'
                          : 'bg-amber-100 text-amber-700'
                        }`}>
                          {sideEffects} side effects
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {new Date(o.logged_at).toLocaleDateString('en-US', { dateStyle: 'medium' })}
                    </span>
                  </div>
                  {o.notes && <p className="text-xs text-muted-foreground">{o.notes}</p>}
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">No outcome logs yet.</p>
        )}
      </section>

      {/* Coach notes */}
      <section className="rounded-lg border border-border bg-card p-5 space-y-3">
        <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">Coach Notes</h2>
        <p className="text-xs text-muted-foreground">Private notes visible only to you.</p>
        <form action={updateNotesWithId} className="space-y-3">
          <textarea
            name="notes"
            defaultValue={assignment.notes ?? ''}
            rows={4}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            placeholder="Add notes about this client…"
          />
          <button
            type="submit"
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Save notes
          </button>
        </form>
      </section>

      <div className="flex gap-3">
        <Link
          href={`/coach/messages?start=${userId}`}
          className="rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-secondary"
        >
          Message client →
        </Link>
      </div>
    </div>
  );
}
