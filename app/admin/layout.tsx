import { createSupabaseServerClient } from '@/lib/server/supabase-server';
import { redirect } from 'next/navigation';

export default async function AdminLayout({
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

  if (profile?.role !== 'admin') redirect('/');

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-border bg-background px-6 py-3">
        <span className="text-sm font-semibold text-primary">
          PlantBridge — Admin
        </span>
      </header>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
