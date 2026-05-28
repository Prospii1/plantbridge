import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/server/supabase-admin';
import { syncPartnerProducts } from '@/lib/server/dutchie/sync';
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

  if (process.env.DUTCHIE_SYNC_ENABLED !== 'true') {
    return NextResponse.json({ error: 'Dutchie sync not enabled' }, { status: 404 });
  }

  const supabase = createSupabaseAdminClient();
  const { data: partners, error } = await supabase
    .from('partners')
    .select('id, dutchie_retailer_id')
    .eq('feature_flag_enabled', true)
    .not('dutchie_retailer_id', 'is', null);

  if (error) {
    log.error('dutchie_sync_fetch_partners_failed', { error: error.message });
    return NextResponse.json({ error: 'Failed to fetch partners' }, { status: 500 });
  }

  let synced = 0;
  const errors: string[] = [];

  for (const partner of partners ?? []) {
    try {
      await syncPartnerProducts(partner.id, partner.dutchie_retailer_id as string);
      synced++;
    } catch (err) {
      errors.push(`${partner.id}: ${String(err)}`);
    }
  }

  return NextResponse.json({ synced, errors });
}
