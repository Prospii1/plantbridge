import { readFileSync } from 'fs';
import { join } from 'path';
import { IntakeQuestionsFileSchema, type ValidatedIntakeQuestion } from '@/lib/shared/validators/intake-questions';

let _cache: ValidatedIntakeQuestion[] | null = null;

export function loadIntakeQuestions(): ValidatedIntakeQuestion[] {
  if (_cache) return _cache;

  const filePath = join(process.cwd(), 'content', 'intake', 'questions.v2.json');
  const raw = readFileSync(filePath, 'utf-8');

  const parsed = IntakeQuestionsFileSchema.parse(JSON.parse(raw));

  const ids = parsed.questions.map((q) => q.id);
  const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
  if (dupes.length > 0) {
    throw new Error(`Duplicate question IDs in questions.v2.json: ${dupes.join(', ')}`);
  }

  _cache = parsed.questions;
  return _cache;
}
