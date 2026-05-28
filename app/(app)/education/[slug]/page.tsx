import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import { marked } from 'marked';
import { loadArticle } from '@/lib/server/education/load-articles';
import { DISCLAIMERS } from '@/lib/shared/copy/disclaimers';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = loadArticle(slug);
  return { title: article?.meta.title ?? 'Article not found' };
}

export default async function EducationArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = loadArticle(slug);
  if (!article) notFound();

  const html = await marked(article.content, { async: false });
  const showMedicationDisclaimer =
    slug.includes('cannabinoid') || slug.includes('thc') || slug.includes('cbd');

  return (
    <div className="mx-auto max-w-2xl space-y-8 py-8">
      <Link
        href="/education"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        ← Back to Education Hub
      </Link>

      <article
        className="article-body"
        dangerouslySetInnerHTML={{ __html: html }}
      />

      <div className="rounded-lg border border-border/50 bg-muted/20 p-4 space-y-2 text-xs text-muted-foreground">
        <p>{DISCLAIMERS.standard}</p>
        {showMedicationDisclaimer && <p>{DISCLAIMERS.medication}</p>}
      </div>
    </div>
  );
}
