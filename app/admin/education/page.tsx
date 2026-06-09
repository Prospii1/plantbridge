import Link from 'next/link';
import { loadArticleList } from '@/lib/server/education/load-articles';
import { createArticle, deleteArticle } from './actions';

const CATEGORIES = ['cannabinoid', 'terpene', 'format', 'condition', 'diy', 'primer'] as const;

async function createArticleAction(formData: FormData): Promise<void> {
  'use server';
  await createArticle({}, formData);
}

const CATEGORY_LABELS: Record<string, string> = {
  cannabinoid: 'Cannabinoid',
  terpene:     'Terpene',
  format:      'Format',
  condition:   'Condition Guide',
  diy:         'DIY Cannabis Medicine',
  primer:      'Getting Started (Primer)',
};

const CATEGORY_SLUG_HINTS: Record<string, string> = {
  cannabinoid: 'e.g. "cbg" → slug: cannabinoid-cbg',
  terpene:     'e.g. "pinene" → slug: terpene-pinene',
  format:      'e.g. "capsules" → slug: formats-capsules',
  condition:   'e.g. "insomnia" → slug: condition-insomnia',
  diy:         'e.g. "salves" → slug: diy-salves',
  primer:      'e.g. "getting-started" → slug: getting-started',
};

async function CreateArticleForm() {
  return (
    <section className="rounded-lg border border-border bg-card p-5 space-y-4">
      <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">Add Article</h2>

      <form action={createArticleAction} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Category *</label>
            <select name="category" required
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Slug suffix * <span className="text-muted-foreground/70">(lowercase, hyphens only)</span></label>
            <input
              type="text"
              name="slug_suffix"
              required
              maxLength={60}
              pattern="[a-z0-9-]+"
              placeholder="e.g. cbc, pinene, pain-management"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Article title *</label>
          <input
            type="text"
            name="title"
            required
            maxLength={200}
            placeholder="e.g. CBC: The Cannabinoid Synergy Builder"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Content (Markdown) *</label>
          <p className="text-xs text-muted-foreground/70">
            Write the article body in Markdown. The title above will be inserted as an H1 at the top automatically.
            Use educational framing (&ldquo;may support&rdquo;, &ldquo;research suggests&rdquo;) — no medical claims.
          </p>
          <textarea
            name="body"
            required
            rows={16}
            maxLength={50000}
            placeholder="## Overview&#10;&#10;CBC (cannabichromene) is a minor cannabinoid...&#10;&#10;## What the research suggests&#10;&#10;Early studies indicate CBC may support..."
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-y"
          />
        </div>

        <div className="flex items-center gap-4">
          <button
            type="submit"
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Create article
          </button>
          <p className="text-xs text-muted-foreground">
            File will be written to <code className="font-mono bg-muted px-1 rounded">content/education/[slug].md</code>.
          </p>
        </div>
      </form>

      {/* Slug preview hints per category */}
      <div className="rounded-md bg-muted/30 p-3 space-y-1">
        <p className="text-xs font-medium text-muted-foreground">Slug format per category:</p>
        {CATEGORIES.map((c) => (
          <p key={c} className="text-xs text-muted-foreground">
            <span className="font-medium">{CATEGORY_LABELS[c]}:</span> {CATEGORY_SLUG_HINTS[c]}
          </p>
        ))}
      </div>
    </section>
  );
}

export default function AdminEducationPage() {
  const articles = loadArticleList().sort((a, b) => a.category.localeCompare(b.category) || a.slug.localeCompare(b.slug));

  const grouped = CATEGORIES.reduce<Record<string, typeof articles>>((acc, cat) => {
    acc[cat] = articles.filter((a) => a.category === cat);
    return acc;
  }, {});

  return (
    <div className="max-w-4xl space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-foreground">Education Content</h1>
        <span className="text-sm text-muted-foreground">{articles.length} articles</span>
      </div>

      <CreateArticleForm />

      {/* Articles by category */}
      <div className="space-y-6">
        {CATEGORIES.map((cat) => {
          const group = grouped[cat] ?? [];
          if (group.length === 0) return null;
          return (
            <section key={cat} className="space-y-2">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {CATEGORY_LABELS[cat]} ({group.length})
              </h2>
              <div className="overflow-hidden rounded-lg border border-border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40 text-xs text-muted-foreground">
                    <tr>
                      <th className="px-4 py-2.5 text-left font-medium">Title</th>
                      <th className="px-4 py-2.5 text-left font-medium">Slug</th>
                      <th className="px-4 py-2.5 text-left font-medium">Read time</th>
                      <th className="px-4 py-2.5 text-left font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {group.map((article) => {
                      const deleteWithSlug = deleteArticle.bind(null, article.slug);
                      return (
                        <tr key={article.slug} className="bg-card hover:bg-muted/20 transition-colors">
                          <td className="px-4 py-3 font-medium text-foreground">{article.title}</td>
                          <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{article.slug}</td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">{article.readMinutes} min</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <Link
                                href={`/education/${article.slug}`}
                                target="_blank"
                                className="text-xs text-primary hover:underline"
                              >
                                Preview
                              </Link>
                              <form action={deleteWithSlug}>
                                <button
                                  type="submit"
                                  className="text-xs text-red-500 hover:text-red-700 transition-colors"
                                >
                                  Delete
                                </button>
                              </form>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          );
        })}
      </div>

      <p className="text-xs text-muted-foreground border-t border-border pt-4">
        All article content must use educational framing only. No medical claims, diagnosis language, or outcome guarantees.
        Articles are reviewed by a domain expert before public launch.
      </p>
    </div>
  );
}
