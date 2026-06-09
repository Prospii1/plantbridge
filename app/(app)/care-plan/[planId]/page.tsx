import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createSupabaseServerClient } from '@/lib/server/supabase-server';
import { createSupabaseAdminClient } from '@/lib/server/supabase-admin';
import { educationRefToSlug } from '@/lib/server/education/load-articles';
import { DISCLAIMERS } from '@/lib/shared/copy/disclaimers';
import { getDosingForLevel, type ExperienceLevel } from '@/lib/shared/copy/dosing-guidance';
import { getUserTier } from '@/lib/server/subscriptions';
import { hasAccess } from '@/lib/shared/utils/tier';
import { UpgradeGate } from '@/components/shared/upgrade-gate';
import { FEATURE_FLAGS } from '@/lib/shared/config/feature-flags';

interface Props {
  params: Promise<{ planId: string }>;
  searchParams: Promise<{ severity?: string }>;
}

const CATEGORY_ACCENT: Record<string, { border: string; label: string }> = {
  terpene:     { border: 'border-l-emerald-500', label: 'text-emerald-600' },
  cannabinoid: { border: 'border-l-violet-500',  label: 'text-violet-600' },
  format:      { border: 'border-l-blue-500',    label: 'text-blue-600' },
  timing:      { border: 'border-l-amber-500',   label: 'text-amber-600' },
  safety:      { border: 'border-l-red-400',     label: 'text-red-600' },
};

const STAGES = [
  { n: '1', title: 'Start low',           desc: 'Begin at the lowest suggested dose. Note how you feel after 2 hours.' },
  { n: '2', title: 'Find your level',     desc: 'After 3–5 days without side effects, increase slowly until symptoms ease.' },
  { n: '3', title: 'Maintain & track',   desc: 'Settle on an effective dose and keep logging to refine over time.' },
];

/** Maps a care plan item to a dispensary product category filter URL */
function getLocatorUrl(subject: string, category: string): string | null {
  if (!FEATURE_FLAGS.DISPENSARY_LOCATOR) return null;
  const subj = subject.toLowerCase();
  const cat  = category.toLowerCase();
  const FORMAT_MAP: Record<string, string> = {
    tincture: 'tincture', topical: 'topical', edible: 'edible', flower: 'flower', capsule: 'concentrate',
  };
  if (cat === 'format' && FORMAT_MAP[subj]) return `/locator?category=${FORMAT_MAP[subj]}`;
  if (cat === 'cannabinoid' || cat === 'terpene') return `/locator`;
  return null;
}

/** In-memory filter: does this product match a given care plan item? */
function productMatchesItem(
  product: { category: string; cbd_percentage: number | null; thc_percentage: number | null; terpene_profile: Record<string, number> | null },
  subject: string,
  category: string,
): boolean {
  const subj = subject.toLowerCase();
  const cat  = category.toLowerCase();

  if (cat === 'format') {
    const FORMAT_MAP: Record<string, string> = { tincture: 'tincture', topical: 'topical', edible: 'edible', flower: 'flower', capsule: 'concentrate' };
    return product.category === (FORMAT_MAP[subj] ?? subj);
  }
  if (cat === 'cannabinoid') {
    if (subj === 'cbd' || subj === 'cbn' || subj === 'cbg') {
      return (product.cbd_percentage ?? 0) >= 15;
    }
    if (subj === 'thc-low') return (product.thc_percentage ?? 99) <= 5;
    if (subj === 'thc-cbd-balanced') {
      return (product.thc_percentage ?? 0) >= 3 && (product.cbd_percentage ?? 0) >= 5;
    }
  }
  if (cat === 'terpene') {
    const profile = product.terpene_profile ?? {};
    return subj in profile;
  }
  return false;
}

