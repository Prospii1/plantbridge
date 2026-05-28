import fs from 'fs';
import path from 'path';

export type ArticleCategory = 'cannabinoid' | 'terpene' | 'format' | 'primer';

export interface ArticleMeta {
  slug: string;
  title: string;
  category: ArticleCategory;
}

const CONTENT_DIR = path.join(process.cwd(), 'content', 'education');

function categoryFromSlug(slug: string): ArticleCategory {
  if (slug.startsWith('cannabinoid-')) return 'cannabinoid';
  if (slug.startsWith('terpene-')) return 'terpene';
  if (slug.startsWith('formats-')) return 'format';
  return 'primer';
}

function titleFromContent(content: string, slug: string): string {
  const match = /^#\s+(.+)$/m.exec(content);
  return match?.[1] ?? slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export function loadArticleList(): ArticleMeta[] {
  let files: string[];
  try {
    files = fs.readdirSync(CONTENT_DIR).filter((f) => f.endsWith('.md'));
  } catch {
    return [];
  }

  return files.map((file) => {
    const slug = file.replace(/\.md$/, '');
    const content = fs.readFileSync(path.join(CONTENT_DIR, file), 'utf-8');
    return {
      slug,
      title: titleFromContent(content, slug),
      category: categoryFromSlug(slug),
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
      title: titleFromContent(content, slug),
      category: categoryFromSlug(slug),
    },
    content,
  };
}
