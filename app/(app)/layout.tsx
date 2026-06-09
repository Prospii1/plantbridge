import { createSupabaseServerClient } from '@/lib/server/supabase-server';
import { createSupabaseAdminClient } from '@/lib/server/supabase-admin';
import { redirect } from 'next/navigation';
import { SidebarNav } from '@/components/shared/sidebar-nav';
import { MobileNav } from '@/components/shared/mobile-nav';

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const adminSupabase = createSupabaseAdminClient();
  const { data: assignment } = await adminSupabase
    .from('coach_clients')
    .select('id')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .limit(1)
    .single();

  const hasCoach = !!assignment;

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      {/* Desktop sidebar */}
      <aside className="hidden w-60 flex-col border-r border-sidebar-border bg-sidebar px-4 py-6 md:flex">
        <span className="mb-8 text-lg font-semibold text-primary">PlantBridge</span>
        <SidebarNav hasCoach={hasCoach} />
        <form method="POST" action="/logout" className="mt-auto">
          <button
            type="submit"
            className="w-full rounded-md px-3 py-2 text-left text-sm text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
          >
            Sign out
          </button>
        </form>
      </aside>

      {/* Mobile header */}
      <MobileNav hasCoach={hasCoach} />

      {/* pb-24 on mobile leaves room for the fixed bottom tab bar */}
      <main className="flex-1 overflow-auto p-6 pb-24 md:pb-6">{children}</main>
    </div>
  );
}
