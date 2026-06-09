import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/server/supabase-server';
import { createSupabaseAdminClient } from '@/lib/server/supabase-admin';
import { loadArticleList, type ArticleCategory, type ArticleMeta } from '@/lib/server/education/load-articles';
import { DISCLAIMERS } from '@/lib/shared/copy/disclaimers';
import { getUserTier } from '@/lib/server/subscriptions';
import { hasAccess } from '@/lib/shared/utils/tier';
import { UpgradeGate } from '@/components/shared/upgrade-gate';

export const metadata: Metadata = { title: 'Education' };

interface PageProps {
  searchParams: Promise<{ q?: string }>;
}

const CATEGORY_LABELS: Record<ArticleCategory, string> = {
  condition:   'Your Conditions',
  primer:      'Getting Started',
  cannabinoid: 'Cannabinoids',
  terpene:     'Terpenes',
  format:      'Formats & Methods',
  diy:         'DIY Cannabis Medicine',
};

const CATEGORY_DESCRIPTIONS: Partial<Record<ArticleCategory, string>> = {
  condition:   'Condition-specific education — what the research says about each wellness area.',
  primer:      'New to cannabis? Start here.',
  cannabinoid: 'CBD, CBG, CBN, THC and how they work.',
  terpene:     'The aromatic compounds that shape effects.',
  format:      'Tinctures, edibles, topicals and more.',
  diy:         'Step-by-step guides for preparing cannabis products at home.',
};

const CATEGORY_ORDER: ArticleCategory[] = ['condition', 'primer', 'cannabinoid', 'terpene', 'format', 'diy'];

// Free users see articles in these categories as a teaser
const FREE_CATEGORIES: ArticleCategory[] = ['primer', 'cannabinoid'];

export default async function EducationPage({ searchParams }: PageProps) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const tier = await getUserTier(user.id);
  const hasMarketplace = hasAccess(tier, 'marketplace');

  const { q } = await searchParams;
  const query = q?.toLowerCase().trim() ?? '';

  const allArticles = loadArticleList();

  // Free users only see primer + cannabinoid categories as teaser
  const visibleArticles = hasMarketplace
    ? allArticles
    : allArticles.filter((a) => FREE_CATEGORIES.includes(a.category));

  const filteredArticles = query
    ? visibleArticles.filter((a) => a.title.toLowerCase().includes(query) || a.category.includes(query))
    : visibleArticles;

  const grouped = CATEGORY_ORDER.reduce<Record<ArticleCategory, ArticleMeta[]>>(
    (acc, cat) => {
      acc[cat] = filteredArticles.filter((a) => a.category === cat);
      return acc;
    },
    { condition: [], primer: [], cannabinoid: [], terpene: [], format: [], diy: [] },
  );

  const totalCount = allArticles.length;

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      {/* Header */}
      <div className="space-y-1 pt-2">
        <h1 className="font-display text-2xl font-medium text-foreground">Education Hub</h1>
        <p className="text-sm text-muted-foreground">
          {hasMarketplace
            ? `${totalCount} articles on cannabinoids, terpenes, formats, and conditions.`
            : `${visibleArticles.length} of ${totalCount} articles available on the free plan.`}
        </p>
      </div>

      {/* Search */}
      <form method="GET" action="/education" className="relative">
        <svg
          width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
        </svg>
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Search articles…"
          className="w-full rounded-2xl border border-border bg-card pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50"
        />
      </form>

      {query && (
        <p className="text-sm text-muted-foreground">
          {filteredArticles.length === 0
            ? `No articles found for "${q}"`
            : `${filteredArticles.length} result${filteredArticles.length === 1 ? '' : 's'} for "${q}"`}
          {' — '}
          <Link href="/education" className="text-primary hover:underline">Clear search</Link>
        </p>
      )}

      {/* Article groups */}
      {CATEGORY_ORDER.map((cat) => {
        const group = grouped[cat];
        if (!group || group.length === 0) return null;
        return (
          <section key={cat} className="space-y-3">
            <div>
              <h2 className="text-sm font-semibold text-foreground">{CATEGORY_LABELS[cat]}</h2>
              {CATEGORY_DESCRIPTIONS[cat] && !query && (
                <p className="text-xs text-muted-foreground mt-0.5">{CATEGORY_DESCRIPTIONS[cat]}</p>
              )}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {group.map((article) => (
                <Link
                  key={article.slug}
                  href={`/education/${article.slug}`}
                  className="group flex flex-col gap-2 rounded-2xl border border-border bg-card p-4 transition-colors hover:border-primary/40 hover:bg-secondary card-shadow"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-semibold uppercase tracking-widest text-primary/70">
                      {CATEGORY_LABELS[article.category]}
                    </span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {article.readMinutes} min
                    </span>
                  </div>
                  <span className="text-sm font-semibold text-foreground leading-snug group-hover:text-primary transition-colors">
                    {article.title}
                  </span>
                </Link>
              ))}
            </div>
          </section>
        );
      })}

      {/* Upgrade gate for free users */}
      {!hasMarketplace && (
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-1">
          <UpgradeGate
            requiredTier="marketplace"
            feature="Unlock the full Education Hub"
            description="Access all articles on terpenes, conditions, formats, DIY medicine, and more."
            bullets={[
              'All 17+ articles across 6 categories',
              'Marketplace discounts & partner offers',
              'Health & lab resource access',
              'Certifications & wellness tools',
            ]}
          />
        </div>
      )}

      <p className="text-xs text-muted-foreground border-t border-border pt-4 pb-2">
        {DISCLAIMERS.standard}
      </p>
    </div>
  );
}
