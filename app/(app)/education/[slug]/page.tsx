import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import { marked } from 'marked';
import { loadArticle } from '@/lib/server/education/load-articles';
import { DISCLAIMERS } from '@/lib/shared/copy/disclaimers';
import { createSupabaseServerClient } from '@/lib/server/supabase-server';
import { getUserTier } from '@/lib/server/subscriptions';
import { hasAccess } from '@/lib/shared/utils/tier';

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ from?: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = loadArticle(slug);
  return { title: article?.meta.title ?? 'Article not found' };
}

const CATEGORY_LABELS: Record<string, string> = {
  condition:   'Condition Guide',
  cannabinoid: 'Cannabinoid',
  terpene:     'Terpene',
  format:      'Format',
  primer:      'Getting Started',
  diy:         'DIY Cannabis Medicine',
};

/** Free articles visible to all tiers (primers + overview articles) */
const FREE_CATEGORIES = new Set(['primer']);

function extractPreview(html: string): string {
  const matches = Array.from(html.matchAll(/<\/(p|ul|ol|h[1-6])>/g));
  if (matches.length < 3) return html;
  const thirdClose = matches[2]!;
  const cutoff = (thirdClose.index ?? 0) + thirdClose[0]!.length;
  return html.slice(0, cutoff);
}

export default async function EducationArticlePage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { from } = await searchParams;
  const article = loadArticle(slug);
  if (!article) notFound();

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  const tier = user ? await getUserTier(user.id) : 'free' as const;
  const isPaid = hasAccess(tier, 'self_guided');
  const isFreeCategory = FREE_CATEGORIES.has(article.meta.category);
  const fullAccess = isPaid || isFreeCategory;

  const fullHtml    = await marked(article.content, { async: false });
  const previewHtml = extractPreview(fullHtml);

  const showMedicationDisclaimer =
    slug.includes('cannabinoid') || slug.includes('thc') || slug.includes('cbd') || slug.includes('condition-');

  const backHref  = from?.startsWith('/care-plan/') ? from : '/education';
  const backLabel = from?.startsWith('/care-plan/') ? '← Back to your care plan' : '← Back to Education Hub';

  return (
    <div className="mx-auto max-w-2xl space-y-6 py-8">
      <Link
        href={backHref}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        {backLabel}
      </Link>

      {/* Article header */}
      <div className="space-y-2 pb-2 border-b border-border">
        <div className="flex items-center gap-3 text-xs">
          <span className="font-semibold uppercase tracking-widest text-primary">
            {CATEGORY_LABELS[article.meta.category] ?? article.meta.category}
          </span>
          <span className="text-muted-foreground">{article.meta.readMinutes} min read</span>
          {!fullAccess && (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
              Preview
            </span>
          )}
        </div>
        <h1 className="font-display text-2xl font-medium text-foreground leading-tight">
          {article.meta.title}
        </h1>
      </div>

      {fullAccess ? (
        <article
          className="article-body"
          dangerouslySetInnerHTML={{ __html: fullHtml }}
        />
      ) : (
        <>
          {/* Preview content */}
          <article
            className="article-body"
            dangerouslySetInnerHTML={{ __html: previewHtml }}
          />

          {/* Paywall gate */}
          <div className="relative">
            {/* Blurred continuation */}
            <div
              className="pointer-events-none select-none overflow-hidden rounded-2xl"
              aria-hidden="true"
              style={{ maxHeight: '120px', maskImage: 'linear-gradient(to bottom, black 0%, transparent 100%)', WebkitMaskImage: 'linear-gradient(to bottom, black 0%, transparent 100%)' }}
            >
              <article className="article-body opacity-40" dangerouslySetInnerHTML={{ __html: fullHtml.slice(previewHtml.length) }} />
            </div>

            {/* Gate card */}
            <div className="rounded-2xl border border-border bg-card p-6 space-y-4 text-center card-shadow mt-2">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary" aria-hidden="true">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0110 0v4"/>
                </svg>
              </div>
              <div className="space-y-1">
                <p className="font-semibold text-foreground">Full article — Self-Guided members only</p>
                <p className="text-sm text-muted-foreground">
                  Unlock all {article.meta.readMinutes} minutes of evidence-based education, plus your personalized care plan and outcome tracking.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 justify-center">
                <Link
                  href="/account"
                  className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
                >
                  Upgrade to Self-Guided — $19.99/mo
                </Link>
                {!user && (
                  <Link
                    href="/login"
                    className="rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-secondary transition-colors"
                  >
                    Sign in
                  </Link>
                )}
              </div>
              <p className="text-xs text-muted-foreground">Cancel anytime. No commitment.</p>
            </div>
          </div>
        </>
      )}

      <div className="rounded-2xl border border-border/50 bg-muted/20 p-4 space-y-2 text-xs text-muted-foreground">
        <p>{DISCLAIMERS.standard}</p>
        {showMedicationDisclaimer && <p className="mt-1">{DISCLAIMERS.medication}</p>}
      </div>
    </div>
  );
}
