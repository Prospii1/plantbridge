'use server';

import { revalidatePath } from 'next/cache';
import { createSupabaseServerClient } from '@/lib/server/supabase-server';
import { createSupabaseAdminClient } from '@/lib/server/supabase-admin';
import { log } from '@/lib/observability/log';

export async function updateCoachNotes(clientUserId: string, formData: FormData): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const notes = String(formData.get('notes') ?? '');
  const adminSupabase = createSupabaseAdminClient();

  const { error } = await adminSupabase
    .from('coach_clients')
    .update({ notes })
    .eq('coach_id', user.id)
    .eq('user_id', clientUserId)
    .eq('status', 'active');

  if (error) log.error('update_coach_notes_failed', { coachId: user.id, clientUserId, error: error.message });

  revalidatePath(`/coach/clients/${clientUserId}`);
}
