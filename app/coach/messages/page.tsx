import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/server/supabase-server';
import { createSupabaseAdminClient } from '@/lib/server/supabase-admin';
import { startConversationWithUser } from './actions';

interface PageProps {
  searchParams: Promise<{ start?: string }>;
}

export default async function CoachMessagesPage({ searchParams }: PageProps) {
  const { start } = await searchParams;

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // If ?start=userId, ensure a conversation exists and redirect to it
  if (start) {
    const conversationId = await startConversationWithUser(start);
    if (conversationId) redirect(`/coach/messages/${conversationId}`);
  }

  const adminSupabase = createSupabaseAdminClient();

  const [convsRes, authListRes] = await Promise.all([
    adminSupabase
      .from('conversations')
      .select('id, user_id, last_message_at')
      .eq('coach_id', user.id)
      .order('last_message_at', { ascending: false, nullsFirst: false }),
    adminSupabase.auth.admin.listUsers({ perPage: 1000 }),
  ]);

  const emailMap = new Map(
    (authListRes.data?.users ?? []).map((u) => [u.id, u.email ?? '—']),
  );

  const conversations = (convsRes.data ?? []).map((c) => ({
    ...c,
    email: emailMap.get(c.user_id) ?? '—',
  }));

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-xl font-semibold text-foreground">Messages</h1>

      {conversations.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-8 text-center">
          <p className="text-sm text-muted-foreground">No conversations yet. Go to a client&apos;s profile to start a conversation.</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {conversations.map((c) => (
            <li key={c.id}>
              <Link
                href={`/coach/messages/${c.id}`}
                className="flex items-center justify-between rounded-lg border border-border bg-card p-4 transition-colors hover:bg-secondary"
              >
                <span className="text-sm font-medium text-foreground">{c.email}</span>
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
