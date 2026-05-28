import { createSupabaseAdminClient } from '@/lib/server/supabase-admin';
import { log } from '@/lib/observability/log';

interface EffectivenessRow {
  ruleId: string;
  sampleCount: number;
  avgRating: number;
  positiveRate: number;
}

export async function computeEffectiveness(): Promise<number> {
  const supabase = createSupabaseAdminClient();

  // Fetch all outcome_logs that are linked to a care_plan_item
  const { data: logs, error } = await supabase
    .from('outcome_logs')
    .select('rating, care_plan_item_id')
    .not('care_plan_item_id', 'is', null);

  if (error) {
    log.error('effectiveness_fetch_logs_failed', { error: error.message });
    throw new Error(error.message);
  }

  if (!logs || logs.length === 0) return 0;

  const itemIds = Array.from(new Set(logs.map((l) => l.care_plan_item_id as string)));

  // Fetch the rule_id for each referenced care_plan_item
  const { data: items, error: itemsError } = await supabase
    .from('care_plan_items')
    .select('id, rule_id')
    .in('id', itemIds);

  if (itemsError) {
    log.error('effectiveness_fetch_items_failed', { error: itemsError.message });
    throw new Error(itemsError.message);
  }

  const itemRuleMap = new Map(
    (items ?? [])
      .filter((i): i is { id: string; rule_id: string } => !!i.rule_id)
      .map((i) => [i.id, i.rule_id]),
  );

  // Aggregate: group ratings by rule_id
  const byRule = new Map<string, number[]>();
  for (const log_ of logs) {
    const ruleId = itemRuleMap.get(log_.care_plan_item_id as string);
    if (!ruleId) continue;
    const bucket = byRule.get(ruleId) ?? [];
    bucket.push(log_.rating as number);
    byRule.set(ruleId, bucket);
  }

  const rows: EffectivenessRow[] = [];
  for (const [ruleId, ratings] of Array.from(byRule.entries())) {
    const avg = ratings.reduce((s: number, r: number) => s + r, 0) / ratings.length;
    const positiveCount = ratings.filter((r: number) => r >= 4).length;
    rows.push({
      ruleId,
      sampleCount: ratings.length,
      avgRating: Math.round(avg * 100) / 100,
      positiveRate: Math.round((positiveCount / ratings.length) * 100) / 100,
    });
  }

  if (rows.length === 0) return 0;

  const { error: upsertError } = await supabase
    .from('recommendation_effectiveness')
    .upsert(
      rows.map((r) => ({
        rule_id: r.ruleId,
        sample_count: r.sampleCount,
        avg_rating: r.avgRating,
        positive_rate: r.positiveRate,
        last_computed_at: new Date().toISOString(),
      })),
      { onConflict: 'rule_id' },
    );

  if (upsertError) {
    log.error('effectiveness_upsert_failed', { error: upsertError.message });
    throw new Error(upsertError.message);
  }

  log.info('effectiveness_computed', { rulesUpdated: rows.length });
  return rows.length;
}
