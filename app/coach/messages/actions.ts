'use server';

import { revalidatePath } from 'next/cache';
import { createSupabaseServerClient } from '@/lib/server/supabase-server';
import { createSupabaseAdminClient } from '@/lib/server/supabase-admin';
import { log } from '@/lib/observability/log';

export async function sendMessage(conversationId: string, formData: FormData): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const body = String(formData.get('body') ?? '').trim();
  if (!body) return;

  const adminSupabase = createSupabaseAdminClient();

  const { error } = await adminSupabase.from('messages').insert({
    conversation_id: conversationId,
    sender_id: user.id,
    body,
  });

  if (error) {
    log.error('send_message_failed', { conversationId, userId: user.id, error: error.message });
    return;
  }

  await adminSupabase
    .from('conversations')
    .update({ last_message_at: new Date().toISOString() })
    .eq('id', conversationId);

  revalidatePath(`/coach/messages/${conversationId}`);
}

export async function startConversationWithUser(targetUserId: string): Promise<string | null> {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const adminSupabase = createSupabaseAdminClient();

  const { data, error } = await adminSupabase
    .from('conversations')
    .upsert(
      { coach_id: user.id, user_id: targetUserId },
      { onConflict: 'coach_id,user_id' },
    )
    .select('id')
    .single();

  if (error) {
    log.error('start_conversation_failed', { coachId: user.id, targetUserId, error: error.message });
    return null;
  }

  return data.id;
}
