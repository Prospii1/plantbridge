import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import type { RulesFile, RecommendationRule } from '@/lib/server/recommend/rules-executor';

function loadAllRulesFiles(): Array<{ filename: string; data: RulesFile }> {
  const dir = join(process.cwd(), 'content', 'recommendations');
  const files = readdirSync(dir).filter((f) => f.endsWith('.json')).sort();
  return files.map((filename) => ({
    filename,
    data: JSON.parse(readFileSync(join(dir, filename), 'utf-8')) as RulesFile,
  }));
}

function RuleRow({ rule }: { rule: RecommendationRule }) {
  return (
    <tr className={`border-b border-border/50 ${rule.deprecated ? 'opacity-50' : ''}`}>
      <td className="px-4 py-2 font-mono text-xs text-foreground">{rule.id}</td>
      <td className="px-4 py-2 text-xs capitalize text-foreground">{rule.category}</td>
      <td className="px-4 py-2 text-xs capitalize text-foreground">{rule.subject}</td>
      <td className="px-4 py-2 text-xs text-muted-foreground">{rule.weight.toFixed(2)}</td>
      <td className="px-4 py-2 text-xs text-muted-foreground">
        {rule.deprecated ? <span className="text-amber-600 font-medium">deprecated</span> : '—'}
      </td>
    </tr>
  );
}

export default function AdminContentPage() {
  const rulesFiles = loadAllRulesFiles();

  return (
    <div className="max-w-5xl space-y-10">
      <h1 className="text-2xl font-semibold text-foreground">Content &amp; Rules</h1>

      {rulesFiles.length === 0 && (
        <p className="text-sm text-muted-foreground">No rules files found in content/recommendations/.</p>
      )}

      {rulesFiles.map(({ filename, data }) => (
        <section key={filename} className="space-y-4">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold text-foreground">{filename}</h2>
            <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium">
              v{data.version}
            </span>
            <span className="text-xs text-muted-foreground">engine_min: {data.engine_min}</span>
            <span className="text-xs text-muted-foreground">{data.rules.length} rule{data.rules.length !== 1 ? 's' : ''}</span>
          </div>

          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted/40">
                <tr>
                  {['Rule ID', 'Category', 'Subject', 'Weight', 'Status'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.rules.map((rule) => (
                  <RuleRow key={rule.id} rule={rule} />
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}

      <p className="text-xs text-muted-foreground border-t border-border pt-4">
        Rules are read-only in Phase 2. To add or modify rules, edit the JSON file and bump the version.
        All rule content must be reviewed by a domain expert before launch.
      </p>
    </div>
  );
}
