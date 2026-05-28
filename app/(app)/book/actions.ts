'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/server/supabase-server';
import { createSupabaseAdminClient } from '@/lib/server/supabase-admin';
import { log } from '@/lib/observability/log';

export async function createBooking(formData: FormData): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const parsed = z.object({
    coach_id: z.string().uuid(),
    scheduled_at: z.string().datetime(),
    duration_minutes: z.coerce.number().int().min(15).max(120).default(30),
  }).safeParse({
    coach_id: formData.get('coach_id'),
    scheduled_at: formData.get('scheduled_at'),
    duration_minutes: formData.get('duration_minutes') ?? 30,
  });

  if (!parsed.success) return;

  const adminSupabase = createSupabaseAdminClient();

  // Verify the user has an active assignment with this coach
  const { data: assignment } = await adminSupabase
    .from('coach_clients')
    .select('id')
    .eq('coach_id', parsed.data.coach_id)
    .eq('user_id', user.id)
    .eq('status', 'active')
    .single();

  if (!assignment) {
    log.warn('booking_unauthorized', { userId: user.id, coachId: parsed.data.coach_id });
    return;
  }

  const { error } = await adminSupabase.from('bookings').insert({
    coach_id: parsed.data.coach_id,
    user_id: user.id,
    scheduled_at: parsed.data.scheduled_at,
    duration_minutes: parsed.data.duration_minutes,
    status: 'pending',
  });

  if (error) log.error('create_booking_failed', { userId: user.id, error: error.message });

  revalidatePath('/book');
}
