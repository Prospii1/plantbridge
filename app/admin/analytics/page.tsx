import { createSupabaseAdminClient } from '@/lib/server/supabase-admin';
import { computeUserTrends } from '@/lib/server/analytics/compute-user-trends';

export default async function AdminAnalyticsPage() {
  const supabase = createSupabaseAdminClient();

  const [
    effectivenessRes,
    ratingDistRes,
    tierCountRes,
    carePlanCountRes,
    outcomeCountRes,
    intakeCountRes,
    conditionAnswersRes,
    trends,
  ] = await Promise.all([
    supabase
      .from('recommendation_effectiveness')
      .select('rule_id, avg_rating, positive_rate, sample_count, last_computed_at')
      .order('avg_rating', { ascending: false }),
    supabase
      .from('outcome_logs')
      .select('rating'),
    supabase
      .from('profiles')
      .select('subscription_tier'),
    supabase
      .from('care_plans')
      .select('id', { count: 'exact', head: true }),
    supabase
      .from('outcome_logs')
      .select('id', { count: 'exact', head: true }),
    supabase
      .from('intake_sessions')
      .select('id', { count: 'exact', head: true }),
    supabase
      .from('intake_answers')
      .select('answer')
      .eq('question_id', 'condition.primary'),
    computeUserTrends().catch(() => null),
  ]);

  const effectiveness = effectivenessRes.data ?? [];

  // Outcome distribution
  const ratingCounts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const log of ratingDistRes.data ?? []) {
    const r = log.rating as number;
    if (r >= 1 && r <= 5) ratingCounts[r] = (ratingCounts[r] ?? 0) + 1;
  }
  const maxRatingCount = Math.max(...Object.values(ratingCounts), 1);

  // Cohort counts
  const tierCounts: Record<string, number> = {};
  for (const p of tierCountRes.data ?? []) {
    const tier = (p.subscription_tier as string) ?? 'none';
    tierCounts[tier] = (tierCounts[tier] ?? 0) + 1;
  }

  const totalCarePlans = carePlanCountRes.count ?? 0;
  const totalOutcomes  = outcomeCountRes.count ?? 0;
  const totalIntakes   = intakeCountRes.count ?? 0;
  const conversionRate = totalIntakes > 0 ? Math.round((totalCarePlans / totalIntakes) * 100) : 0;

  // Count condition selections from condition.primary answers (each is a JSONB array)
  const conditionCounts: Record<string, number> = {};
  for (const row of conditionAnswersRes.data ?? []) {
    const conditions = Array.isArray(row.answer) ? (row.answer as string[]) : [];
    for (const c of conditions) {
      conditionCounts[c] = (conditionCounts[c] ?? 0) + 1;
    }
  }
  const sortedConditions = Object.entries(conditionCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10);
  const maxConditionCount = sortedConditions[0]?.[1] ?? 1;

  const CONDITION_LABELS: Record<string, string> = {
    pain: 'Chronic pain', sleep: 'Sleep', anxiety: 'Anxiety', ptsd: 'PTSD',
    menopause: 'Menopause', neuropathy: 'Neuropathy', arthritis: 'Arthritis',
    parkinsons: "Parkinson's", inflammation: 'Inflammation', mood: 'Low mood',
    focus: 'Focus', nausea: 'Nausea',
  };

  return (
    <div className="max-w-4xl space-y-10">
      <h1 className="text-xl font-semibold text-foreground">Analytics</h1>

      {/* Recommendation Effectiveness */}
      <section className="space-y-4">
        <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
          Recommendation Effectiveness
        </h2>
        {effectiveness.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No data yet. Effectiveness is computed nightly after outcome logs accumulate.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Rule ID</th>
                  <th className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground">Avg rating</th>
                  <th className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground">Positive rate</th>
                  <th className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground">Samples</th>
                  <th className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground">Last computed</th>
                </tr>
              </thead>
              <tbody>
                {effectiveness.map((row) => (
                  <tr key={row.rule_id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 font-mono text-xs text-foreground">{row.rule_id}</td>
                    <td className="px-4 py-3 text-right text-foreground">
                      {Number(row.avg_rating).toFixed(2)}
                      <span className="ml-1 text-xs text-muted-foreground">/5</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="h-1.5 w-20 overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-primary"
                            style={{ width: `${Math.round(Number(row.positive_rate) * 100)}%` }}
                          />
                        </div>
                        <span className="text-xs text-foreground">
                          {Math.round(Number(row.positive_rate) * 100)}%
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right text-muted-foreground">{row.sample_count}</td>
                    <td className="px-4 py-3 text-right text-xs text-muted-foreground">
                      {new Date(row.last_computed_at as string).toLocaleDateString('en-US', { dateStyle: 'medium' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Outcome distribution */}
      <section className="space-y-4">
        <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
          Outcome Rating Distribution
        </h2>
        <div className="flex items-end gap-3 h-24">
          {[1, 2, 3, 4, 5].map((r) => {
            const count = ratingCounts[r] ?? 0;
            const pct = Math.round((count / maxRatingCount) * 100);
            return (
              <div key={r} className="flex flex-1 flex-col items-center gap-1">
                <span className="text-xs text-muted-foreground">{count}</span>
                <div className="w-full rounded-t bg-primary/20" style={{ height: `${Math.max(pct, 4)}%` }}>
                  <div className="w-full rounded-t bg-primary" style={{ height: `${pct}%` }} />
                </div>
                <span className="text-xs text-muted-foreground">{r}★</span>
              </div>
            );
          })}
        </div>
      </section>

      {/* Cohort stats */}
      <section className="space-y-4">
        <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">Cohort Stats</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Object.entries(tierCounts).map(([tier, count]) => (
            <div key={tier} className="rounded-lg border border-border bg-card p-4">
              <p className="text-2xl font-semibold text-foreground">{count}</p>
              <p className="text-xs text-muted-foreground capitalize">{tier} tier</p>
            </div>
          ))}
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-2xl font-semibold text-foreground">{totalCarePlans}</p>
            <p className="text-xs text-muted-foreground">Care plans</p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-2xl font-semibold text-foreground">{totalOutcomes}</p>
            <p className="text-xs text-muted-foreground">Outcome logs</p>
          </div>
        </div>
      </section>

      {/* Condition popularity */}
      <section className="space-y-4">
        <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">Top Conditions Selected</h2>
        {sortedConditions.length === 0 ? (
          <p className="text-sm text-muted-foreground">No condition data yet.</p>
        ) : (
          <div className="rounded-lg border border-border bg-card overflow-hidden">
            {sortedConditions.map(([cond, count]) => (
              <div key={cond} className="flex items-center gap-4 px-4 py-3 border-b border-border last:border-0">
                <span className="w-32 text-sm text-foreground shrink-0 capitalize">
                  {CONDITION_LABELS[cond] ?? cond}
                </span>
                <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${Math.round((count / maxConditionCount) * 100)}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-foreground w-8 text-right shrink-0">{count}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Intake funnel */}
      <section className="space-y-4">
        <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">Intake Funnel</h2>
        <div className="rounded-lg border border-border bg-card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Intakes completed</span>
            <span className="text-sm font-medium text-foreground">{totalIntakes}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Care plans generated</span>
            <span className="text-sm font-medium text-foreground">{totalCarePlans}</span>
          </div>
          <div className="border-t border-border pt-3 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Intake → Care plan conversion</span>
            <span className="text-sm font-semibold text-primary">{conversionRate}%</span>
          </div>
        </div>
      </section>

      {/* Learning Insights — algorithmic trend analysis */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">Learning Insights</h2>
          <span className="text-xs text-muted-foreground">
            {trends ? `Computed ${new Date(trends.computedAt).toLocaleTimeString('en-US', { timeStyle: 'short' })}` : 'Live'}
          </span>
        </div>

        {trends && trends.totalUsersWithLogs > 0 ? (
          <div className="space-y-4">
            {/* Platform health */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: 'Avg platform rating', value: `${trends.avgPlatformRating}/5`, color: 'text-primary' },
                { label: 'Improving', value: trends.improving, color: 'text-emerald-600' },
                { label: 'Declining', value: trends.declining, color: 'text-red-500' },
                { label: 'Stable', value: trends.stable, color: 'text-muted-foreground' },
              ].map(({ label, value, color }) => (
                <div key={label} className="rounded-lg border border-border bg-card p-4">
                  <p className={`text-2xl font-semibold ${color}`}>{value}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
                </div>
              ))}
            </div>

            {/* Trend breakdown bar */}
            {trends.totalUsersWithLogs > 0 && (
              <div className="rounded-lg border border-border bg-card p-4 space-y-3">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">User Outcome Trends</p>
                <div className="space-y-2">
                  {[
                    { label: 'Improving', count: trends.improving, color: 'bg-emerald-500' },
                    { label: 'Stable',    count: trends.stable,    color: 'bg-amber-400' },
                    { label: 'Declining', count: trends.declining,  color: 'bg-red-400' },
                  ].map(({ label, count, color }) => {
                    const pct = trends.totalUsersWithLogs > 0
                      ? Math.round((count / trends.totalUsersWithLogs) * 100)
                      : 0;
                    return (
                      <div key={label} className="flex items-center gap-3 text-sm">
                        <span className="w-20 text-xs text-muted-foreground shrink-0">{label}</span>
                        <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                          <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs text-foreground w-16 text-right shrink-0">
                          {count} users ({pct}%)
                        </span>
                      </div>
                    );
                  })}
                </div>
                <p className="text-xs text-muted-foreground">
                  Trend = comparison of most recent 3 logs vs earlier logs. Requires 4+ logs per user.
                  {trends.usersWithSevere > 0 && (
                    <span className="text-red-500 font-medium"> · {trends.usersWithSevere} user{trends.usersWithSevere !== 1 ? 's' : ''} with severe side effects reported.</span>
                  )}
                </p>
              </div>
            )}

            {/* ML boost explanation */}
            <div className="rounded-lg border border-border/50 bg-muted/20 p-4 space-y-1">
              <p className="text-xs font-medium text-foreground">How learning boosts work</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Rules with avg rating ≥ 4.0 receive a +0.10 confidence boost. Rules with ≥70% positive rate (rating ≥ 4)
                receive an additional +0.10 boost. Max boost: +0.20 per rule. Boosts are applied at recommendation time
                and do not modify the rules JSON. Run the effectiveness cron to update scores.
              </p>
              <p className="text-xs text-muted-foreground">
                Trigger: <code className="font-mono bg-muted px-1 rounded">POST /api/analytics/effectiveness</code> with <code className="font-mono bg-muted px-1 rounded">Authorization: Bearer $CRON_SECRET</code>
              </p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Not enough outcome data yet. Learning insights appear after users log outcomes.
          </p>
        )}
      </section>
    </div>
  );
}
