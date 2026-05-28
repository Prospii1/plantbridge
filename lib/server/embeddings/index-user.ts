import { createSupabaseAdminClient } from '@/lib/server/supabase-admin';
import { embed } from '@/lib/server/embeddings/embed';
import { log } from '@/lib/observability/log';

export async function indexUserPreference(userId: string): Promise<void> {
  const supabase = createSupabaseAdminClient();

  const { data: profile, error } = await supabase
    .from('recommendation_profiles')
    .select('terpene_mix, cannabinoid_preference, format_preference')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error || !profile) {
    log.warn('index_user_no_profile', { userId });
    return;
  }

  const parts: string[] = [];
  if (profile.terpene_mix) {
    parts.push(Object.keys(profile.terpene_mix as Record<string, number>).join(' '));
  }
  if (profile.cannabinoid_preference) parts.push(String(profile.cannabinoid_preference));
  if (profile.format_preference) parts.push(String(profile.format_preference));

  if (parts.length === 0) return;

  const embedding = await embed(parts.join(' '));

  const { error: upsertErr } = await supabase
    .from('user_preference_embeddings')
    .upsert(
      { user_id: userId, embedding, model_id: 'all-MiniLM-L6-v2', updated_at: new Date().toISOString() },
      { onConflict: 'user_id' },
    );

  if (upsertErr) {
    log.error('index_user_upsert_failed', { userId, error: upsertErr.message });
  }
}
