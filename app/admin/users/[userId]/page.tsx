import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createSupabaseAdminClient } from '@/lib/server/supabase-admin';
import { changeUserRole } from '../actions';

interface Props {
  params: Promise<{ userId: string }>;
}

export default async function AdminUserDetailPage({ params }: Props) {
  const { userId } = await params;
  const supabase = createSupabaseAdminClient();

  const [profileRes, authUserRes, subRes, intakesRes, outcomesRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('user_id', userId).single(),
    supabase.auth.admin.getUserById(userId),
    supabase.from('subscriptions').select('*').eq('user_id', userId).single(),
    supabase.from('intake_sessions').select('id, completed_at, questions_version').eq('user_id', userId).order('created_at', { ascending: false }).limit(3),
    supabase.from('outcome_logs').select('id, logged_at, rating, care_plan_item_id').eq('user_id', userId).order('logged_at', { ascending: false }).limit(5),
  ]);

  if (!profileRes.data) notFound();

  const profile = profileRes.data;
  const authUser = authUserRes.data.user;
  const subscription = subRes.data;

  const changeRoleWithId = changeUserRole.bind(null, userId);

  return (
    <div className="max-w-2xl space-y-8">
      <div className="flex items-center gap-3">
        <Link href="/admin/users" className="text-sm text-muted-foreground hover:text-foreground">
          ← Users
        </Link>
        <h1 className="text-xl font-semibold text-foreground">{authUser?.email ?? userId}</h1>
      </div>

      {/* Profile */}
      <section className="rounded-lg border border-border bg-card p-5 space-y-4">
        <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">Profile</h2>
        <dl className="grid grid-cols-2 gap-3 text-sm">
          {[
            ['User ID', profile.user_id],
            ['Role', profile.role],
            ['State', profile.state ?? '—'],
            ['Tier', profile.subscription_tier],
            ['Age verified', profile.age_verified_at ? new Date(profile.age_verified_at).toLocaleDateString('en-US', { dateStyle: 'medium' }) : '—'],
            ['Joined', new Date(profile.created_at).toLocaleDateString('en-US', { dateStyle: 'medium' })],
          ].map(([label, val]) => (
            <div key={label as string}>
              <dt className="text-xs text-muted-foreground">{label}</dt>
              <dd className="text-foreground capitalize">{val as string}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* Role change */}
      <section className="rounded-lg border border-border bg-card p-5 space-y-3">
        <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">Change Role</h2>
        <form action={changeRoleWithId} className="flex items-center gap-3">
          <select
            name="role"
            defaultValue={profile.role}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {['user', 'coach', 'partner', 'admin'].map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
          <button
            type="submit"
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Save role
          </button>
        </form>
      </section>

      {/* Subscription */}
      <section className="rounded-lg border border-border bg-card p-5 space-y-3">
        <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">Subscription</h2>
        {subscription ? (
          <dl className="grid grid-cols-2 gap-3 text-sm">
            {[
              ['Tier', subscription.tier],
              ['Status', subscription.status],
              ['Stripe customer', subscription.stripe_customer_id ? `${subscription.stripe_customer_id.slice(0, 14)}…` : '—'],
              ['Period end', subscription.current_period_end ? new Date(subscription.current_period_end).toLocaleDateString('en-US', { dateStyle: 'medium' }) : '—'],
            ].map(([label, val]) => (
              <div key={label as string}>
                <dt className="text-xs text-muted-foreground">{label}</dt>
                <dd className="text-foreground capitalize">{val as string}</dd>
              </div>
            ))}
          </dl>
        ) : (
          <p className="text-sm text-muted-foreground">No subscription record.</p>
        )}
      </section>

      {/* Recent intakes */}
      <section className="rounded-lg border border-border bg-card p-5 space-y-3">
        <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">Recent Intakes</h2>
        {intakesRes.data && intakesRes.data.length > 0 ? (
          <ul className="space-y-2 text-sm">
            {intakesRes.data.map((s) => (
              <li key={s.id} className="flex justify-between text-foreground">
                <span>v{s.questions_version}</span>
                <span className="text-muted-foreground">
                  {s.completed_at ? new Date(s.completed_at).toLocaleDateString('en-US', { dateStyle: 'medium' }) : 'Incomplete'}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">No intake sessions.</p>
        )}
      </section>

      {/* Recent outcomes */}
      <section className="rounded-lg border border-border bg-card p-5 space-y-3">
        <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">Recent Outcome Logs</h2>
        {outcomesRes.data && outcomesRes.data.length > 0 ? (
          <ul className="space-y-2 text-sm">
            {outcomesRes.data.map((o) => (
              <li key={o.id} className="flex justify-between text-foreground">
                <span>Rating: {o.rating}/5</span>
                <span className="text-muted-foreground">
                  {new Date(o.logged_at).toLocaleDateString('en-US', { dateStyle: 'medium' })}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">No outcome logs.</p>
        )}
      </section>
    </div>
  );
}
