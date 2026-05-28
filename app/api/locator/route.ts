import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/server/supabase-admin';
import { FEATURE_FLAGS } from '@/lib/shared/config/feature-flags';

export async function GET(req: NextRequest): Promise<NextResponse> {
  if (!FEATURE_FLAGS.DISPENSARY_LOCATOR) {
    return NextResponse.json({ error: 'Feature not enabled' }, { status: 404 });
  }

  const { searchParams } = req.nextUrl;
  const state = searchParams.get('state') ?? '';
  const category = searchParams.get('category') ?? '';

  const supabase = createSupabaseAdminClient();

  const { data: enabledPartners } = await supabase
    .from('partners')
    .select('id')
    .eq('feature_flag_enabled', true);

  const enabledIds = (enabledPartners ?? []).map((p) => p.id);
  if (enabledIds.length === 0) {
    return NextResponse.json([]);
  }

  let query = supabase
    .from('dispensary_products')
    .select('id, name, category, thc_percentage, cbd_percentage, terpene_profile, description, price_cents, in_stock, state')
    .in('partner_id', enabledIds)
    .eq('in_stock', true);

  if (state) query = query.eq('state', state.toUpperCase());
  if (category) query = query.eq('category', category);

  const { data, error } = await query.order('name').limit(50);

  if (error) {
    return NextResponse.json({ error: 'Query failed' }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
}
