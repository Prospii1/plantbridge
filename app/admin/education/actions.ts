'use server';

import { writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/server/supabase-server';
import { log } from '@/lib/observability/log';

const CONTENT_DIR = join(process.cwd(), 'content', 'education');

const CATEGORY_PREFIXES: Record<string, string> = {
  cannabinoid: 'cannabinoid-',
  terpene:     'terpene-',
  format:      'formats-',
  condition:   'condition-',
  diy:         'diy-',
  primer:      '',
};

const ArticleSchema = z.object({
  category: z.enum(['cannabinoid', 'terpene', 'format', 'condition', 'diy', 'primer']),
  slug_suffix: z.string().min(1).max(60).regex(/^[a-z0-9-]+$/, 'Lowercase letters, numbers, and hyphens only'),
  title: z.string().min(1).max(200),
  body: z.string().min(1).max(50000),
});

async function isAdmin(): Promise<boolean> {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  const { data: profile } = await supabase.from('profiles').select('role').eq('user_id', user.id).single();
  return profile?.role === 'admin';
}

export async function createArticle(_prev: { error?: string; success?: boolean }, formData: FormData): Promise<{ error?: string; success?: boolean }> {
  if (!(await isAdmin())) return { error: 'Unauthorized.' };

  const parsed = ArticleSchema.safeParse({
    category:    formData.get('category'),
    slug_suffix: formData.get('slug_suffix'),
    title:       formData.get('title'),
    body:        formData.get('body'),
  });

  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? 'Invalid input.';
    return { error: msg };
  }

  const { category, slug_suffix, title, body } = parsed.data;
  const prefix = CATEGORY_PREFIXES[category] ?? '';
  const slug = `${prefix}${slug_suffix}`;
  const filePath = join(CONTENT_DIR, `${slug}.md`);

  if (existsSync(filePath)) {
    return { error: `Article "${slug}.md" already exists. Choose a different slug.` };
  }

  const content = `# ${title}\n\n${body.trim()}\n`;

  try {
    writeFileSync(filePath, content, 'utf-8');
  } catch (err) {
    log.error('admin_create_article_failed', { slug, error: String(err) });
    return { error: 'Failed to write article file.' };
  }

  log.info('admin_article_created', { slug });
  revalidatePath('/admin/education');
  revalidatePath('/education');
  return { success: true };
}

export async function deleteArticle(slug: string): Promise<void> {
  if (!(await isAdmin())) return;

  // Guard against path traversal — slug must be safe
  if (!/^[\w-]+$/.test(slug)) return;

  const { unlinkSync } = await import('fs');
  const filePath = join(CONTENT_DIR, `${slug}.md`);

  try {
    unlinkSync(filePath);
  } catch (err) {
    log.error('admin_delete_article_failed', { slug, error: String(err) });
    return;
  }

  log.info('admin_article_deleted', { slug });
  revalidatePath('/admin/education');
  revalidatePath('/education');
}
