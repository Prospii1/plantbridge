import Link from 'next/link';
import { createSupabaseServerClient } from '@/lib/server/supabase-server';
import { OutcomeLogForm } from '@/components/tracking/outcome-log-form';
import { DISCLAIMERS } from '@/lib/shared/copy/disclaimers';
import { getUserTier } from '@/lib/server/subscriptions';
import { hasAccess } from '@/lib/shared/utils/tier';
import { UpgradeGate } from '@/components/shared/upgrade-gate';

const SIDE_EFFECT_LABEL: Record<string, string> = {
  none:     'No side effects',
  mild:     'Mild effects',
  moderate: 'Moderate effects',
  severe:   'Severe effects',
};

const SIDE_EFFECT_COLOR: Record<string, string> = {
  none:     'bg-secondary text-secondary-foreground',
  mild:     'bg-amber-100 text-amber-700',
  moderate: 'bg-orange-100 text-orange-700',
  severe:   'bg-red-100 text-red-700',
};

export default async function TrackingPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const tier = await getUserTier(user.id);
  if (!hasAccess(tier, 'self_guided')) {
    return (
      <UpgradeGate
        feature="Outcome tracking"
        description="Track how each recommendation is working for you over time. Log doses, side effects, and symptom levels to build your personal wellness data."
        bullets={[
          'Log effectiveness after every use',
          'Track dose taken, side effects, and symptom level',
          'See your trend chart over time',
          'Build data that improves your care plan',
        ]}
      />
    );
  }

  const { data: items } = await supabase
    .from('care_plan_items')
    .select(`id, subject, category, confidence, care_plans!inner(status)`)
    .eq('user_id', user.id)
    .eq('care_plans.status', 'active')
    .order('display_order');

  const { data: recentLogs } = await supabase
    .from('outcome_logs')
    .select('id, care_plan_item_id, rating, notes, logged_at, metadata')
    .eq('user_id', user.id)
    .order('logged_at', { ascending: false })
    .limit(12);

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      {/* Header */}
      <div className="space-y-1 pt-2">
        <h1 className="font-display text-2xl font-medium text-foreground">Track outcomes</h1>
        <p className="text-sm text-muted-foreground">Log how each recommendation is working for you.</p>
      </div>

      {/* Care plan items to log */}
      {!items || items.length === 0 ? (
        <div className="rounded-2xl border border-border bg-secondary p-8 text-center space-y-4">
          <p className="text-muted-foreground text-sm">Complete your intake first to get personalized items to track.</p>
          <Link
            href="/onboarding"
            className="inline-flex rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
          >
            Start intake →
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <div key={item.id} className="rounded-2xl border border-border bg-card p-5 space-y-4 card-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-widest text-primary">
                    {item.category}
                  </span>
                  <h2 className="font-semibold capitalize text-foreground mt-0.5">{item.subject}</h2>
                </div>
                <span className="shrink-0 rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground">
                  {Math.round(item.confidence * 100)}% match
                </span>
              </div>
              <OutcomeLogForm carePlanItemId={item.id} subject={item.subject} />
            </div>
          ))}
        </div>
      )}

      {/* Recent check-ins */}
      {recentLogs && recentLogs.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">Recent check-ins</h2>
          <div className="space-y-3">
            {recentLogs.map((logEntry) => {
              const meta = (logEntry.metadata ?? {}) as Record<string, unknown>;
              const sideEffects = meta.side_effects as string | undefined;
              const symptomLevel = meta.symptom_level as number | undefined;
              const doseTaken = meta.dose_taken as string | undefined;

              return (
                <div
                  key={logEntry.id}
                  className="rounded-2xl border border-border/60 bg-muted/20 px-4 py-3 space-y-2"
                >
                  {/* Row 1: date + rating */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {new Date(logEntry.logged_at).toLocaleDateString('en-US', { dateStyle: 'medium' })}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-semibold text-secondary-foreground">
                        {logEntry.rating}/5 effective
                      </span>
                      {symptomLevel !== undefined && (
                        <span className="rounded-full border border-border px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                          symptom {symptomLevel}/10
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Row 2: badges */}
                  {(doseTaken || sideEffects) && (
                    <div className="flex flex-wrap gap-1.5">
                      {doseTaken && (
                        <span className="inline-flex items-center rounded-full border border-border bg-card px-2.5 py-0.5 text-xs text-muted-foreground">
                          {doseTaken}
                        </span>
                      )}
                      {sideEffects && (
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${SIDE_EFFECT_COLOR[sideEffects] ?? 'bg-secondary text-secondary-foreground'}`}>
                          {SIDE_EFFECT_LABEL[sideEffects] ?? sideEffects}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Row 3: notes */}
                  {logEntry.notes && (
                    <p className="text-sm text-foreground">{logEntry.notes}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <p className="text-xs text-muted-foreground pb-2">{DISCLAIMERS.outcomeLog}</p>
    </div>
  );
}
