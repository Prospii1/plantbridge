'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createSupabaseAdminClient } from '@/lib/server/supabase-admin';
import { log } from '@/lib/observability/log';

const ProductSchema = z.object({
  partner_id:     z.string().uuid(),
  name:           z.string().min(1).max(200),
  category:       z.enum(['flower', 'edible', 'tincture', 'topical', 'concentrate']),
  thc_percentage: z.coerce.number().min(0).max(100).optional(),
  cbd_percentage: z.coerce.number().min(0).max(100).optional(),
  description:    z.string().max(1000).optional(),
  price_cents:    z.coerce.number().int().min(0).optional(),
  state:          z.string().length(2).optional().or(z.literal('')),
  coa_url:        z.string().url().optional().or(z.literal('')),
  in_stock:       z.coerce.boolean().default(true),
});

export async function adminAddProduct(_prev: { error?: string }, formData: FormData): Promise<{ error?: string }> {
  const parsed = ProductSchema.safeParse({
    partner_id:     formData.get('partner_id'),
    name:           formData.get('name'),
    category:       formData.get('category'),
    thc_percentage: formData.get('thc_percentage') || undefined,
    cbd_percentage: formData.get('cbd_percentage') || undefined,
    description:    formData.get('description') || undefined,
    price_cents:    formData.get('price_cents') || undefined,
    state:          formData.get('state') || undefined,
    coa_url:        formData.get('coa_url') || undefined,
    in_stock:       'true',
  });

  if (!parsed.success) {
    return { error: 'Invalid product data. Check all required fields.' };
  }

  const supabase = createSupabaseAdminClient();
  const { state, coa_url, ...rest } = parsed.data;
  const { error } = await supabase.from('dispensary_products').insert({
    ...rest,
    state:   state || null,
    coa_url: coa_url || null,
  });

  if (error) {
    log.error('admin_add_product_failed', { error: error.message });
    return { error: 'Failed to add product. Please try again.' };
  }

  revalidatePath('/admin/products');
  return {};
}

export async function adminToggleProductStock(productId: string, currentlyInStock: boolean): Promise<void> {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from('dispensary_products')
    .update({ in_stock: !currentlyInStock })
    .eq('id', productId);

  if (error) log.error('admin_toggle_stock_failed', { productId, error: error.message });
  revalidatePath('/admin/products');
}

export async function adminDeleteProduct(productId: string): Promise<void> {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from('dispensary_products')
    .delete()
    .eq('id', productId);

  if (error) log.error('admin_delete_product_failed', { productId, error: error.message });
  revalidatePath('/admin/products');
}
