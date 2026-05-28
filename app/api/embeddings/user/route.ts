import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/server/supabase-server';
import { indexUserPreference } from '@/lib/server/embeddings/index-user';
import { log } from '@/lib/observability/log';

export async function POST(req: NextRequest): Promise<NextResponse> {
  // Called server-side after care plan generation; accepts both cron-secret and user session auth
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.get('authorization');

  let userId: string | null = null;

  if (cronSecret && authHeader === `Bearer ${cronSecret}`) {
    // Cron call: userId supplied in body
    const body = (await req.json()) as { userId?: string };
    userId = body.userId ?? null;
  } else {
    // Authenticated user call
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    userId = user?.id ?? null;
  }

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await indexUserPreference(userId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    log.error('user_indexing_failed', { userId, error: String(err) });
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
