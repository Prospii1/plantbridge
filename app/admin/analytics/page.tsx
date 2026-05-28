import { createSupabaseAdminClient } from '@/lib/server/supabase-admin';

export default async function AdminAnalyticsPage() {
  const supabase = createSupabaseAdminClient();

  const [
    effectivenessRes,
    ratingDistRes,
    tierCountRes,
    carePlanCountRes,
    outcomeCountRes,
    intakeCountRes,
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
  const totalOutcomes = outcomeCountRes.count ?? 0;
  const totalIntakes = intakeCountRes.count ?? 0;
  const conversionRate =
    totalIntakes > 0 ? Math.round((totalCarePlans / totalIntakes) * 100) : 0;

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
    </div>
  );
}
