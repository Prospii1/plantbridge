import { createSupabaseServerClient } from '@/lib/server/supabase-server';
import { createSupabaseAdminClient } from '@/lib/server/supabase-admin';
import { addAvailabilitySlot, removeAvailabilitySlot, updateBookingStatus } from './actions';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default async function CoachSchedulePage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const adminSupabase = createSupabaseAdminClient();

  const upcoming = new Date();
  const [slotsRes, bookingsRes, authListRes] = await Promise.all([
    adminSupabase
      .from('coach_availability')
      .select('id, day_of_week, start_time, end_time')
      .eq('coach_id', user.id)
      .order('day_of_week')
      .order('start_time'),
    adminSupabase
      .from('bookings')
      .select('id, user_id, scheduled_at, duration_minutes, status, notes')
      .eq('coach_id', user.id)
      .gte('scheduled_at', upcoming.toISOString())
      .order('scheduled_at')
      .limit(20),
    adminSupabase.auth.admin.listUsers({ perPage: 1000 }),
  ]);

  const emailMap = new Map(
    (authListRes.data?.users ?? []).map((u) => [u.id, u.email ?? '—']),
  );

  const slots = slotsRes.data ?? [];
  const bookings = (bookingsRes.data ?? []).map((b) => ({
    ...b,
    email: emailMap.get(b.user_id) ?? '—',
  }));

  return (
    <div className="max-w-2xl space-y-8">
      <h1 className="text-xl font-semibold text-foreground">Schedule</h1>

      {/* Add availability slot */}
      <section className="rounded-lg border border-border bg-card p-5 space-y-4">
        <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">Add Availability</h2>
        <form action={addAvailabilitySlot} className="grid grid-cols-3 gap-3 items-end">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Day</label>
            <select
              name="day_of_week"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {DAYS.map((day, i) => (
                <option key={day} value={i}>{day}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Start</label>
            <input
              type="time"
              name="start_time"
              required
              defaultValue="09:00"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">End</label>
            <input
              type="time"
              name="end_time"
              required
              defaultValue="10:00"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div className="col-span-3">
            <button
              type="submit"
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Add slot
            </button>
          </div>
        </form>
      </section>

      {/* Weekly availability */}
      <section className="rounded-lg border border-border bg-card p-5 space-y-4">
        <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">Weekly Availability</h2>
        {slots.length === 0 ? (
          <p className="text-sm text-muted-foreground">No availability slots set.</p>
        ) : (
          <ul className="space-y-2">
            {slots.map((slot) => {
              const removeWithId = removeAvailabilitySlot.bind(null, slot.id);
              return (
                <li key={slot.id} className="flex items-center justify-between text-sm">
                  <span className="text-foreground">
                    {DAYS[slot.day_of_week]} · {slot.start_time.slice(0, 5)} – {slot.end_time.slice(0, 5)}
                  </span>
                  <form action={removeWithId}>
                    <button type="submit" className="text-xs text-muted-foreground hover:text-destructive">
                      Remove
                    </button>
                  </form>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Upcoming bookings */}
      <section className="rounded-lg border border-border bg-card p-5 space-y-4">
        <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">Upcoming Bookings</h2>
        {bookings.length === 0 ? (
          <p className="text-sm text-muted-foreground">No upcoming bookings.</p>
        ) : (
          <ul className="space-y-4">
            {bookings.map((b) => {
              const updateWithId = updateBookingStatus.bind(null, b.id);
              return (
                <li key={b.id} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div>
                      <p className="font-medium text-foreground">{b.email}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(b.scheduled_at).toLocaleString('en-US', {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })} · {b.duration_minutes} min
                      </p>
                    </div>
                    <span
                      className={`capitalize text-xs font-medium px-2 py-0.5 rounded-full ${
                        b.status === 'confirmed' ? 'bg-primary/10 text-primary'
                        : b.status === 'pending' ? 'bg-muted text-muted-foreground'
                        : b.status === 'completed' ? 'bg-secondary text-secondary-foreground'
                        : 'text-destructive'
                      }`}
                    >
                      {b.status}
                    </span>
                  </div>
                  {(b.status === 'pending' || b.status === 'confirmed') && (
                    <form action={updateWithId} className="flex gap-2">
                      {b.status === 'pending' && (
                        <button name="status" value="confirmed" type="submit"
                          className="rounded border border-border px-3 py-1 text-xs hover:bg-secondary">
                          Confirm
                        </button>
                      )}
                      {b.status === 'confirmed' && (
                        <button name="status" value="completed" type="submit"
                          className="rounded border border-border px-3 py-1 text-xs hover:bg-secondary">
                          Mark complete
                        </button>
                      )}
                      <button name="status" value="cancelled" type="submit"
                        className="rounded border border-border px-3 py-1 text-xs text-muted-foreground hover:text-destructive">
                        Cancel
                      </button>
                    </form>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
