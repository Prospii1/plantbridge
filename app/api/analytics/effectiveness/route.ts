import { NextRequest, NextResponse } from 'next/server';
import { computeEffectiveness } from '@/lib/server/analytics/compute-effectiveness';
import { log } from '@/lib/observability/log';

export async function POST(req: NextRequest): Promise<NextResponse> {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 });
  }

  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const updated = await computeEffectiveness();
    return NextResponse.json({ updated });
  } catch (err) {
    log.error('effectiveness_route_failed', { error: String(err) });
    return NextResponse.json({ error: 'Computation failed' }, { status: 500 });
  }
}
