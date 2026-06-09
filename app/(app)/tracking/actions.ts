'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/server/supabase-server';
import { createSupabaseAdminClient } from '@/lib/server/supabase-admin';
import { log } from '@/lib/observability/log';
import { trackEvent } from '@/lib/observability/events';
import { sendCoachSevereAlert, sendCoachLowOutcomeAlert } from '@/lib/server/emails/coach-alerts';

const LOW_OUTCOME_THRESHOLD  = 3;
const LOW_OUTCOME_MIN_LOGS   = 3;

const OutcomeSchema = z.object({
  carePlanItemId: z.string().uuid(),
  rating:         z.coerce.number().int().min(1).max(5),
  notes:          z.string().max(500).optional(),
  symptom_level:  z.coerce.number().int().min(1).max(10).optional(),
  dose_taken:     z.string().max(80).optional(),
  side_effects:   z.enum(['none', 'mild', 'moderate', 'severe']).optional(),
});

export interface OutcomeLogState {
  success?: boolean;
  error?: string;
  sideEffects?: string;
}

export async function logOutcome(
  _prev: OutcomeLogState,
  formData: FormData,
): Promise<OutcomeLogState> {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: 'You must be logged in.' };

  const parsed = OutcomeSchema.safeParse({
    carePlanItemId: formData.get('carePlanItemId'),
    rating:         formData.get('rating'),
    notes:          formData.get('notes') || undefined,
    symptom_level:  formData.get('symptom_level') || undefined,
    dose_taken:     formData.get('dose_taken') || undefined,
    side_effects:   formData.get('side_effects') || undefined,
  });

  if (!parsed.success) {
    return { error: 'Invalid submission. Please check your rating.' };
  }

  const { carePlanItemId, rating, notes, symptom_level, dose_taken, side_effects } = parsed.data;

  const metadata: Record<string, unknown> = {};
  if (symptom_level !== undefined) metadata.symptom_level = symptom_level;
  if (dose_taken)                   metadata.dose_taken   = dose_taken;
  if (side_effects)                 metadata.side_effects = side_effects;

  const { error } = await supabase.from('outcome_logs').insert({
    user_id:           user.id,
    care_plan_item_id: carePlanItemId,
    rating,
    notes:    notes ?? null,
    metadata: Object.keys(metadata).length > 0 ? metadata : null,
    logged_at: new Date().toISOString(),
  });

  if (error) {
    log.error('outcome_log_insert_failed', { userId: user.id, carePlanItemId, error: error.message });
    return { error: 'Failed to save your check-in. Please try again.' };
  }

  log.info('outcome_logged', { userId: user.id, carePlanItemId, rating });

  // Fire coach alerts asynchronously — don't block the user response
  void triggerCoachAlerts({
    userId:         user.id,
    userEmail:      user.email ?? '',
    carePlanItemId,
    sideEffects:    side_effects,
  });

  await trackEvent({ event: 'outcome_logged', userId: user.id, carePlanItemId, rating });
  revalidatePath('/tracking');
  return { success: true, sideEffects: side_effects };
}

interface AlertContext {
  userId: string;
  userEmail: string;
  carePlanItemId: string;
  sideEffects?: string;
}

async function triggerCoachAlerts({ userId, userEmail, carePlanItemId, sideEffects }: AlertContext): Promise<void> {
  const adminSupabase = createSupabaseAdminClient();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

  // Find the coach assigned to this user (if any)
  const { data: assignment } = await adminSupabase
    .from('coach_clients')
    .select('coach_id')
    .eq('user_id', userId)
    .eq('status', 'active')
    .single();

  if (!assignment?.coach_id) return;

  const { data: coachAuth } = await adminSupabase.auth.admin.getUserById(assignment.coach_id);
  const coachEmail = coachAuth?.user?.email;
  if (!coachEmail) return;

  // 1. Severe side effect alert — fire immediately
  if (sideEffects === 'severe') {
    const { data: item } = await adminSupabase
      .from('care_plan_items')
      .select('subject')
      .eq('id', carePlanItemId)
      .single();

    await sendCoachSevereAlert({
      coachEmail,
      clientEmail: userEmail,
      clientUserId: userId,
      subject: item?.subject ?? 'unknown',
      appUrl,
    });

    await trackEvent({ event: 'coach_alert_sent', userId, alertType: 'severe_side_effect' });
    return;
  }

  // 2. Low-outcome alert — fire when avg drops below threshold after MIN_LOGS
  const { data: recentLogs } = await adminSupabase
    .from('outcome_logs')
    .select('rating')
    .eq('user_id', userId)
    .order('logged_at', { ascending: false })
    .limit(10);

  if (!recentLogs || recentLogs.length < LOW_OUTCOME_MIN_LOGS) return;

  const avgRating = recentLogs.reduce((s, l) => s + (l.rating as number), 0) / recentLogs.length;

  // Only alert when this log pushed the avg below threshold (avoid repeat alerts every log)
  const prevLogs    = recentLogs.slice(1);
  const prevAvg     = prevLogs.length > 0
    ? prevLogs.reduce((s, l) => s + (l.rating as number), 0) / prevLogs.length
    : null;
  const justCrossed = avgRating < LOW_OUTCOME_THRESHOLD && (prevAvg === null || prevAvg >= LOW_OUTCOME_THRESHOLD);

  if (!justCrossed) return;

  await sendCoachLowOutcomeAlert({
    coachEmail,
    clientEmail: userEmail,
    clientUserId: userId,
    avgRating,
    logCount: recentLogs.length,
    appUrl,
  });

  await trackEvent({ event: 'coach_alert_sent', userId, alertType: 'low_outcome', avgRating });
}
