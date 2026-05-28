import { createSupabaseAdminClient } from '@/lib/server/supabase-admin';
import { fetchDutchieProducts } from '@/lib/server/dutchie/client';
import { log } from '@/lib/observability/log';

export async function syncPartnerProducts(
  partnerId: string,
  retailerId: string,
): Promise<void> {
  const supabase = createSupabaseAdminClient();
  let productCount = 0;
  let syncError: string | null = null;

  try {
    const products = await fetchDutchieProducts(retailerId);
    productCount = products.length;

    if (products.length > 0) {
      const rows = products.map((p) => ({
        partner_id: partnerId,
        external_id: p.externalId,
        name: p.name,
        category: p.category,
        thc_percentage: p.thcPercentage,
        cbd_percentage: p.cbdPercentage,
        terpene_profile: p.terpeneProfile,
        description: p.description,
        price_cents: p.priceCents,
        in_stock: p.inStock,
        state: p.state,
      }));

      const { error } = await supabase
        .from('dispensary_products')
        .upsert(rows, { onConflict: 'partner_id,external_id' });

      if (error) throw new Error(error.message);
    }

    log.info('dutchie_sync_complete', { partnerId, productCount });
  } catch (err) {
    syncError = String(err);
    log.error('dutchie_sync_failed', { partnerId, error: syncError });
    throw err;
  } finally {
    await supabase.from('dutchie_sync_log').insert({
      partner_id: partnerId,
      product_count: productCount,
      error: syncError,
    });
  }
}
