import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/server/supabase-server';
import { loadLatestRules } from '@/lib/server/recommend/load-rules';
import { executeRules, ENGINE_VERSION } from '@/lib/server/recommend/rules-executor';
import { log } from '@/lib/observability/log';
import type { IntakeAnswerMap } from '@/lib/shared/types/intake';

const BodySchema = z.object({
  sessionId: z.string().uuid(),
});

export async function POST(request: NextRequest): Promise<NextResponse> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = BodySchema.safeParse(await request.json().catch(() => ({})));
  if (!body.success) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { sessionId } = body.data;

  // Fetch answers for this session (RLS ensures ownership)
  const { data: rawAnswers, error: answersError } = await supabase
    .from('intake_answers')
    .select('question_id, answer')
    .eq('session_id', sessionId)
    .eq('user_id', user.id);

  if (answersError || !rawAnswers) {
    log.error('recommend_fetch_answers_failed', { userId: user.id, sessionId, error: answersError?.message });
    return NextResponse.json({ error: 'Failed to load intake data' }, { status: 500 });
  }

  const answers: IntakeAnswerMap = {};
  for (const row of rawAnswers) {
    answers[row.question_id] = row.answer as IntakeAnswerMap[string];
  }

  // Run recommendation engine
  const rulesFile = loadLatestRules();
  const matches = await executeRules(rulesFile.rules, answers);

  // Persist recommendation profile
  const { data: profile, error: profileError } = await supabase
    .from('recommendation_profiles')
    .insert({
      user_id: user.id,
      session_id: sessionId,
    })
    .select('id')
    .single();

  if (profileError || !profile) {
    log.error('recommend_profile_insert_failed', { userId: user.id, sessionId, error: profileError?.message });
    return NextResponse.json({ error: 'Failed to save recommendation profile' }, { status: 500 });
  }

  // Create care plan
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
    return NextResponse.json({ error: 'Failed to create care plan' }, { status: 500 });
  }

  // Insert care plan items from rule matches
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
      return NextResponse.json({ error: 'Failed to save care plan items' }, { status: 500 });
    }
  }

  log.info('care_plan_generated', {
    userId: user.id,
    planId: plan.id,
    matchCount: matches.length,
    rulesVersion: rulesFile.version,
    engineVersion: ENGINE_VERSION,
  });

  return NextResponse.json({ planId: plan.id, matchCount: matches.length });
}
