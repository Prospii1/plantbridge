import Link from 'next/link';
import { createSupabaseServerClient } from '@/lib/server/supabase-server';
import { createSupabaseAdminClient } from '@/lib/server/supabase-admin';
import { getUserTier } from '@/lib/server/subscriptions';
import { hasAccess } from '@/lib/shared/utils/tier';

function greeting() {
  const h = new Date().getUTCHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function TrendChart({ ratings }: { ratings: number[] }) {
  if (ratings.length < 2) return null;
  const W = 300, H = 88, PAD = 10;
  const iw = W - PAD * 2, ih = H - PAD * 2;
  const max = 5, min = 1;
  const pts: [number, number][] = ratings.map((v, i) => [
    PAD + (i / (ratings.length - 1)) * iw,
    PAD + (1 - (v - min) / (max - min)) * ih,
  ]);
  const line = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ');
  const area = `${line} L${PAD + iw} ${PAD + ih} L${PAD} ${PAD + ih} Z`;
  const first = ratings[0] ?? 1;
  const last = ratings[ratings.length - 1] ?? 1;
  const improving = last > first;

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-semibold text-foreground">Outcome trend</span>
        {improving
          ? <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-0.5 text-xs font-semibold text-secondary-foreground">↑ Improving</span>
          : <span className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-0.5 text-xs font-medium text-muted-foreground">Keep tracking</span>
        }
      </div>
      <p className="text-xs text-muted-foreground mb-2">Higher rating = better outcomes</p>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} style={{ display: 'block' }}>
        <defs>
          <linearGradient id="tg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.20" />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area} fill="url(#tg)" />
        <path d={line} fill="none" stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {pts.map((p, i) => (
          <circle key={i} cx={p[0].toFixed(1)} cy={p[1].toFixed(1)} r={i === pts.length - 1 ? 5 : 3}
            fill={i === pts.length - 1 ? 'var(--primary)' : 'var(--card)'}
            stroke="var(--primary)" strokeWidth="2.5" />
        ))}
      </svg>
      <div className="flex justify-between mt-1">
        <span className="text-xs text-muted-foreground">Start: {first}/5</span>
        <span className="text-xs font-semibold text-primary">Now: {last}/5</span>
      </div>
    </div>
  );
}

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const emailLocal = user.email?.split('@')[0] ?? 'there';
  const firstName = emailLocal
    .replace(/[._-]/g, ' ')
    .split(' ')[0]
    ?.replace(/^\w/, (c) => c.toUpperCase()) ?? 'there';

  const adminSupabase = createSupabaseAdminClient();

  const [planRes, logsRes, coachRes, severityRes] = await Promise.all([
    adminSupabase
      .from('care_plans')
      .select('id, created_at, status')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .single(),
    adminSupabase
      .from('outcome_logs')
      .select('rating, logged_at')
      .eq('user_id', user.id)
      .order('logged_at', { ascending: true })
      .limit(20),
    adminSupabase
      .from('coach_clients')
      .select('id')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .limit(1)
      .single(),
    adminSupabase
      .from('intake_answers')
      .select('answer')
      .eq('user_id', user.id)
      .eq('question_id', 'severity.primary')
      .order('created_at', { ascending: false })
      .limit(1)
      .single(),
  ]);

  const activePlan    = planRes.data;
  const logs          = logsRes.data ?? [];
  const ratings       = logs.map((l) => l.rating);
  const hasCoach      = !!coachRes.data;
  const tier          = await getUserTier(user.id);
  const isPaid        = hasAccess(tier, 'self_guided');
  const severityScore = typeof severityRes.data?.answer === 'number' ? severityRes.data.answer : 0;

  // Low-outcome detection: 3+ logs with avg < 3 → suggest coach
  const avgRating      = ratings.length >= 3 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : null;
  const showCoachNudge = isPaid && !hasCoach && avgRating !== null && avgRating < 3;

  // High-severity detection for free users (severity ≥ 7 on intake)
  const showHighSeverityUpgrade = !isPaid && severityScore >= 7;

  // Inactivity detection: has a plan but no logs in 14 days
  const lastLogDate    = logs.length > 0 ? new Date(logs[logs.length - 1]!.logged_at) : null;
  const daysSinceLog   = lastLogDate ? Math.floor((Date.now() - lastLogDate.getTime()) / (1000 * 60 * 60 * 24)) : null;
  const showInactiveNudge = activePlan && isPaid && daysSinceLog !== null && daysSinceLog >= 14;

  return (
    <div className="space-y-4 max-w-lg mx-auto">
      {/* Greeting */}
      <div className="flex items-start justify-between pt-2">
        <div>
          <p className="text-xs text-muted-foreground">{greeting()}</p>
          <h1 className="text-2xl font-display font-medium text-foreground leading-tight">{firstName}</h1>
        </div>
        <button
          className="w-11 h-11 rounded-full flex items-center justify-center border border-border bg-card hover:bg-secondary transition-colors"
          aria-label="Notifications"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M6 9a6 6 0 0112 0c0 5 2 6 2 6H4s2-1 2-6z"/>
            <path d="M10.5 19a1.5 1.5 0 003 0"/>
          </svg>
        </button>
      </div>

      {/* Action card */}
      {activePlan ? (
        <div className="rounded-2xl p-5 space-y-3" style={{ background: 'var(--primary)', color: '#fff' }}>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-xs font-semibold" style={{ opacity: 0.9 }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>
              </svg>
              Today · Your wellness plan
            </span>
          </div>
          <p className="font-display text-xl font-medium leading-tight">Continue tracking your outcomes</p>
          <p className="text-sm" style={{ opacity: 0.85 }}>Log how you feel to refine your personalized plan over time.</p>
          <div className="flex gap-2 pt-1">
            <Link
              href="/tracking"
              className="flex-1 rounded-full py-2.5 text-sm font-semibold text-center transition-opacity hover:opacity-90"
              style={{ background: '#fff', color: 'var(--primary)' }}
            >
              Log how I feel
            </Link>
            <Link
              href={`/care-plan/${activePlan.id}`}
              className="rounded-full px-4 py-2.5 text-sm font-semibold text-center transition-opacity hover:opacity-90"
              style={{ background: 'rgba(255,255,255,0.18)', color: '#fff' }}
            >
              Plan
            </Link>
          </div>
          <Link
            href="/onboarding"
            className="block text-center text-xs mt-1"
            style={{ color: 'rgba(255,255,255,0.65)' }}
          >
            Retake intake to refresh →
          </Link>
        </div>
      ) : (
        <div className="rounded-2xl p-5 space-y-3 bg-secondary">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">Get started</p>
          <p className="font-display text-xl font-medium text-foreground leading-tight">Build your care plan</p>
          <p className="text-sm text-muted-foreground">Answer a few questions and get personalized educational recommendations.</p>
          <Link
            href="/onboarding"
            className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
          >
            Start intake →
          </Link>
        </div>
      )}

      {/* Trend chart */}
      {ratings.length >= 2 && (
        <div className="rounded-2xl border border-border bg-card p-5 card-shadow">
          <TrendChart ratings={ratings} />
        </div>
      )}

      {/* Quick links */}
      <div className="grid grid-cols-2 gap-3">
        <Link href="/education" className="rounded-2xl border border-border bg-card p-4 space-y-2 hover:bg-secondary transition-colors card-shadow">
          <span className="text-primary flex">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 3L2 8l10 5 10-5-10-5z"/><path d="M2 13l10 5 10-5"/><path d="M2 18l10 5 10-5"/>
            </svg>
          </span>
          <p className="text-sm font-semibold text-foreground">Learn</p>
          <p className="text-xs text-muted-foreground">Education hub</p>
        </Link>
        <Link href="/care-plan" className="rounded-2xl border border-border bg-card p-4 space-y-2 hover:bg-secondary transition-colors card-shadow">
          <span className="text-primary flex">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M5 4h9a2 2 0 012 2v14a2 2 0 00-2-2H5z"/><path d="M16 6h3v12a2 2 0 00-2-2h-1"/>
            </svg>
          </span>
          <p className="text-sm font-semibold text-foreground">My Plan</p>
          <p className="text-xs text-muted-foreground">View care plan</p>
        </Link>
      </div>

      {/* High-severity upgrade — urgent framing for free users with severe intake scores */}
      {showHighSeverityUpgrade && (
        <Link
          href="/account"
          className="rounded-2xl border border-red-200 bg-red-50 p-4 space-y-2 hover:bg-red-100 transition-colors"
        >
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-full bg-red-100 flex items-center justify-center shrink-0">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-600" aria-hidden="true">
                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-red-900">Your symptom severity is high — get a personalized plan</p>
              <p className="text-xs text-red-700 mt-0.5 leading-relaxed">
                Based on your intake (severity {severityScore}/10), you may benefit most from a guided approach.
                Unlock your full personalized care plan today.
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between pl-12">
            <span className="text-xs font-semibold text-red-800">Upgrade to Self-Guided — $19.99/mo</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500" aria-hidden="true">
              <path d="M9 6l6 6-6 6"/>
            </svg>
          </div>
        </Link>
      )}

      {/* Standard upgrade nudge — free users without high severity */}
      {!isPaid && !showHighSeverityUpgrade && (
        <Link
          href="/account"
          className="rounded-2xl border border-primary/30 bg-primary/5 p-4 flex items-center gap-3 hover:bg-primary/10 transition-colors"
        >
          <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M4 8l3.5 3L12 5l4.5 6L20 8l-1.5 10h-13z"/>
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-primary">Unlock your care plan</p>
            <p className="text-xs text-muted-foreground">Upgrade to Self-Guided — $19.99/mo</p>
          </div>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="text-primary/50 shrink-0" aria-hidden="true">
            <path d="M9 6l6 6-6 6"/>
          </svg>
        </Link>
      )}

      {/* Inactivity re-engagement — paid user with plan but no logs in 14 days */}
      {showInactiveNudge && (
        <Link
          href="/tracking"
          className="rounded-2xl border border-border bg-card p-4 flex items-center gap-3 hover:bg-secondary transition-colors card-shadow"
        >
          <div className="w-11 h-11 rounded-xl bg-secondary flex items-center justify-center text-primary shrink-0">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/>
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-foreground">You haven&apos;t logged in {daysSinceLog} days</p>
            <p className="text-xs text-muted-foreground">Consistent tracking helps your plan improve over time.</p>
          </div>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground shrink-0" aria-hidden="true">
            <path d="M9 6l6 6-6 6"/>
          </svg>
        </Link>
      )}

      {/* Low-outcome coach nudge */}
      {showCoachNudge && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 space-y-3">
          <div className="flex items-start gap-3">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="text-amber-600 shrink-0 mt-0.5" aria-hidden="true">
              <circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>
            </svg>
            <div>
              <p className="text-sm font-semibold text-amber-800">Your outcomes suggest your plan may need adjustment</p>
              <p className="text-xs text-amber-700 mt-0.5 leading-relaxed">
                Your last {ratings.length} check-ins average {avgRating?.toFixed(1)}/5. A Cannabis Coach can review your plan and fine-tune your approach with you directly.
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Link
              href="/account"
              className="flex-1 rounded-full bg-amber-700 py-2.5 text-center text-xs font-semibold text-white hover:bg-amber-800 transition-colors"
            >
              Upgrade to Guided — $49.99/mo
            </Link>
            <Link
              href="/tracking"
              className="rounded-full border border-amber-300 bg-white px-4 py-2.5 text-center text-xs font-semibold text-amber-800 hover:bg-amber-50 transition-colors"
            >
              Log again
            </Link>
          </div>
        </div>
      )}

      {/* Coach CTA */}
      {hasCoach ? (
        <div className="rounded-2xl border border-border bg-card p-4 flex items-center gap-3 card-shadow">
          <div className="w-11 h-11 rounded-full bg-secondary flex items-center justify-center text-primary shrink-0">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="8" r="4"/><path d="M5 20c0-3.5 3-6 7-6s7 2.5 7 6"/>
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-foreground">Your Cannabis Coach</p>
            <p className="text-xs text-muted-foreground">Active consultation plan</p>
          </div>
          <Link href="/messages" className="rounded-full bg-secondary px-3 py-1.5 text-xs font-semibold text-secondary-foreground hover:opacity-80 transition-opacity">
            Message
          </Link>
        </div>
      ) : (
        <Link
          href="/account"
          className="rounded-2xl border border-border bg-card p-4 flex items-center gap-3 hover:bg-secondary transition-colors card-shadow"
        >
          <div className="w-11 h-11 rounded-xl bg-secondary flex items-center justify-center text-primary shrink-0">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M5 5h14a2 2 0 012 2v7a2 2 0 01-2 2H9l-4 3v-3a2 2 0 01-2-2V7a2 2 0 012-2z"/>
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-foreground">Add a Cannabis Coach</p>
            <p className="text-xs text-muted-foreground">Get your plan reviewed by an expert</p>
          </div>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground shrink-0" aria-hidden="true">
            <path d="M9 6l6 6-6 6"/>
          </svg>
        </Link>
      )}
    </div>
  );
}
