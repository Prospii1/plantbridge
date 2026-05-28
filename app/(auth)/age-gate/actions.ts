'use server';

import { createSupabaseServerClient } from '@/lib/server/supabase-server';
import { log } from '@/lib/observability/log';
import { redirect } from 'next/navigation';

export type AgeGateState = {
  error?: string;
};

export async function confirmAgeAction(
  _prev: AgeGateState,
  _formData: FormData,
): Promise<AgeGateState> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { error } = await supabase
    .from('profiles')
    .update({ age_verified_at: new Date().toISOString() })
    .eq('user_id', user.id);

  if (error) {
    log.error('age_gate_update_failed', { userId: user.id, message: error.message });
    return { error: 'Something went wrong. Please try again.' };
  }

  redirect('/state-select');
}
