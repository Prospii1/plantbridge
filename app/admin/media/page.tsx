import { readItems, createMediaItem, deleteMediaItem, toggleFeatured } from './actions';

const TYPE_COLORS: Record<string, string> = {
  podcast: 'bg-violet-100 text-violet-700',
  event:   'bg-emerald-100 text-emerald-700',
  press:   'bg-blue-100 text-blue-700',
  video:   'bg-rose-100 text-rose-700',
};

async function createMediaItemAction(_prev: unknown, formData: FormData): Promise<void> {
  'use server';
  await createMediaItem({}, formData);
}

export default async function AdminMediaPage() {
  const items = readItems();

  const byType = {
    podcast: items.filter((i) => i.type === 'podcast'),
    event:   items.filter((i) => i.type === 'event'),
    press:   items.filter((i) => i.type === 'press'),
    video:   items.filter((i) => i.type === 'video'),
  };

  return (
    <div className="max-w-5xl space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Media Hub Management</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Add and manage podcasts, events, press links, and videos. Changes appear immediately on /media.
          </p>
        </div>
        <span className="text-sm text-muted-foreground">{items.length} items total</span>
      </div>

      {/* Add item form */}
      <section className="rounded-lg border border-border bg-card p-5 space-y-4">
        <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">Add Media Item</h2>
        <form action={createMediaItemAction.bind(null, null)} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Title *</label>
              <input type="text" name="title" required maxLength={200}
                placeholder="The Cannabis Enigma"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Source / Publisher *</label>
              <input type="text" name="source" required maxLength={100}
                placeholder="Hadassah Medical Center"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Type *</label>
              <select name="type" required
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                <option value="podcast">Podcast</option>
                <option value="event">Event</option>
                <option value="press">Press / Publication</option>
                <option value="video">Video / Lecture</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Date (for events)</label>
              <input type="text" name="date" maxLength={50}
                placeholder="e.g. Nov 13–15, 2025"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">URL *</label>
            <input type="url" name="url" required
              placeholder="https://example.com"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Description *</label>
            <textarea name="description" required rows={3} maxLength={1000}
              placeholder="Brief description of this media item…"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>

          <div className="flex items-center gap-2">
            <input type="checkbox" name="featured" id="featured"
              className="h-4 w-4 rounded border-input" />
            <label htmlFor="featured" className="text-xs text-muted-foreground">Featured (shown first in its category)</label>
          </div>

          <button type="submit"
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
            Add item
          </button>
        </form>
      </section>

      {/* Items by type */}
      {(['podcast', 'event', 'press', 'video'] as const).map((type) => {
        const group = byType[type];
        const label = { podcast: 'Podcasts', event: 'Events', press: 'Press & Publications', video: 'Videos & Lectures' }[type];
        return (
          <section key={type} className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground">
                {label} <span className="text-muted-foreground font-normal">({group.length})</span>
              </h2>
            </div>
            {group.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">No {label.toLowerCase()} added yet.</p>
            ) : (
              <div className="space-y-2">
                {group.map((item) => {
                  const toggleAction = toggleFeatured.bind(null, item.id);
                  const deleteAction = deleteMediaItem.bind(null, item.id);
                  return (
                    <div key={item.id} className="rounded-lg border border-border bg-card p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-0.5 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${TYPE_COLORS[type]}`}>
                              {type}
                            </span>
                            {item.featured && (
                              <span className="rounded-full bg-amber-100 text-amber-700 px-2 py-0.5 text-[10px] font-semibold">Featured</span>
                            )}
                          </div>
                          <p className="text-sm font-medium text-foreground">{item.title}</p>
                          <p className="text-xs text-muted-foreground">{item.source}{item.date ? ` · ${item.date}` : ''}</p>
                          <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{item.description}</p>
                          <a href={item.url} target="_blank" rel="noopener noreferrer"
                            className="text-xs text-primary hover:underline truncate block mt-0.5">
                            {item.url}
                          </a>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <form action={toggleAction}>
                            <button type="submit"
                              className="rounded border border-border px-3 py-1 text-xs hover:bg-secondary transition-colors">
                              {item.featured ? 'Unfeature' : 'Feature'}
                            </button>
                          </form>
                          <form action={deleteAction}>
                            <button type="submit"
                              className="rounded border border-destructive/40 px-3 py-1 text-xs text-destructive hover:bg-destructive/10 transition-colors">
                              Delete
                            </button>
                          </form>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        );
      })}

      {items.length === 0 && (
        <div className="rounded-lg border border-border bg-card p-8 text-center">
          <p className="text-sm text-muted-foreground">No media items yet. Add one above.</p>
          <p className="text-xs text-muted-foreground mt-1">
            Items added here will appear live on the /media page immediately.
          </p>
        </div>
      )}
    </div>
  );
}
