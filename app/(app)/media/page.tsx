import type { Metadata } from 'next';
import fs from 'fs';
import path from 'path';
import { DISCLAIMERS } from '@/lib/shared/copy/disclaimers';

export const metadata: Metadata = { title: 'Media Hub — PlantBridge' };

interface MediaItem {
  id: string;
  title: string;
  description: string;
  url: string;
  type: 'podcast' | 'event' | 'press' | 'video';
  source: string;
  date?: string;
  featured?: boolean;
  createdAt: string;
}

const TAG_COLORS: Record<string, string> = {
  podcast: 'bg-violet-100 text-violet-700',
  event:   'bg-emerald-100 text-emerald-700',
  press:   'bg-blue-100 text-blue-700',
  video:   'bg-rose-100 text-rose-700',
};

const TAG_ICONS: Record<string, string> = {
  podcast: 'M9 18V5l12-2v13M6 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm12-2a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  event:   'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z',
  press:   'M19 20H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v1m2 13a2 2 0 0 1-2-2V7m2 13a2 2 0 0 0 2-2V9.5a2 2 0 0 0-2-2h-2',
  video:   'M15 10l4.553-2.069A1 1 0 0 1 21 8.82v6.361a1 1 0 0 1-1.447.894L15 14M3 8a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8z',
};

function loadItems(): MediaItem[] {
  const filePath = path.join(process.cwd(), 'content', 'media', 'items.json');
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8')) as MediaItem[];
  } catch {
    return [];
  }
}

const SECTION_META = [
  { key: 'podcast' as const, label: 'Podcasts',              description: 'Educational audio series on cannabis science and wellness.' },
  { key: 'event'   as const, label: 'Events',                description: 'Conferences, expos, and gatherings for the cannabis education community.' },
  { key: 'press'   as const, label: 'Press & Publications',  description: 'Journals, news, and industry media worth following.' },
  { key: 'video'   as const, label: 'Videos & Lectures',     description: 'Talks and educational videos from researchers and clinicians.' },
];

function MediaCard({ item }: { item: MediaItem }) {
  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-start gap-4 rounded-2xl border border-border bg-card p-4 hover:border-primary/40 hover:bg-secondary transition-colors card-shadow"
    >
      <div className={`mt-0.5 shrink-0 w-9 h-9 rounded-xl flex items-center justify-center ${TAG_COLORS[item.type]}`}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d={TAG_ICONS[item.type]} />
        </svg>
      </div>
      <div className="flex-1 space-y-1.5 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
            {item.title}
          </span>
          {item.date && (
            <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
              {item.date}
            </span>
          )}
          {item.featured && (
            <span className="rounded-full bg-primary/10 text-primary px-2 py-0.5 text-[10px] font-medium">
              Featured
            </span>
          )}
        </div>
        <p className="text-xs font-medium text-primary">{item.source}</p>
        <p className="text-xs text-muted-foreground leading-relaxed">{item.description}</p>
      </div>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground shrink-0 mt-1 group-hover:text-primary transition-colors" aria-hidden="true">
        <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><path d="M15 3h6v6M10 14L21 3"/>
      </svg>
    </a>
  );
}

export default function MediaPage() {
  const allItems = loadItems();
  // Featured items first within each section
  const sorted = [...allItems].sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));

  return (
    <div className="mx-auto max-w-3xl space-y-10">
      <div className="space-y-1 pt-2">
        <h1 className="font-display text-2xl font-medium text-foreground">Media Hub</h1>
        <p className="text-sm text-muted-foreground">
          Podcasts, events, publications, and videos curated for cannabis wellness education.
        </p>
      </div>

      {SECTION_META.map(({ key, label, description }) => {
        const items = sorted.filter((i) => i.type === key);
        if (items.length === 0) return null;
        return (
          <section key={key} className="space-y-4">
            <div>
              <h2 className="text-sm font-semibold text-foreground">{label}</h2>
              <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
            </div>
            <div className="space-y-3">
              {items.map((item) => (
                <MediaCard key={item.id} item={item} />
              ))}
            </div>
          </section>
        );
      })}

      <p className="text-xs text-muted-foreground border-t border-border pt-4 pb-2">
        {DISCLAIMERS.standard} External links are provided for educational purposes only.
        PlantBridge does not endorse or guarantee the accuracy of third-party content.
      </p>
    </div>
  );
}
