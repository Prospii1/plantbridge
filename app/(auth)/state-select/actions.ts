'use server';

import { createSupabaseServerClient } from '@/lib/server/supabase-server';
import { isAllowedState } from '@/lib/shared/config/allowed-states';
import { log } from '@/lib/observability/log';
import { redirect } from 'next/navigation';
import { z } from 'zod';

const StateSchema = z.object({
  state: z.string().refine(isAllowedState, {
    message: 'PlantBridge is not yet available in your state.',
  }),
});

export type StateSelectState = {
  error?: string;
};

export async function selectStateAction(
  _prev: StateSelectState,
  formData: FormData,
): Promise<StateSelectState> {
  const parsed = StateSchema.safeParse({ state: formData.get('state') });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid state.' };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { error } = await supabase
    .from('profiles')
    .update({ state: parsed.data.state })
    .eq('user_id', user.id);

  if (error) {
    log.error('state_select_update_failed', { userId: user.id, message: error.message });
    return { error: 'Something went wrong. Please try again.' };
  }

  redirect('/onboarding');
}
