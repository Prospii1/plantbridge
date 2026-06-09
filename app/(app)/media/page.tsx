import type { Metadata } from 'next';
import { DISCLAIMERS } from '@/lib/shared/copy/disclaimers';

export const metadata: Metadata = { title: 'Media Hub — PlantBridge' };

interface MediaItem {
  title: string;
  description: string;
  url: string;
  type: 'podcast' | 'event' | 'press' | 'video';
  source: string;
  date?: string;
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

const PODCASTS: MediaItem[] = [
  {
    title: 'The Cannabis Enigma',
    source: 'Hadassah Medical Center',
    description: 'Scientific deep-dives into cannabis research from one of the world\'s leading medical institutions. Topics include endocannabinoid system biology, clinical trials, and therapeutic applications.',
    url: 'https://www.thecannabisenigma.com',
    type: 'podcast',
  },
  {
    title: 'Cannabis Nursing Solutions',
    source: 'Eloise Theisen',
    description: 'Focused on clinical cannabis education for healthcare providers. Covers dosing principles, patient consultation frameworks, and emerging research in an accessible format.',
    url: 'https://cannabisnursingsolutions.com',
    type: 'podcast',
  },
  {
    title: 'Shaping Fire',
    source: 'Ariel Rosenfeld',
    description: 'Conversations with scientists, growers, and industry leaders exploring the science and culture of cannabis. Strong focus on terpenes, cultivar effects, and the entourage effect.',
    url: 'https://www.shapingfire.com',
    type: 'podcast',
  },
  {
    title: 'CannaInsider',
    source: 'Jimmy Young',
    description: 'Business-focused cannabis podcast with interviews from founders, investors, and wellness entrepreneurs. Good for understanding the industry landscape alongside the science.',
    url: 'https://www.cannainsider.com/podcast',
    type: 'podcast',
  },
];

const EVENTS: MediaItem[] = [
  {
    title: 'MJBizCon',
    source: 'MJBizDaily',
    description: 'The world\'s largest cannabis industry event — featuring scientific sessions, policy panels, and wellness tracks alongside the business expo. Held annually in Las Vegas.',
    url: 'https://mjbizconference.com',
    type: 'event',
    date: 'November 2025',
  },
  {
    title: 'Cannabis Science Conference',
    source: 'Emerald Scientific',
    description: 'Science-first conference bringing together analytical chemists, clinicians, and researchers to advance the scientific understanding of cannabis and cannabinoids.',
    url: 'https://www.cannabisscienceconference.com',
    type: 'event',
    date: 'Annual',
  },
  {
    title: 'CannMed',
    source: 'CannMed',
    description: 'Medical cannabis education conference connecting physicians, scientists, and patients. Curriculum covers endocannabinology, clinical applications, and patient outcomes research.',
    url: 'https://www.cannmedevents.com',
    type: 'event',
    date: 'Annual',
  },
  {
    title: 'WeedCon',
    source: 'WeedCon',
    description: 'Consumer-facing cannabis wellness event with education sessions, product showcases, and expert Q&As. Focus on wellness, self-care, and responsible use.',
    url: 'https://www.weedcon.com',
    type: 'event',
    date: 'Annual',
  },
];

const PRESS: MediaItem[] = [
  {
    title: 'Cannabis & Cannabinoid Research Journal',
    source: 'Mary Ann Liebert',
    description: 'Peer-reviewed open-access journal dedicated to cannabis science. All articles freely available — ideal for staying current with clinical and preclinical research.',
    url: 'https://www.liebertpub.com/loi/can',
    type: 'press',
  },
  {
    title: 'Leafly News',
    source: 'Leafly',
    description: 'Consumer-facing cannabis news covering new research findings, state policy changes, product launches, and wellness trends. High-volume, good for staying current.',
    url: 'https://www.leafly.com/news',
    type: 'press',
  },
  {
    title: 'MJBizDaily',
    source: 'MJBizDaily',
    description: 'Industry news and data for cannabis businesses. Covers market data, regulatory changes, investment trends, and company news across the US and Canada.',
    url: 'https://mjbizdaily.com',
    type: 'press',
  },
  {
    title: 'Marijuana Moment',
    source: 'Marijuana Moment',
    description: 'Policy-focused cannabis news. Best source for tracking federal and state legislation, regulatory agency actions, and political developments affecting the industry.',
    url: 'https://www.marijuanamoment.net',
    type: 'press',
  },
];

const VIDEOS: MediaItem[] = [
  {
    title: 'The Endocannabinoid System — Dr. Ethan Russo',
    source: 'YouTube',
    description: 'Comprehensive lecture by one of the world\'s leading cannabinoid researchers explaining how the endocannabinoid system works and its role in homeostasis and wellness.',
    url: 'https://www.youtube.com/results?search_query=endocannabinoid+system+ethan+russo',
    type: 'video',
  },
  {
    title: 'Terpenes & the Entourage Effect',
    source: 'Project CBD',
    description: 'Educational video series exploring how terpenes interact with cannabinoids to produce different wellness effects — the science behind synergistic plant compounds.',
    url: 'https://www.projectcbd.org/science/cannabis-pharmacology/terpenes-entourage',
    type: 'video',
  },
  {
    title: 'Cannabis & Sleep — Scientific Overview',
    source: 'Sleep Foundation',
    description: 'Evidence-based review of research on cannabis, CBD, and sleep — covering what the science says about cannabinoids and sleep architecture.',
    url: 'https://www.sleepfoundation.org/sleep-aids/cannabis-and-sleep',
    type: 'video',
  },
];

const SECTIONS = [
  { key: 'podcast', label: 'Podcasts', description: 'Educational audio series on cannabis science and wellness.', items: PODCASTS },
  { key: 'event',   label: 'Events',   description: 'Conferences, expos, and gatherings for the cannabis education community.', items: EVENTS },
  { key: 'press',   label: 'Press & Publications', description: 'Journals, news, and industry media worth following.', items: PRESS },
  { key: 'video',   label: 'Videos & Lectures', description: 'Talks and educational videos from researchers and clinicians.', items: VIDEOS },
] as const;

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
  return (
    <div className="mx-auto max-w-3xl space-y-10">
      <div className="space-y-1 pt-2">
        <h1 className="font-display text-2xl font-medium text-foreground">Media Hub</h1>
        <p className="text-sm text-muted-foreground">
          Podcasts, events, publications, and videos curated for cannabis wellness education.
        </p>
      </div>

      {SECTIONS.map((section) => (
        <section key={section.key} className="space-y-4">
          <div>
            <h2 className="text-sm font-semibold text-foreground">{section.label}</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{section.description}</p>
          </div>
          <div className="space-y-3">
            {section.items.map((item) => (
              <MediaCard key={item.title} item={item} />
            ))}
          </div>
        </section>
      ))}

      <p className="text-xs text-muted-foreground border-t border-border pt-4 pb-2">
        {DISCLAIMERS.standard} External links are provided for educational purposes only.
        PlantBridge does not endorse or guarantee the accuracy of third-party content.
      </p>
    </div>
  );
}
