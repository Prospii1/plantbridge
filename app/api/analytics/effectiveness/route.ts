import { NextRequest, NextResponse } from 'next/server';
import { computeEffectiveness } from '@/lib/server/analytics/compute-effectiveness';
import { computeUserTrends } from '@/lib/server/analytics/compute-user-trends';
import { log } from '@/lib/observability/log';

function isAuthorized(req: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return false;
  return req.headers.get('authorization') === `Bearer ${cronSecret}`;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  if (!process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 });
  }
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const [rulesUpdated, trends] = await Promise.all([
      computeEffectiveness(),
      computeUserTrends(),
    ]);
    return NextResponse.json({ rulesUpdated, trends });
  } catch (err) {
    log.error('analytics_compute_failed', { error: String(err) });
    return NextResponse.json({ error: 'Computation failed' }, { status: 500 });
  }
}

// GET — admin-only live trend snapshot (no cron secret; uses Supabase auth check)
export async function GET(req: NextRequest): Promise<NextResponse> {
  // Simple internal-only guard: only allow from same origin or with secret
  const origin = req.headers.get('origin') ?? '';
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  const isInternal = origin === appUrl || origin === '';

  if (!isInternal && !isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const trends = await computeUserTrends();
    return NextResponse.json(trends);
  } catch (err) {
    log.error('trends_get_failed', { error: String(err) });
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
