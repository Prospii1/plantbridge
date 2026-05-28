import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/server/supabase-server';
import { createSupabaseAdminClient } from '@/lib/server/supabase-admin';
import { createBooking } from './actions';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default async function BookSessionPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const adminSupabase = createSupabaseAdminClient();

  // Get user's assigned coach
  const { data: assignment } = await adminSupabase
    .from('coach_clients')
    .select('coach_id')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .single();

  if (!assignment) redirect('/');

  const [slotsRes, bookingsRes, authRes] = await Promise.all([
    adminSupabase
      .from('coach_availability')
      .select('id, day_of_week, start_time, end_time')
      .eq('coach_id', assignment.coach_id)
      .order('day_of_week')
      .order('start_time'),
    adminSupabase
      .from('bookings')
      .select('id, scheduled_at, status')
      .eq('user_id', user.id)
      .eq('coach_id', assignment.coach_id)
      .gte('scheduled_at', new Date().toISOString())
      .order('scheduled_at')
      .limit(5),
    adminSupabase.auth.admin.getUserById(assignment.coach_id),
  ]);

  const coachEmail = authRes.data.user?.email ?? 'Your coach';
  const slots = slotsRes.data ?? [];
  const upcoming = bookingsRes.data ?? [];

  return (
    <div className="mx-auto max-w-2xl space-y-8 py-8">
      <h1 className="text-2xl font-semibold text-foreground">Book a Session</h1>
      <p className="text-sm text-muted-foreground">Scheduling with {coachEmail}</p>

      {/* Upcoming bookings */}
      {upcoming.length > 0 && (
        <section className="rounded-lg border border-border bg-card p-5 space-y-3">
          <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">Your Upcoming Sessions</h2>
          <ul className="space-y-2 text-sm">
            {upcoming.map((b) => (
              <li key={b.id} className="flex justify-between text-foreground">
                <span>
                  {new Date(b.scheduled_at).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
                </span>
                <span className="capitalize text-muted-foreground">{b.status}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Book from availability */}
      <section className="rounded-lg border border-border bg-card p-5 space-y-4">
        <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">Available Times</h2>
        {slots.length === 0 ? (
          <p className="text-sm text-muted-foreground">Your coach hasn&apos;t set their availability yet. Check back soon.</p>
        ) : (
          <div className="space-y-4">
            <p className="text-xs text-muted-foreground">
              Select a day and time to request a session. Your coach will confirm.
            </p>
            <form action={createBooking} className="space-y-4">
              <input type="hidden" name="coach_id" value={assignment.coach_id} />
              <input type="hidden" name="duration_minutes" value="30" />

              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Select a time slot</label>
                <select
                  name="scheduled_at"
                  required
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {slots.map((slot) => {
                    // Generate next occurrence of this day of week
                    const now = new Date();
                    const currentDay = now.getDay();
                    const daysUntil = (slot.day_of_week - currentDay + 7) % 7 || 7;
                    const slotDate = new Date(now);
                    slotDate.setDate(now.getDate() + daysUntil);
                    const [hours, minutes] = slot.start_time.split(':').map(Number);
                    slotDate.setHours(hours, minutes, 0, 0);
                    return (
                      <option key={slot.id} value={slotDate.toISOString()}>
                        {DAYS[slot.day_of_week]} {slot.start_time.slice(0, 5)} – {slot.end_time.slice(0, 5)}
                      </option>
                    );
                  })}
                </select>
              </div>

              <button
                type="submit"
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                Request session
              </button>
            </form>
          </div>
        )}
      </section>
    </div>
  );
}
