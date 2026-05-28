import { createSupabaseAdminClient } from '@/lib/server/supabase-admin';
import { embed } from '@/lib/server/embeddings/embed';
import { log } from '@/lib/observability/log';

export async function indexAllProducts(): Promise<number> {
  const supabase = createSupabaseAdminClient();

  const { data: products, error } = await supabase
    .from('dispensary_products')
    .select('id, name, category, terpene_profile, description');

  if (error) {
    log.error('index_products_fetch_failed', { error: error.message });
    throw new Error(error.message);
  }

  let indexed = 0;
  for (const p of products ?? []) {
    const terpenes = p.terpene_profile
      ? Object.keys(p.terpene_profile as Record<string, number>).join(' ')
      : '';
    const text = [p.name, p.category, terpenes, p.description ?? '']
      .filter(Boolean)
      .join(' ')
      .trim();

    const embedding = await embed(text);

    const { error: upsertErr } = await supabase
      .from('product_embeddings')
      .upsert(
        { dispensary_product_id: p.id, embedding, model_id: 'all-MiniLM-L6-v2' },
        { onConflict: 'dispensary_product_id' },
      );

    if (upsertErr) {
      log.error('index_product_upsert_failed', { productId: p.id, error: upsertErr.message });
    } else {
      indexed++;
    }
  }

  log.info('products_indexed', { indexed });
  return indexed;
}
