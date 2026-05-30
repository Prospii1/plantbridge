import Link from 'next/link';
import { createSupabaseServerClient } from '@/lib/server/supabase-server';
import { OutcomeLogForm } from '@/components/tracking/outcome-log-form';
import { DISCLAIMERS } from '@/lib/shared/copy/disclaimers';

export default async function TrackingPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // Latest active care plan items for this user
  const { data: items } = await supabase
    .from('care_plan_items')
    .select(`
      id,
      subject,
      category,
      confidence,
      care_plans!inner(status)
    `)
    .eq('user_id', user.id)
    .eq('care_plans.status', 'active')
    .order('display_order');

  // Recent outcome logs
  const { data: recentLogs } = await supabase
    .from('outcome_logs')
    .select('id, care_plan_item_id, rating, notes, logged_at')
    .eq('user_id', user.id)
    .order('logged_at', { ascending: false })
    .limit(10);

  return (
    <div className="mx-auto max-w-2xl space-y-8 py-8">
      <h1 className="text-2xl font-semibold text-foreground">Track Your Outcomes</h1>

      {!items || items.length === 0 ? (
        <div className="rounded-lg border border-border bg-muted/30 p-8 text-center space-y-4">
          <p className="text-muted-foreground">No care plan items yet. Complete your intake to get personalized items to track.</p>
          <Link
            href="/onboarding"
            className="inline-flex rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
          >
            Start intake →
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {items.map((item) => (
            <div key={item.id} className="rounded-lg border border-border bg-card p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {item.category}
                  </span>
                  <h2 className="font-medium capitalize text-foreground">{item.subject}</h2>
                </div>
                <span className="text-xs text-muted-foreground">
                  {Math.round(item.confidence * 100)}% match
                </span>
              </div>
              <OutcomeLogForm carePlanItemId={item.id} subject={item.subject} />
            </div>
          ))}
        </div>
      )}

      {recentLogs && recentLogs.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-medium text-foreground">Recent Logs</h2>
          <div className="space-y-2">
            {recentLogs.map((log) => (
              <div
                key={log.id}
                className="flex items-start justify-between rounded-lg border border-border/50 bg-muted/20 px-4 py-3 text-sm"
              >
                <div className="space-y-0.5">
                  <p className="text-muted-foreground text-xs">
                    {new Date(log.logged_at).toLocaleDateString('en-US', { dateStyle: 'medium' })}
                  </p>
                  {log.notes && <p className="text-foreground">{log.notes}</p>}
                </div>
                <span className="shrink-0 ml-4 rounded-full bg-secondary px-2 py-0.5 text-xs font-medium">
                  {log.rating}/5
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="text-xs text-muted-foreground">{DISCLAIMERS.outcomeLog}</p>
    </div>
  );
}
