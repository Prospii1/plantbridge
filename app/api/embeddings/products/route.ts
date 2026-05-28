import { NextRequest, NextResponse } from 'next/server';
import { indexAllProducts } from '@/lib/server/embeddings/index-products';
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
    const indexed = await indexAllProducts();
    return NextResponse.json({ indexed });
  } catch (err) {
    log.error('product_indexing_failed', { error: String(err) });
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
