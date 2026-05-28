'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/server/supabase-server';
import { createSupabaseAdminClient } from '@/lib/server/supabase-admin';
import { log } from '@/lib/observability/log';

const RoleSchema = z.enum(['user', 'coach', 'partner', 'admin']);

export async function changeUserRole(
  targetUserId: string,
  formData: FormData,
): Promise<void> {
  const callerSupabase = await createSupabaseServerClient();
  const { data: { user: caller } } = await callerSupabase.auth.getUser();
  if (!caller) redirect('/login');

  const { data: callerProfile } = await callerSupabase
    .from('profiles')
    .select('role')
    .eq('user_id', caller.id)
    .single();

  if (callerProfile?.role !== 'admin') redirect('/admin');

  const parsed = RoleSchema.safeParse(formData.get('role'));
  if (!parsed.success) return;

  const adminSupabase = createSupabaseAdminClient();

  const { error } = await adminSupabase
    .from('profiles')
    .update({ role: parsed.data })
    .eq('user_id', targetUserId);

  if (error) {
    log.error('admin_change_role_failed', { targetUserId, error: error.message });
    return;
  }

  await adminSupabase.from('events').insert({
    user_id: caller.id,
    event_name: 'admin.role_changed',
    properties: { target_user_id: targetUserId, new_role: parsed.data },
  });

  log.info('admin_role_changed', { callerId: caller.id, targetUserId, newRole: parsed.data });
  revalidatePath(`/admin/users/${targetUserId}`);
  revalidatePath('/admin/users');
}
