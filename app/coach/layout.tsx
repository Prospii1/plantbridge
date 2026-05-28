import { createSupabaseServerClient } from '@/lib/server/supabase-server';
import { redirect } from 'next/navigation';

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

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-60 flex-col border-r border-sidebar-border bg-sidebar px-4 py-6 md:flex">
        <span className="mb-8 text-lg font-semibold text-primary">PlantBridge</span>
        <p className="mb-4 text-xs font-medium uppercase tracking-wide text-muted-foreground">Coach Portal</p>
        <nav className="flex flex-col gap-1 text-sm text-sidebar-foreground">
          <a href="/coach/clients" className="rounded-md px-3 py-2 hover:bg-sidebar-accent">
            Clients
          </a>
          <a href="/coach/messages" className="rounded-md px-3 py-2 hover:bg-sidebar-accent">
            Messages
          </a>
          <a href="/coach/schedule" className="rounded-md px-3 py-2 hover:bg-sidebar-accent">
            Schedule
          </a>
          <a href="/account" className="rounded-md px-3 py-2 hover:bg-sidebar-accent">
            Account
          </a>
        </nav>
      </aside>
      <main className="flex-1 overflow-auto p-6">{children}</main>
    </div>
  );
}
