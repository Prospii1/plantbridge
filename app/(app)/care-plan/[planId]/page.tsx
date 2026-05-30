import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createSupabaseServerClient } from '@/lib/server/supabase-server';
import { DISCLAIMERS } from '@/lib/shared/copy/disclaimers';

interface Props {
  params: Promise<{ planId: string }>;
}

export default async function CarePlanPage({ params }: Props) {
  const { planId } = await params;
  const supabase = await createSupabaseServerClient();

  const { data: plan } = await supabase
    .from('care_plans')
    .select('id, status, rules_version, engine_version, created_at')
    .eq('id', planId)
    .single();

  if (!plan) notFound();

  const { data: items } = await supabase
    .from('care_plan_items')
    .select('id, category, subject, confidence, education_ref, copy_ref, display_order')
    .eq('care_plan_id', planId)
    .order('display_order');

  const CATEGORY_ACCENT: Record<string, { border: string; label: string }> = {
    terpene:     { border: 'border-l-emerald-500', label: 'text-emerald-600 dark:text-emerald-400' },
    cannabinoid: { border: 'border-l-violet-500',  label: 'text-violet-600 dark:text-violet-400' },
    format:      { border: 'border-l-blue-500',    label: 'text-blue-600 dark:text-blue-400' },
    timing:      { border: 'border-l-amber-500',   label: 'text-amber-600 dark:text-amber-400' },
  };

  return (
    <div className="mx-auto max-w-2xl space-y-8 py-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold text-foreground">Your Educational Care Plan</h1>
        <p className="text-sm text-muted-foreground">
          Generated on {new Date(plan.created_at).toLocaleDateString('en-US', { dateStyle: 'long' })}
        </p>
      </div>

      {!items || items.length === 0 ? (
        <div className="rounded-lg border border-border bg-muted/30 p-6 text-center text-muted-foreground">
          No personalised recommendations matched your intake at this time. Try updating your intake.
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => {
            const accent = CATEGORY_ACCENT[item.category] ?? { border: 'border-l-border', label: 'text-muted-foreground' };
            return (
              <div key={item.id} className={`rounded-lg border border-border border-l-4 ${accent.border} bg-card p-5 space-y-2`}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className={`text-xs font-medium uppercase tracking-wide ${accent.label}`}>
                      {item.category}
                    </span>
                    <h2 className="text-lg font-medium capitalize text-foreground">{item.subject}</h2>
                  </div>
                  <span className="shrink-0 rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground">
                    {Math.round(item.confidence * 100)}% match
                  </span>
                </div>
                {item.education_ref && (
                  <Link
                    href={`/education/${item.education_ref}`}
                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    Learn more →
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="rounded-lg border border-border/50 bg-muted/20 p-4 space-y-1 text-xs text-muted-foreground">
        <p>{DISCLAIMERS.standard}</p>
        <p className="mt-2">{DISCLAIMERS.carePlanFooter}</p>
      </div>
    </div>
  );
}
