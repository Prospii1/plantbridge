/**
 * Validates all content/recommendations/*.json files against the rules schema.
 * Exits with code 1 on any validation failure.
 *
 * Usage: pnpm run rules:validate
 */

import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { z } from 'zod';

const RuleConditionSchema: z.ZodType<RuleCondition> = z.lazy(() =>
  z.union([
    z.object({
      all: z.array(RuleConditionSchema),
    }),
    z.object({
      any: z.array(RuleConditionSchema),
    }),
    z.object({
      answer: z.string(),
      in: z.array(z.string()),
    }),
    z.object({
      answer: z.string(),
      gte: z.number(),
    }),
    z.object({
      answer: z.string(),
      lte: z.number(),
    }),
    z.object({
      answer: z.string(),
      eq: z.union([z.string(), z.number(), z.boolean()]),
    }),
  ])
);

type RuleCondition =
  | { all: RuleCondition[] }
  | { any: RuleCondition[] }
  | { answer: string; in: string[] }
  | { answer: string; gte: number }
  | { answer: string; lte: number }
  | { answer: string; eq: string | number | boolean };

const RuleSchema = z.object({
  id: z.string().regex(/^[a-z][a-z0-9.]+$/, 'Rule ID must be dotted lowercase (e.g. rec.terpene.linalool.sleep)'),
  category: z.string(),
  subject: z.string(),
  when: RuleConditionSchema,
  weight: z.number().min(0).max(1),
  education_ref: z.string(),
  copy_ref: z.string(),
  deprecated: z.boolean().default(false),
  ml_boost_eligible: z.boolean().optional(),
});

const RulesFileSchema = z.object({
  version: z.string().regex(/^\d+\.\d+\.\d+$/, 'Version must be semver'),
  engine_min: z.string().regex(/^\d+\.\d+\.\d+$/, 'engine_min must be semver'),
  rules: z.array(RuleSchema),
});

const contentDir = join(process.cwd(), 'content', 'recommendations');

function validateFile(filePath: string): boolean {
  const raw = readFileSync(filePath, 'utf-8');
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    console.error(`  ❌ JSON parse error in ${filePath}`);
    return false;
  }

  const result = RulesFileSchema.safeParse(parsed);
  if (!result.success) {
    console.error(`  ❌ Schema validation failed in ${filePath}:`);
    result.error.issues.forEach((issue) => {
      console.error(`     [${issue.path.join('.')}] ${issue.message}`);
    });
    return false;
  }

  // Check for duplicate rule IDs
  const ids = result.data.rules.map((r) => r.id);
  const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
  if (dupes.length > 0) {
    console.error(`  ❌ Duplicate rule IDs in ${filePath}: ${dupes.join(', ')}`);
    return false;
  }

  console.log(`  ✅ ${filePath} — ${result.data.rules.length} rules, version ${result.data.version}`);
  return true;
}

console.log('\n=== PlantBridge Rules Validation ===\n');

let files: string[];
try {
  files = readdirSync(contentDir).filter((f) => f.endsWith('.json'));
} catch {
  console.error(`Error: Could not read ${contentDir}`);
  process.exit(1);
}

if (files.length === 0) {
  console.error('No rules JSON files found in content/recommendations/');
  process.exit(1);
}

let allValid = true;
for (const file of files) {
  const valid = validateFile(join(contentDir, file));
  if (!valid) allValid = false;
}

console.log('');
if (!allValid) {
  console.error('❌ Validation failed.\n');
  process.exit(1);
} else {
  console.log('✅ All rules files valid.\n');
}
