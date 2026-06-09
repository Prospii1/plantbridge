'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/server/supabase-server';
import { createSupabaseAdminClient } from '@/lib/server/supabase-admin';
import { log } from '@/lib/observability/log';

async function assertAdmin(): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('user_id', user.id)
    .single();

  if (profile?.role !== 'admin') redirect('/admin');
}

const CreatePartnerSchema = z.object({
  email: z.string().email(),
  company_name: z.string().min(1),
  type: z.enum(['dispensary', 'delivery', 'wholesaler', 'brand', 'cbd_vendor']),
  contact_email: z.string().email().optional().or(z.literal('')),
  region_states: z.string(),
  website_url: z.string().url().optional().or(z.literal('')),
  notes: z.string().max(1000).optional(),
});

export async function createPartner(formData: FormData): Promise<void> {
  await assertAdmin();
  const adminSupabase = createSupabaseAdminClient();

  const parsed = CreatePartnerSchema.safeParse({
    email: formData.get('email'),
    company_name: formData.get('company_name'),
    type: formData.get('type'),
    contact_email: formData.get('contact_email'),
    region_states: formData.get('region_states') ?? '',
    website_url: formData.get('website_url'),
    notes: formData.get('notes'),
  });
  if (!parsed.success) return;

  // Find user by email
  const { data: authList } = await adminSupabase.auth.admin.listUsers({ perPage: 1000 });
  const targetUser = authList?.users.find((u) => u.email === parsed.data.email);
  if (!targetUser) return;

  const regionStates = parsed.data.region_states
    .split(',')
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean);

  const { error: partnerErr } = await adminSupabase.from('partners').upsert(
    {
      user_id: targetUser.id,
      company_name: parsed.data.company_name,
      type: parsed.data.type,
      contact_email: parsed.data.contact_email || null,
      region_states: regionStates,
      website_url: parsed.data.website_url || null,
      notes: parsed.data.notes || null,
    },
    { onConflict: 'user_id' },
  );

  if (partnerErr) {
    log.error('create_partner_failed', { error: partnerErr.message });
    return;
  }

  await adminSupabase
    .from('profiles')
    .update({ role: 'partner' })
    .eq('user_id', targetUser.id);

  revalidatePath('/admin/partners');
}

export async function togglePartnerFeatureFlag(partnerId: string, currentValue: boolean): Promise<void> {
  await assertAdmin();
  const adminSupabase = createSupabaseAdminClient();

  const { error } = await adminSupabase
    .from('partners')
    .update({ feature_flag_enabled: !currentValue })
    .eq('id', partnerId);

  if (error) log.error('toggle_partner_flag_failed', { partnerId, error: error.message });
  revalidatePath('/admin/partners');
}
