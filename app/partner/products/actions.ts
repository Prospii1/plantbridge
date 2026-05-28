'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/server/supabase-server';
import { createSupabaseAdminClient } from '@/lib/server/supabase-admin';
import { log } from '@/lib/observability/log';

async function getPartnerId(userId: string): Promise<string | null> {
  const adminSupabase = createSupabaseAdminClient();
  const { data } = await adminSupabase
    .from('partners')
    .select('id')
    .eq('user_id', userId)
    .single();
  return data?.id ?? null;
}

const ProductSchema = z.object({
  name: z.string().min(1),
  category: z.enum(['flower', 'edible', 'tincture', 'topical', 'concentrate']),
  thc_percentage: z.coerce.number().min(0).max(100).optional(),
  cbd_percentage: z.coerce.number().min(0).max(100).optional(),
  description: z.string().optional(),
  price_cents: z.coerce.number().int().min(0).optional(),
  state: z.string().length(2).optional().or(z.literal('')),
  in_stock: z.coerce.boolean().default(true),
});

export async function addProduct(formData: FormData): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const partnerId = await getPartnerId(user.id);
  if (!partnerId) return;

  const parsed = ProductSchema.safeParse({
    name: formData.get('name'),
    category: formData.get('category'),
    thc_percentage: formData.get('thc_percentage') || undefined,
    cbd_percentage: formData.get('cbd_percentage') || undefined,
    description: formData.get('description') || undefined,
    price_cents: formData.get('price_cents') || undefined,
    state: formData.get('state') || undefined,
    in_stock: formData.get('in_stock') ?? 'true',
  });
  if (!parsed.success) return;

  const adminSupabase = createSupabaseAdminClient();
  const { error } = await adminSupabase.from('dispensary_products').insert({
    partner_id: partnerId,
    ...parsed.data,
  });

  if (error) log.error('add_product_failed', { partnerId, error: error.message });
  revalidatePath('/partner/products');
}

export async function deleteProduct(productId: string): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const adminSupabase = createSupabaseAdminClient();
  const { error } = await adminSupabase
    .from('dispensary_products')
    .update({ in_stock: false })
    .eq('id', productId)
    .eq('partner_id', (await getPartnerId(user.id)) ?? '');

  if (error) log.error('delete_product_failed', { productId, error: error.message });
  revalidatePath('/partner/products');
}
