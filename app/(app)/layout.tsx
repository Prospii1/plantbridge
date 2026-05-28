import { createSupabaseServerClient } from '@/lib/server/supabase-server';
import { createSupabaseAdminClient } from '@/lib/server/supabase-admin';
import { redirect } from 'next/navigation';
import { FEATURE_FLAGS } from '@/lib/shared/config/feature-flags';

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

  // Check if user has an active coach assignment (for Messages + Book links)
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
    <div className="flex min-h-screen">
      <aside className="hidden w-60 flex-col border-r border-sidebar-border bg-sidebar px-4 py-6 md:flex">
        <span className="mb-8 text-lg font-semibold text-primary">PlantBridge</span>
        <nav className="flex flex-col gap-1 text-sm text-sidebar-foreground">
          <a href="/onboarding" className="rounded-md px-3 py-2 hover:bg-sidebar-accent">
            Intake
          </a>
          <a href="/care-plan" className="rounded-md px-3 py-2 hover:bg-sidebar-accent">
            Care Plan
          </a>
          <a href="/education" className="rounded-md px-3 py-2 hover:bg-sidebar-accent">
            Education
          </a>
          <a href="/tracking" className="rounded-md px-3 py-2 hover:bg-sidebar-accent">
            Tracking
          </a>
          {hasCoach && (
            <a href="/messages" className="rounded-md px-3 py-2 hover:bg-sidebar-accent">
              Messages
            </a>
          )}
          {hasCoach && (
            <a href="/book" className="rounded-md px-3 py-2 hover:bg-sidebar-accent">
              Book session
            </a>
          )}
          {FEATURE_FLAGS.DISPENSARY_LOCATOR && (
            <a href="/locator" className="rounded-md px-3 py-2 hover:bg-sidebar-accent">
              Locator
            </a>
          )}
          <a href="/account" className="rounded-md px-3 py-2 hover:bg-sidebar-accent">
            Account
          </a>
        </nav>
        <form method="POST" action="/logout" className="mt-auto">
          <button
            type="submit"
            className="w-full rounded-md px-3 py-2 text-left text-sm text-sidebar-foreground hover:bg-sidebar-accent"
          >
            Sign out
          </button>
        </form>
      </aside>
      <main className="flex-1 overflow-auto p-6">{children}</main>
    </div>
  );
}