export default async function CarePlanPage({ params, searchParams }: Props) {
  const { planId } = await params;
  const { severity: severityParam } = await searchParams;
  const severityFromIntake = severityParam ? parseInt(severityParam, 10) : undefined;

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const [planRes, itemsRes] = await Promise.all([
    supabase
      .from('care_plans')
      .select('id, status, rules_version, engine_version, created_at')
      .eq('id', planId)
      .single(),
    supabase
      .from('care_plan_items')
      .select('id, category, subject, confidence, education_ref, copy_ref, display_order')
      .eq('care_plan_id', planId)
      .order('display_order'),
  ]);

  if (!planRes.data) notFound();

  const tier = await getUserTier(user.id);
  if (!hasAccess(tier, 'self_guided')) {
    return (
      <UpgradeGate
        feature="Your personalized care plan"
        description="Upgrade to unlock your full care plan with dosing guidance, terpene profiles, and outcome tracking."
        severity={severityFromIntake}
        bullets={[
          'Personalized cannabinoid & terpene recommendations',
          'Starting dose guidance tuned to your experience level',
          'Titration path (Stage 1 → 2 → 3)',
          'Outcome tracking to see what actually works',
        ]}
      />
    );
  }

  const plan  = planRes.data;
  const items = itemsRes.data ?? [];

  const adminSupabase = createSupabaseAdminClient();

  // Fetch everything else in parallel
  const [logCountRes, latestSessionRes, profileRes] = await Promise.all([
    supabase
      .from('outcome_logs')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id),
    supabase
      .from('intake_sessions')
      .select('id')
      .eq('user_id', user.id)
      .not('completed_at', 'is', null)
      .order('completed_at', { ascending: false })
      .limit(1)
      .single(),
    supabase
      .from('profiles')
      .select('state')
      .eq('user_id', user.id)
      .single(),
  ]);

  const logCount  = logCountRes.count ?? 0;
  const sessionId = latestSessionRes.data?.id;
  const userState = profileRes.data?.state ?? '';

  // Pull experience + medication from latest intake session — fixed column names
  let experienceLevel: ExperienceLevel = 'beginner';
  let hasMedication = false;
  let selectedConditions: string[] = [];

  if (sessionId) {
    const { data: answers } = await supabase
      .from('intake_answers')
      .select('question_id, answer')
      .eq('session_id', sessionId)
      .in('question_id', ['experience.level', 'medication.current', 'condition.primary']);

    for (const a of answers ?? []) {
      if (a.question_id === 'experience.level') {
        const v = a.answer as string;
        if (v === 'moderate' || v === 'experienced') experienceLevel = v as ExperienceLevel;
      }
      if (a.question_id === 'medication.current' && a.answer === true) {
        hasMedication = true;
      }
      if (a.question_id === 'condition.primary') {
        selectedConditions = Array.isArray(a.answer) ? (a.answer as string[]) : [];
      }
    }
  }

  // Load products for matching (only if locator is enabled and user has a state)
  type Product = {
    id: string; name: string; category: string;
    thc_percentage: number | null; cbd_percentage: number | null;
    terpene_profile: Record<string, number> | null;
    price_cents: number | null; in_stock: boolean;
  };
  let allProducts: Product[] = [];

  if (FEATURE_FLAGS.DISPENSARY_LOCATOR && userState) {
    const { data: enabledPartners } = await adminSupabase
      .from('partners')
      .select('id')
      .eq('feature_flag_enabled', true);

    const enabledIds = (enabledPartners ?? []).map((p) => p.id);

    if (enabledIds.length > 0) {
      const { data: products } = await adminSupabase
        .from('dispensary_products')
        .select('id, name, category, thc_percentage, cbd_percentage, terpene_profile, price_cents, in_stock')
        .eq('in_stock', true)
        .eq('state', userState)
        .in('partner_id', enabledIds)
        .limit(100);
      allProducts = (products ?? []) as Product[];
    }
  }

  const currentStage   = logCount < 3 ? 0 : logCount < 8 ? 1 : 2;
  const categoryGroups = Array.from(new Set(items.map((i) => i.category)));

  const CONDITION_LABELS: Record<string, string> = {
    pain: 'Chronic pain', sleep: 'Sleep', anxiety: 'Anxiety & stress',
    ptsd: 'PTSD', menopause: 'Menopause', neuropathy: 'Neuropathy',
    arthritis: 'Arthritis', parkinsons: "Parkinson's", inflammation: 'Inflammation',
    mood: 'Low mood', focus: 'Focus', nausea: 'Nausea',
  };

  return (
    <div className="mx-auto max-w-2xl">

      {/* ── Gradient hero ── */}
      <div className="bg-gradient-to-b from-secondary to-background -mx-6 -mt-6 px-6 pt-8 pb-8 mb-6 space-y-3">
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7" /></svg>
            Plan ready
          </span>
          <span className="text-xs text-muted-foreground">
            {new Date(plan.created_at).toLocaleDateString('en-US', { dateStyle: 'medium' })}
          </span>
        </div>
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">Your educational care plan</p>
        <h1 className="font-display text-3xl font-medium leading-tight text-foreground">
          {items.length > 0 ? `${items.length} personalized recommendation${items.length === 1 ? '' : 's'}` : 'Educational Care Plan'}
        </h1>

        {/* Condition context */}
        {selectedConditions.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Personalized for:</p>
            <div className="flex flex-wrap gap-2">
              {selectedConditions.map((c) => (
                <span key={c} className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                  {CONDITION_LABELS[c] ?? c}
                </span>
              ))}
            </div>
          </div>
        )}

        {categoryGroups.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {categoryGroups.map((cat) => (
              <span key={cat} className="inline-flex items-center rounded-full border border-border bg-card/60 px-3 py-1 text-xs font-medium capitalize text-muted-foreground">{cat}</span>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-5">

        {/* ── Titration path ── */}
        <div className="rounded-2xl border border-border bg-card p-5 space-y-4 card-shadow">
          <div className="flex items-center gap-2">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="text-primary shrink-0" aria-hidden="true">
              <circle cx="6" cy="6" r="2.5"/><circle cx="18" cy="18" r="2.5"/><path d="M8.5 6H14a3.5 3.5 0 010 7H10a3.5 3.5 0 000 7h-.5"/>
            </svg>
            <h2 className="text-sm font-semibold text-foreground">Your titration path</h2>
          </div>
          <div className="space-y-3">
            {STAGES.map((stage, idx) => {
              const isActive = idx === currentStage;
              const isDone   = idx < currentStage;
              return (
                <div key={stage.n} className="flex gap-3 items-start">
                  <div className="flex flex-col items-center shrink-0">
                    <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${isDone || isActive ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'}`}>
                      {isDone
                        ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7"/></svg>
                        : stage.n}
                    </span>
                    {idx < STAGES.length - 1 && <span className={`w-0.5 flex-1 min-h-4 mt-1 ${isDone ? 'bg-primary/40' : 'bg-border'}`} />}
                  </div>
                  <div className="pb-3">
                    <div className="flex items-center gap-2">
                      <p className={`text-sm font-semibold ${isActive || isDone ? 'text-foreground' : 'text-muted-foreground'}`}>{stage.title}</p>
                      {isActive && <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">Now</span>}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{stage.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Medication warning ── */}
        {hasMedication && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 flex gap-3">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="text-amber-600 shrink-0 mt-0.5" aria-hidden="true">
              <circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>
            </svg>
            <div>
              <p className="text-sm font-semibold text-amber-800">Medication check</p>
              <p className="text-xs text-amber-700 leading-relaxed mt-0.5">{DISCLAIMERS.medication}</p>
            </div>
          </div>
        )}

        {/* ── Recommendation cards ── */}
        {items.length === 0 ? (
          <div className="rounded-2xl border border-border bg-muted/30 p-6 text-center text-muted-foreground text-sm">
            No personalised recommendations matched your intake at this time. Try updating your intake.
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((item) => {
              const accent = CATEGORY_ACCENT[item.category] ?? { border: 'border-l-border', label: 'text-muted-foreground' };
              const dosingText   = getDosingForLevel(item.subject, experienceLevel);
              const locatorUrl   = getLocatorUrl(item.subject, item.category);
              const matchedProducts = allProducts
                .filter((p) => productMatchesItem(p, item.subject, item.category))
                .slice(0, 2);

              return (
                <div key={item.id} className={`rounded-2xl border border-border border-l-4 ${accent.border} bg-card p-5 space-y-3 card-shadow`}>
                  {/* Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className={`text-xs font-semibold uppercase tracking-widest ${accent.label}`}>{item.category}</span>
                      <h2 className="text-base font-semibold capitalize text-foreground mt-0.5">{item.subject}</h2>
                    </div>
                    <span className="shrink-0 rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground">
                      {Math.round(item.confidence * 100)}% match
                    </span>
                  </div>

                  {/* Dosing guidance */}
                  {dosingText && (
                    <div className="rounded-xl bg-muted/40 px-3 py-2.5 space-y-0.5">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Starting guidance</p>
                      <p className="text-sm text-foreground">{dosingText}</p>
                    </div>
                  )}

                  {/* Matched products */}
                  {matchedProducts.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Matched products near you</p>
                      {matchedProducts.map((p) => (
                        <div key={p.id} className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/20 px-3 py-2.5 text-sm">
                          <div>
                            <p className="font-medium text-foreground text-xs">{p.name}</p>
                            <div className="flex gap-2 text-xs text-muted-foreground mt-0.5">
                              {p.thc_percentage != null && <span>THC {p.thc_percentage}%</span>}
                              {p.cbd_percentage != null && <span>CBD {p.cbd_percentage}%</span>}
                            </div>
                          </div>
                          {p.price_cents != null && (
                            <span className="text-xs font-semibold text-foreground shrink-0">
                              ${(p.price_cents / 100).toFixed(2)}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Footer links */}
                  <div className="flex items-center gap-4 flex-wrap">
                    {item.education_ref && (
                      <Link href={`/education/${educationRefToSlug(item.education_ref)}?from=/care-plan/${planId}`} className="text-xs font-medium text-primary hover:underline">
                        Learn more →
                      </Link>
                    )}
                    {locatorUrl && matchedProducts.length === 0 && (
                      <Link href={locatorUrl} className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">
                        Find products near you →
                      </Link>
                    )}
                    {locatorUrl && matchedProducts.length > 0 && (
                      <Link href={locatorUrl} className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">
                        See all →
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Disclaimers ── */}
        <div className="rounded-xl border border-border/50 bg-muted/20 p-4 space-y-1 text-xs text-muted-foreground">
          <p>{DISCLAIMERS.standard}</p>
          <p className="mt-2">{DISCLAIMERS.carePlanFooter}</p>
        </div>

        {/* ── Retake intake ── */}
        <div className="flex flex-col items-center gap-2 py-2">
          <p className="text-xs text-muted-foreground">Changed your goals or conditions?</p>
          <Link
            href="/onboarding"
            className="text-xs font-semibold text-primary hover:underline"
          >
            Retake intake to refresh your plan →
          </Link>
        </div>
      </div>
    </div>
  );
}
