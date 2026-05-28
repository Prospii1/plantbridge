import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import type { RulesFile } from '@/lib/server/recommend/rules-executor';

let _cache: RulesFile | null = null;

export function loadLatestRules(): RulesFile {
  if (_cache) return _cache;

  const dir = join(process.cwd(), 'content', 'recommendations');
  const files = readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .sort() // lexicographic: rules.v1.json < rules.v2.json
    .reverse();

  const latest = files[0];
  if (!latest) throw new Error('No rules files found in content/recommendations/');

  const raw = readFileSync(join(dir, latest), 'utf-8');
  _cache = JSON.parse(raw) as RulesFile;
  return _cache;
}
