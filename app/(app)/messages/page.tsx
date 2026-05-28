import Link from 'next/link';
import { createSupabaseServerClient } from '@/lib/server/supabase-server';
import { createSupabaseAdminClient } from '@/lib/server/supabase-admin';

export default async function UserMessagesPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const adminSupabase = createSupabaseAdminClient();

  const [convsRes, authListRes] = await Promise.all([
    adminSupabase
      .from('conversations')
      .select('id, coach_id, last_message_at')
      .eq('user_id', user.id)
      .order('last_message_at', { ascending: false, nullsFirst: false }),
    adminSupabase.auth.admin.listUsers({ perPage: 1000 }),
  ]);

  const emailMap = new Map(
    (authListRes.data?.users ?? []).map((u) => [u.id, u.email ?? '—']),
  );

  const conversations = (convsRes.data ?? []).map((c) => ({
    ...c,
    coachEmail: emailMap.get(c.coach_id) ?? '—',
  }));

  return (
    <div className="mx-auto max-w-2xl space-y-6 py-8">
      <h1 className="text-2xl font-semibold text-foreground">Messages</h1>

      {conversations.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-8 text-center">
          <p className="text-sm text-muted-foreground">No messages yet. Your coach will reach out once you&apos;re assigned.</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {conversations.map((c) => (
            <li key={c.id}>
              <Link
                href={`/messages/${c.id}`}
                className="flex items-center justify-between rounded-lg border border-border bg-card p-4 transition-colors hover:bg-secondary"
              >
                <div>
                  <p className="text-sm font-medium text-foreground">Coach: {c.coachEmail}</p>
                </div>
                <span className="text-xs text-muted-foreground">
                  {c.last_message_at
                    ? new Date(c.last_message_at).toLocaleDateString('en-US', { dateStyle: 'medium' })
                    : 'No messages'}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
