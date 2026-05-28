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
  const { data: profile } = await supabase.from('profiles').select('role').eq('user_id', user.id).single();
  if (profile?.role !== 'admin') redirect('/admin');
}

const UpdateRetailerSchema = z.object({
  dutchie_retailer_id: z.string().optional().or(z.literal('')),
});

export async function updateDutchieRetailerId(partnerId: string, formData: FormData): Promise<void> {
  await assertAdmin();
  const parsed = UpdateRetailerSchema.safeParse({
    dutchie_retailer_id: formData.get('dutchie_retailer_id'),
  });
  if (!parsed.success) return;

  const adminSupabase = createSupabaseAdminClient();
  const { error } = await adminSupabase
    .from('partners')
    .update({ dutchie_retailer_id: parsed.data.dutchie_retailer_id || null })
    .eq('id', partnerId);

  if (error) log.error('update_retailer_id_failed', { partnerId, error: error.message });
  revalidatePath(`/admin/partners/${partnerId}`);
}

export async function triggerDutchieSync(partnerId: string): Promise<void> {
  await assertAdmin();

  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  const cronSecret = process.env.CRON_SECRET;
  if (!appUrl || !cronSecret) {
    log.error('dutchie_manual_sync_missing_config', { partnerId });
    return;
  }

  const res = await fetch(`${appUrl}/api/dutchie/sync`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${cronSecret}` },
  });

  if (!res.ok) {
    log.error('dutchie_manual_sync_failed', { partnerId, status: res.status });
  }

  revalidatePath(`/admin/partners/${partnerId}`);
}
