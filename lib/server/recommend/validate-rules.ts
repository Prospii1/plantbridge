import { z } from 'zod';
import type { RulesFile } from '@/lib/server/recommend/rules-executor';

const RuleConditionSchema: z.ZodType<RuleCondition> = z.lazy(() =>
  z.union([
    z.object({ all: z.array(RuleConditionSchema) }),
    z.object({ any: z.array(RuleConditionSchema) }),
    z.object({ answer: z.string(), in: z.array(z.string()) }),
    z.object({ answer: z.string(), gte: z.number() }),
    z.object({ answer: z.string(), lte: z.number() }),
    z.object({ answer: z.string(), eq: z.union([z.string(), z.number(), z.boolean()]) }),
  ]),
);

type RuleCondition =
  | { all: RuleCondition[] }
  | { any: RuleCondition[] }
  | { answer: string; in: string[] }
  | { answer: string; gte: number }
  | { answer: string; lte: number }
  | { answer: string; eq: string | number | boolean };

export const RuleSchema = z.object({
  id: z.string().regex(/^[a-z][a-z0-9.]+$/, 'Rule ID must be dotted lowercase'),
  category: z.string(),
  subject: z.string(),
  when: RuleConditionSchema,
  weight: z.number().min(0).max(1),
  education_ref: z.string(),
  copy_ref: z.string(),
  deprecated: z.boolean().default(false),
  ml_boost_eligible: z.boolean().optional(),
});

export const RulesFileSchema = z.object({
  version: z.string().regex(/^\d+\.\d+\.\d+$/),
  engine_min: z.string().regex(/^\d+\.\d+\.\d+$/),
  rules: z.array(RuleSchema),
});

export function validateRulesFile(raw: unknown): RulesFile {
  const result = RulesFileSchema.safeParse(raw);
  if (!result.success) {
    throw new Error(`Rules validation failed: ${result.error.issues.map((i) => i.message).join('; ')}`);
  }
  const ids = result.data.rules.map((r) => r.id);
  const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
  if (dupes.length > 0) throw new Error(`Duplicate rule IDs: ${dupes.join(', ')}`);
  return result.data as RulesFile;
}
