'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/server/supabase-server';
import { createSupabaseAdminClient } from '@/lib/server/supabase-admin';
import { log } from '@/lib/observability/log';

async function assertAdmin(): Promise<string> {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('user_id', user.id)
    .single();

  if (profile?.role !== 'admin') redirect('/admin');
  return user.id;
}

export async function verifyCoach(coachId: string): Promise<void> {
  await assertAdmin();
  const supabase = createSupabaseAdminClient();

  const { error } = await supabase
    .from('coaches')
    .update({ verified_at: new Date().toISOString() })
    .eq('id', coachId);

  if (error) log.error('verify_coach_failed', { coachId, error: error.message });

  revalidatePath('/admin/coaches');
  revalidatePath(`/admin/coaches/${coachId}`);
}

export async function assignClientToCoach(coachUserId: string, formData: FormData): Promise<void> {
  const callerId = await assertAdmin();
  const supabase = createSupabaseAdminClient();

  const email = z.string().email().safeParse(formData.get('email'));
  if (!email.success) return;

  const { data: authList } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  const targetUser = authList?.users.find((u) => u.email === email.data);
  if (!targetUser) return;

  const { error } = await supabase.from('coach_clients').upsert(
    {
      coach_id: coachUserId,
      user_id: targetUser.id,
      status: 'active',
    },
    { onConflict: 'coach_id,user_id' },
  );

  if (error) {
    log.error('assign_client_failed', { coachUserId, targetUserId: targetUser.id, error: error.message });
    return;
  }

  log.info('client_assigned', { callerId, coachUserId, targetUserId: targetUser.id });
  revalidatePath(`/admin/coaches/${coachUserId}`);
}

export async function removeClientAssignment(coachClientId: string, coachUserId: string): Promise<void> {
  await assertAdmin();
  const supabase = createSupabaseAdminClient();

  const { error } = await supabase
    .from('coach_clients')
    .update({ status: 'ended' })
    .eq('id', coachClientId);

  if (error) log.error('remove_assignment_failed', { coachClientId, error: error.message });

  revalidatePath(`/admin/coaches/${coachUserId}`);
}
