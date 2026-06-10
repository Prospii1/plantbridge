'use server';

import fs from 'fs';
import path from 'path';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const MEDIA_FILE = path.join(process.cwd(), 'content', 'media', 'items.json');

export interface MediaItem {
  id: string;
  title: string;
  source: string;
  description: string;
  url: string;
  type: 'podcast' | 'event' | 'press' | 'video';
  date?: string;
  featured?: boolean;
  createdAt: string;
}

function readItems(): MediaItem[] {
  try {
    return JSON.parse(fs.readFileSync(MEDIA_FILE, 'utf8')) as MediaItem[];
  } catch {
    return [];
  }
}

function writeItems(items: MediaItem[]): void {
  fs.mkdirSync(path.dirname(MEDIA_FILE), { recursive: true });
  fs.writeFileSync(MEDIA_FILE, JSON.stringify(items, null, 2), 'utf8');
}

const MediaSchema = z.object({
  title:       z.string().min(1).max(200),
  source:      z.string().min(1).max(100),
  description: z.string().min(1).max(1000),
  url:         z.string().url(),
  type:        z.enum(['podcast', 'event', 'press', 'video']),
  date:        z.string().optional(),
  featured:    z.boolean().optional(),
});

export async function createMediaItem(
  _prev: { error?: string; success?: boolean },
  formData: FormData,
): Promise<{ error?: string; success?: boolean }> {
  const raw = {
    title:       formData.get('title'),
    source:      formData.get('source'),
    description: formData.get('description'),
    url:         formData.get('url'),
    type:        formData.get('type'),
    date:        formData.get('date') || undefined,
    featured:    formData.get('featured') === 'on',
  };

  const result = MediaSchema.safeParse(raw);
  if (!result.success) {
    return { error: result.error.issues.map((i) => i.message).join(', ') };
  }

  const items = readItems();
  const newItem: MediaItem = {
    id: `media-${Date.now()}`,
    ...result.data,
    createdAt: new Date().toISOString(),
  };
  items.unshift(newItem);
  writeItems(items);

  revalidatePath('/admin/media');
  revalidatePath('/media');
  return { success: true };
}

export async function deleteMediaItem(id: string): Promise<void> {
  if (!/^[\w-]+$/.test(id)) return;
  const items = readItems().filter((item) => item.id !== id);
  writeItems(items);
  revalidatePath('/admin/media');
  revalidatePath('/media');
}

export async function toggleFeatured(id: string): Promise<void> {
  if (!/^[\w-]+$/.test(id)) return;
  const items = readItems().map((item) =>
    item.id === id ? { ...item, featured: !item.featured } : item,
  );
  writeItems(items);
  revalidatePath('/admin/media');
  revalidatePath('/media');
}

export { readItems };
