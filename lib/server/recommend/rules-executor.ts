import type { IntakeAnswerMap } from '@/lib/shared/types/intake';
import { mlBoost } from '@/lib/server/recommend/ml-scorer';

// ─── Rule JSON types (mirror of content/recommendations/rules.v*.json) ────

type LeafCondition =
  | { answer: string; in: string[] }
  | { answer: string; gte: number }
  | { answer: string; lte: number }
  | { answer: string; eq: string | number | boolean };

type RuleCondition =
  | { all: RuleCondition[] }
  | { any: RuleCondition[] }
  | LeafCondition;

export interface RecommendationRule {
  id: string;
  category: string;
  subject: string;
  when: RuleCondition;
  weight: number;
  education_ref: string;
  copy_ref: string;
  deprecated?: boolean;
  ml_boost_eligible?: boolean;
}

export interface RulesFile {
  version: string;
  engine_min: string;
  rules: RecommendationRule[];
}

// ─── Output type ─────────────────────────────────────────────────────────────

export interface RuleMatch {
  ruleId: string;
  category: string;
  subject: string;
  confidence: number;
  educationRef: string;
  copyRef: string;
}

// ─── Condition evaluator ─────────────────────────────────────────────────────

function evalCondition(condition: RuleCondition, answers: IntakeAnswerMap): boolean {
  if ('all' in condition) {
    return condition.all.every((c) => evalCondition(c, answers));
  }
  if ('any' in condition) {
    return condition.any.some((c) => evalCondition(c, answers));
  }

  const raw = answers[condition.answer];

  if ('in' in condition) {
    const val = raw as string | undefined;
    return val !== undefined && condition.in.includes(val);
  }
  if ('gte' in condition) {
    return typeof raw === 'number' && raw >= condition.gte;
  }
  if ('lte' in condition) {
    return typeof raw === 'number' && raw <= condition.lte;
  }
  if ('eq' in condition) {
    return raw === condition.eq;
  }

  return false;
}

// ─── Public executor ─────────────────────────────────────────────────────────

export const ENGINE_VERSION = '0.2.0';

export async function executeRules(
  rules: RecommendationRule[],
  answers: IntakeAnswerMap,
): Promise<RuleMatch[]> {
  const matches: RuleMatch[] = [];

  for (const rule of rules) {
    if (rule.deprecated) continue;
    if (!evalCondition(rule.when, answers)) continue;

    let confidence = rule.weight;

    if (rule.ml_boost_eligible) {
      const boost = await mlBoost(rule.id);
      confidence = Math.min(1.0, confidence + boost);
    }

    matches.push({
      ruleId: rule.id,
      category: rule.category,
      subject: rule.subject,
      confidence,
      educationRef: rule.education_ref,
      copyRef: rule.copy_ref,
    });
  }

  // Sort by confidence descending so highest-confidence items come first
  return matches.sort((a, b) => b.confidence - a.confidence);
}
