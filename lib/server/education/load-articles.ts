import fs from 'fs';
import path from 'path';

export type ArticleCategory = 'cannabinoid' | 'terpene' | 'format' | 'primer' | 'condition' | 'diy';

export interface ArticleMeta {
  slug: string;
  title: string;
  category: ArticleCategory;
  readMinutes: number;
}

const CONTENT_DIR = path.join(process.cwd(), 'content', 'education');

function categoryFromSlug(slug: string): ArticleCategory {
  if (slug.startsWith('cannabinoid-')) return 'cannabinoid';
  if (slug.startsWith('terpene-'))     return 'terpene';
  if (slug.startsWith('formats-'))     return 'format';
  if (slug.startsWith('condition-'))   return 'condition';
  if (slug.startsWith('diy-'))         return 'diy';
  return 'primer';
}

function titleFromContent(content: string, slug: string): string {
  const match = /^#\s+(.+)$/m.exec(content);
  return match?.[1] ?? slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Rough reading time: ~200 words per minute */
function readMinutes(content: string): number {
  const words = content.trim().split(/\s+/).length;
  return Math.max(1, Math.round(words / 200));
}

export function loadArticleList(): ArticleMeta[] {
  let files: string[];
  try {
    files = fs.readdirSync(CONTENT_DIR).filter((f) => f.endsWith('.md'));
  } catch {
    return [];
  }

  return files.map((file) => {
    const slug    = file.replace(/\.md$/, '');
    const content = fs.readFileSync(path.join(CONTENT_DIR, file), 'utf-8');
    return {
      slug,
      title:       titleFromContent(content, slug),
      category:    categoryFromSlug(slug),
      readMinutes: readMinutes(content),
    };
  });
}

export function loadArticle(slug: string): { meta: ArticleMeta; content: string } | null {
  // Guard against path traversal
  if (!/^[\w-]+$/.test(slug)) return null;

  const filePath = path.join(CONTENT_DIR, `${slug}.md`);
  if (!fs.existsSync(filePath)) return null;

  const content = fs.readFileSync(filePath, 'utf-8');
  return {
    meta: {
      slug,
      title:       titleFromContent(content, slug),
      category:    categoryFromSlug(slug),
      readMinutes: readMinutes(content),
    },
    content,
  };
}

/**
 * Converts a dotted education_ref (e.g. "edu.terpene.linalool") to an article
 * slug. Format refs fall back to the overview; condition refs map to condition-{name}.
 */
export function educationRefToSlug(ref: string): string {
  const slug = ref.replace(/^edu\./, '').replace(/\./g, '-');
  if (slug.startsWith('format-')) return 'formats-overview';
  return slug;
}
