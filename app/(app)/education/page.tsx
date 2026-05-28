import type { Metadata } from 'next';
import Link from 'next/link';
import { loadArticleList, type ArticleCategory } from '@/lib/server/education/load-articles';
import { DISCLAIMERS } from '@/lib/shared/copy/disclaimers';

export const metadata: Metadata = { title: 'Education' };

const CATEGORY_LABELS: Record<ArticleCategory, string> = {
  cannabinoid: 'Cannabinoids',
  terpene: 'Terpenes',
  format: 'Formats',
  primer: 'Getting Started',
};

const CATEGORY_ORDER: ArticleCategory[] = ['primer', 'cannabinoid', 'terpene', 'format'];

export default function EducationPage() {
  const articles = loadArticleList();

  const grouped = CATEGORY_ORDER.reduce<Record<ArticleCategory, typeof articles>>(
    (acc, cat) => {
      acc[cat] = articles.filter((a) => a.category === cat);
      return acc;
    },
    { primer: [], cannabinoid: [], terpene: [], format: [] },
  );

  return (
    <div className="mx-auto max-w-3xl space-y-10 py-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold text-foreground">Education Hub</h1>
        <p className="text-sm text-muted-foreground">
          Learn about cannabinoids, terpenes, and how to make informed wellness choices.
        </p>
      </div>

      {CATEGORY_ORDER.map((cat) => {
        const group = grouped[cat];
        if (!group || group.length === 0) return null;
        return (
          <section key={cat} className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              {CATEGORY_LABELS[cat]}
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {group.map((article) => (
                <Link
                  key={article.slug}
                  href={`/education/${article.slug}`}
                  className="flex flex-col gap-1.5 rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary/40 hover:bg-primary/5"
                >
                  <span className="text-xs font-medium uppercase tracking-wide text-primary/70">
                    {CATEGORY_LABELS[article.category]}
                  </span>
                  <span className="text-sm font-medium text-foreground">{article.title}</span>
                </Link>
              ))}
            </div>
          </section>
        );
      })}

      <p className="text-xs text-muted-foreground border-t border-border pt-4">{DISCLAIMERS.standard}</p>
    </div>
  );
}
