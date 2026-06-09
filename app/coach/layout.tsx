import { createSupabaseServerClient } from '@/lib/server/supabase-server';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';

const NAV_ITEMS = [
  { href: '/coach', label: 'Dashboard', exact: true },
  { href: '/coach/clients', label: 'Clients', exact: false },
  { href: '/coach/messages', label: 'Messages', exact: false },
  { href: '/coach/schedule', label: 'Schedule', exact: false },
  { href: '/account', label: 'Account', exact: false },
];

export default async function CoachLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('user_id', user.id)
    .single();

  if (profile?.role !== 'coach') redirect('/');

  const headersList = await headers();
  const pathname = headersList.get('x-pathname') ?? '';

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-60 flex-col border-r border-sidebar-border bg-sidebar px-4 py-6 md:flex">
        <span className="mb-8 text-lg font-semibold text-primary">PlantBridge</span>
        <p className="mb-4 text-xs font-medium uppercase tracking-wide text-muted-foreground">Coach Portal</p>
        <nav className="flex flex-col gap-1 text-sm text-sidebar-foreground">
          {NAV_ITEMS.map(({ href, label, exact }) => {
            const isActive = exact ? pathname === href : pathname.startsWith(href) && href !== '/coach';
            return (
              <a
                key={href}
                href={href}
                className={`rounded-md px-3 py-2 transition-colors hover:bg-sidebar-accent ${
                  isActive ? 'bg-sidebar-accent font-medium text-foreground' : ''
                }`}
              >
                {label}
              </a>
            );
          })}
        </nav>
      </aside>

      {/* Mobile top bar */}
      <div className="flex flex-1 flex-col">
        <div className="flex items-center gap-4 border-b border-border bg-background px-4 py-3 md:hidden">
          <span className="text-sm font-semibold text-primary">PlantBridge Coach</span>
          <nav className="flex gap-3 overflow-x-auto text-sm">
            {NAV_ITEMS.map(({ href, label }) => (
              <a key={href} href={href} className="shrink-0 text-muted-foreground hover:text-foreground">
                {label}
              </a>
            ))}
          </nav>
        </div>
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}
