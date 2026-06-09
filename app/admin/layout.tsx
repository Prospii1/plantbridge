import { createSupabaseServerClient } from '@/lib/server/supabase-server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

const NAV_GROUPS = [
  {
    label: 'Overview',
    items: [
      { href: '/admin', label: 'Dashboard', exact: true },
      { href: '/admin/analytics', label: 'Analytics' },
    ],
  },
  {
    label: 'Users',
    items: [
      { href: '/admin/users', label: 'Users' },
      { href: '/admin/subscriptions', label: 'Subscriptions' },
      { href: '/admin/coaches', label: 'Coaches' },
    ],
  },
  {
    label: 'Partners',
    items: [
      { href: '/admin/partners', label: 'Dispensary Partners' },
      { href: '/admin/brand-partners', label: 'Brand Partners' },
    ],
  },
  {
    label: 'Content',
    items: [
      { href: '/admin/products', label: 'Products & COAs' },
      { href: '/admin/education', label: 'Education Articles' },
      { href: '/admin/content', label: 'Rules & Content' },
    ],
  },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('user_id', user.id)
    .single();

  if (profile?.role !== 'admin') redirect('/');

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="hidden w-56 flex-col border-r border-sidebar-border bg-sidebar px-4 py-6 md:flex shrink-0">
        <Link href="/admin" className="mb-8 text-sm font-semibold text-primary">
          PlantBridge Admin
        </Link>
        <nav className="flex flex-col gap-4">
          {NAV_GROUPS.map((group) => (
            <div key={group.label}>
              <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {group.label}
              </p>
              <div className="flex flex-col gap-0.5">
                {group.items.map(({ href, label }) => (
                  <Link
                    key={href}
                    href={href}
                    className="rounded-md px-3 py-2 text-sm text-sidebar-foreground transition-colors hover:bg-sidebar-accent"
                  >
                    {label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </nav>
        <div className="mt-auto pt-6 border-t border-sidebar-border">
          <Link href="/" className="rounded-md px-3 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors block">
            ← Back to app
          </Link>
        </div>
      </aside>

      {/* Mobile top nav */}
      <div className="flex flex-1 flex-col min-w-0">
        <header className="flex items-center justify-between border-b border-border bg-background px-4 py-3 md:px-6">
          <span className="text-sm font-semibold text-primary">PlantBridge Admin</span>
          <nav className="flex gap-3 overflow-x-auto md:hidden">
            {NAV_GROUPS.flatMap((g) => g.items).map(({ href, label }) => (
              <Link key={href} href={href} className="shrink-0 text-xs text-muted-foreground hover:text-foreground">
                {label}
              </Link>
            ))}
          </nav>
        </header>
        <main className="flex-1 overflow-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
