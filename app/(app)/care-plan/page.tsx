import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createSupabaseServerClient } from '@/lib/server/supabase-server';
import { getUserTier } from '@/lib/server/subscriptions';
import { hasAccess } from '@/lib/shared/utils/tier';
import { UpgradeGate } from '@/components/shared/upgrade-gate';

export default async function CarePlanIndexPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const tier = await getUserTier(user.id);

  if (!hasAccess(tier, 'self_guided')) {
    return (
      <UpgradeGate
        feature="Your personalized care plan"
        description="Complete your intake and get a full educational care plan built around your specific conditions, experience, and preferences."
        bullets={[
          'Personalized cannabinoid & terpene recommendations',
          'Starting dose guidance tuned to your experience level',
          'Titration path (Stage 1 → 2 → 3)',
          'Outcome tracking to see what actually works',
        ]}
      />
    );
  }

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
      <h1 className="font-display text-2xl font-medium text-foreground">No care plan yet</h1>
      <p className="text-muted-foreground max-w-sm text-sm">
        Complete the wellness intake to generate your personalised educational care plan.
      </p>
      <Link
        href="/onboarding"
        className="rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
      >
        Start intake →
      </Link>
    </div>
  );
}
