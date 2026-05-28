'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/server/supabase-server';
import { log } from '@/lib/observability/log';
import { trackEvent } from '@/lib/observability/events';

const OutcomeSchema = z.object({
  carePlanItemId: z.string().uuid(),
  rating: z.coerce.number().int().min(1).max(5),
  notes: z.string().max(500).optional(),
});

export interface OutcomeLogState {
  success?: boolean;
  error?: string;
}

export async function logOutcome(
  _prev: OutcomeLogState,
  formData: FormData,
): Promise<OutcomeLogState> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: 'You must be logged in.' };

  const parsed = OutcomeSchema.safeParse({
    carePlanItemId: formData.get('carePlanItemId'),
    rating: formData.get('rating'),
    notes: formData.get('notes') || undefined,
  });

  if (!parsed.success) {
    return { error: 'Invalid submission. Please check your rating.' };
  }

  const { carePlanItemId, rating, notes } = parsed.data;

  const { error } = await supabase.from('outcome_logs').insert({
    user_id: user.id,
    care_plan_item_id: carePlanItemId,
    rating,
    notes: notes ?? null,
    logged_at: new Date().toISOString(),
  });

  if (error) {
    log.error('outcome_log_insert_failed', { userId: user.id, carePlanItemId, error: error.message });
    return { error: 'Failed to save your log. Please try again.' };
  }

  log.info('outcome_logged', { userId: user.id, carePlanItemId, rating });
  await trackEvent({ event: 'outcome_logged', userId: user.id, carePlanItemId, rating });
  revalidatePath('/tracking');
  return { success: true };
}
