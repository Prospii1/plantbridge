import { createSupabaseAdminClient } from '@/lib/server/supabase-admin';

// Data-driven boost based on observed outcome ratings in recommendation_effectiveness.
// Returns a delta in [0.0, 0.2] to add to a rule's confidence score.
// No neural inference — purely aggregated historical signal.
export async function mlBoost(ruleId: string): Promise<number> {
  const supabase = createSupabaseAdminClient();
  const { data } = await supabase
    .from('recommendation_effectiveness')
    .select('avg_rating, positive_rate')
    .eq('rule_id', ruleId)
    .single();

  if (!data) return 0;

  let boost = 0;
  if ((data.avg_rating as number) >= 4.0) boost += 0.1;
  if ((data.positive_rate as number) >= 0.7) boost += 0.1;
  return boost;
}
