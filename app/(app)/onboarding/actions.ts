'use server';

import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/server/supabase-server';
import { loadIntakeQuestions } from '@/lib/server/intake/load-questions';
import { IntakeAnswerSchema } from '@/lib/shared/validators/intake-questions';
import { loadLatestRules } from '@/lib/server/recommend/load-rules';
import { executeRules, ENGINE_VERSION } from '@/lib/server/recommend/rules-executor';
import { getUserTier } from '@/lib/server/subscriptions';
import { hasAccess } from '@/lib/shared/utils/tier';
import { log } from '@/lib/observability/log';
import { trackEvent } from '@/lib/observability/events';
import type { IntakeAnswerMap } from '@/lib/shared/types/intake';

export interface IntakeSubmitState {
  error?: string;
}

export async function submitIntake(
  _prev: IntakeSubmitState,
  formData: FormData,
): Promise<IntakeSubmitState> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'You must be logged in to complete intake.' };
  }

  const questions = loadIntakeQuestions();

  // Parse raw form data into typed answer map
  const rawAnswers: Record<string, unknown> = {};
  for (const question of questions) {
    const raw = formData.get(question.id);
    if (raw === null) {
      if (question.required) {
        return { error: `Please answer: ${question.text}` };
      }
      continue;
    }

    if (question.type === 'multi_choice') {
      rawAnswers[question.id] = formData.getAll(question.id);
    } else if (question.type === 'scale') {
      rawAnswers[question.id] = parseInt(raw as string, 10);
    } else if (question.type === 'boolean') {
      rawAnswers[question.id] = raw === 'true';
    } else {
      rawAnswers[question.id] = raw;
    }
  }

  const parsed = IntakeAnswerSchema.safeParse(rawAnswers);
  if (!parsed.success) {
    return { error: 'Invalid answers. Please review your responses.' };
  }

  // ── Save intake session ──────────────────────────────────────────────────
  const { data: session, error: sessionError } = await supabase
    .from('intake_sessions')
    .insert({ user_id: user.id, questions_version: '2.0.0' })
    .select('id')
    .single();

  if (sessionError || !session) {
    log.error('intake_session_create_failed', { userId: user.id, error: sessionError?.message });
    return { error: 'Failed to save your intake. Please try again.' };
  }

  // ── Save answers ─────────────────────────────────────────────────────────
  const answerRows = Object.entries(parsed.data).map(([questionId, answer]) => ({
    user_id: user.id,
    session_id: session.id,
    question_id: questionId,
    answer,
  }));

  const { error: answersError } = await supabase.from('intake_answers').insert(answerRows);
  if (answersError) {
    log.error('intake_answers_insert_failed', { userId: user.id, sessionId: session.id, error: answersError.message });
    return { error: 'Failed to save your answers. Please try again.' };
  }

  await supabase
    .from('intake_sessions')
    .update({ completed_at: new Date().toISOString() })
    .eq('id', session.id);

  // ── Run recommendation engine ────────────────────────────────────────────
  const rulesFile = loadLatestRules();
  const answers: IntakeAnswerMap = {};
  for (const [k, v] of Object.entries(parsed.data)) {
    answers[k] = v as IntakeAnswerMap[string];
  }
  const matches = await executeRules(rulesFile.rules, answers);

  // ── Persist recommendation profile ──────────────────────────────────────
  const { data: profile, error: profileError } = await supabase
    .from('recommendation_profiles')
    .insert({ user_id: user.id, session_id: session.id })
    .select('id')
    .single();

  if (profileError || !profile) {
    log.error('recommend_profile_insert_failed', { userId: user.id, error: profileError?.message });
    return { error: 'Something went wrong generating your plan. Please try again.' };
  }

  // ── Archive any existing active plans ────────────────────────────────────
  await supabase
    .from('care_plans')
    .update({ status: 'archived' })
    .eq('user_id', user.id)
    .eq('status', 'active');

  // ── Create care plan ─────────────────────────────────────────────────────
  const { data: plan, error: planError } = await supabase
    .from('care_plans')
    .insert({
      user_id: user.id,
      recommendation_profile_id: profile.id,
      engine_version: ENGINE_VERSION,
      rules_version: rulesFile.version,
      status: 'active',
    })
    .select('id')
    .single();

  if (planError || !plan) {
    log.error('care_plan_insert_failed', { userId: user.id, error: planError?.message });
    return { error: 'Something went wrong generating your plan. Please try again.' };
  }

  // ── Insert care plan items ────────────────────────────────────────────────
  if (matches.length > 0) {
    const items = matches.map((match, idx) => ({
      user_id: user.id,
      care_plan_id: plan.id,
      rule_id: match.ruleId,
      category: match.category,
      subject: match.subject,
      confidence: match.confidence,
      education_ref: match.educationRef,
      copy_ref: match.copyRef,
      display_order: idx,
    }));

    const { error: itemsError } = await supabase.from('care_plan_items').insert(items);
    if (itemsError) {
      log.error('care_plan_items_insert_failed', { userId: user.id, planId: plan.id, error: itemsError.message });
    }
  }

  log.info('intake_and_plan_completed', {
    userId: user.id,
    sessionId: session.id,
    planId: plan.id,
    matchCount: matches.length,
    rulesVersion: rulesFile.version,
    engineVersion: ENGINE_VERSION,
  });

  await Promise.all([
    trackEvent({ event: 'intake_completed', userId: user.id, sessionId: session.id }),
    trackEvent({ event: 'care_plan_generated', userId: user.id, planId: plan.id, itemCount: matches.length }),
  ]);

  // For free users, append severity context so the upgrade gate can personalise its message
  const tier = await getUserTier(user.id);
  const severity = typeof answers['severity.primary'] === 'number' ? answers['severity.primary'] : 0;

  if (!hasAccess(tier, 'self_guided') && severity >= 7) {
    redirect(`/care-plan/${plan.id}?severity=${severity}`);
  }

  redirect(`/care-plan/${plan.id}`);
}
