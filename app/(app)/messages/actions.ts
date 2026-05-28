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

  revalidatePath(`/messages/${conversationId}`);
}
