'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/server/supabase-server';
import { createSupabaseAdminClient } from '@/lib/server/supabase-admin';
import { log } from '@/lib/observability/log';

const SlotSchema = z.object({
  day_of_week: z.coerce.number().int().min(0).max(6),
  start_time: z.string().regex(/^\d{2}:\d{2}$/),
  end_time: z.string().regex(/^\d{2}:\d{2}$/),
});

export async function addAvailabilitySlot(formData: FormData): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const parsed = SlotSchema.safeParse({
    day_of_week: formData.get('day_of_week'),
    start_time: formData.get('start_time'),
    end_time: formData.get('end_time'),
  });
  if (!parsed.success) return;

  const adminSupabase = createSupabaseAdminClient();
  const { error } = await adminSupabase.from('coach_availability').insert({
    coach_id: user.id,
    ...parsed.data,
  });

  if (error) log.error('add_availability_slot_failed', { coachId: user.id, error: error.message });
  revalidatePath('/coach/schedule');
}

export async function removeAvailabilitySlot(slotId: string): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const adminSupabase = createSupabaseAdminClient();
  const { error } = await adminSupabase
    .from('coach_availability')
    .delete()
    .eq('id', slotId)
    .eq('coach_id', user.id);

  if (error) log.error('remove_availability_slot_failed', { slotId, error: error.message });
  revalidatePath('/coach/schedule');
}

export async function updateBookingStatus(bookingId: string, formData: FormData): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const status = z
    .enum(['confirmed', 'completed', 'cancelled'])
    .safeParse(formData.get('status'));
  if (!status.success) return;

  const adminSupabase = createSupabaseAdminClient();
  const { error } = await adminSupabase
    .from('bookings')
    .update({ status: status.data })
    .eq('id', bookingId)
    .eq('coach_id', user.id);

  if (error) log.error('update_booking_status_failed', { bookingId, error: error.message });
  revalidatePath('/coach/schedule');
}
