import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/server/supabase-server';
import Link from 'next/link';

export default async function CarePlanIndexPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: plan } = await supabase
    .from('care_plans')
    .select('id')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (plan) redirect(`/care-plan/${plan.id}`);

  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
      <h1 className="text-2xl font-semibold text-foreground">No care plan yet</h1>
      <p className="text-muted-foreground max-w-sm">
        Complete the wellness intake to generate your personalised educational care plan.
      </p>
      <Link
        href="/onboarding"
        className="rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
      >
        Start intake
      </Link>
    </div>
  );
}
