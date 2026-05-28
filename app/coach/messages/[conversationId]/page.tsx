import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createSupabaseServerClient } from '@/lib/server/supabase-server';
import { createSupabaseAdminClient } from '@/lib/server/supabase-admin';
import { MessageThread, type Message } from '@/components/shared/message-thread';
import { sendMessage } from '../actions';

interface Props {
  params: Promise<{ conversationId: string }>;
}

export default async function CoachConversationPage({ params }: Props) {
  const { conversationId } = await params;

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const adminSupabase = createSupabaseAdminClient();

  const [convRes, messagesRes, authListRes] = await Promise.all([
    adminSupabase
      .from('conversations')
      .select('id, user_id, coach_id')
      .eq('id', conversationId)
      .eq('coach_id', user.id)
      .single(),
    adminSupabase
      .from('messages')
      .select('id, sender_id, body, created_at')
      .eq('conversation_id', conversationId)
      .order('created_at'),
    adminSupabase.auth.admin.listUsers({ perPage: 1000 }),
  ]);

  if (!convRes.data) notFound();

  const emailMap = new Map(
    (authListRes.data?.users ?? []).map((u) => [u.id, u.email ?? '—']),
  );

  const clientEmail = emailMap.get(convRes.data.user_id) ?? convRes.data.user_id;
  const initialMessages = (messagesRes.data ?? []) as Message[];

  return (
    <div className="flex flex-col h-[calc(100vh-theme(spacing.24))] max-w-2xl">
      <div className="flex items-center gap-3 pb-4 border-b border-border">
        <Link href="/coach/messages" className="text-sm text-muted-foreground hover:text-foreground">
          ← Messages
        </Link>
        <h1 className="text-base font-semibold text-foreground">{clientEmail}</h1>
      </div>

      <div className="flex-1 min-h-0">
        <MessageThread
          conversationId={conversationId}
          currentUserId={user.id}
          initialMessages={initialMessages}
          sendAction={sendMessage}
        />
      </div>
    </div>
  );
}
