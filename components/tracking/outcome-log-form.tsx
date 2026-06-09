'use client';

import Link from 'next/link';
import { useFormState, useFormStatus } from 'react-dom';
import { logOutcome, type OutcomeLogState } from '@/app/(app)/tracking/actions';

interface OutcomeLogFormProps {
  carePlanItemId: string;
  subject: string;
}

const SIDE_EFFECTS = [
  { value: 'none',     label: 'None — felt good' },
  { value: 'mild',     label: 'Mild (dry mouth, slight drowsiness)' },
  { value: 'moderate', label: 'Moderate — noticeable but manageable' },
  { value: 'severe',   label: 'Severe — want to stop' },
];

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-full bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:opacity-90 disabled:opacity-40"
    >
      {pending ? 'Saving…' : 'Save check-in'}
    </button>
  );
}

export function OutcomeLogForm({ carePlanItemId, subject }: OutcomeLogFormProps) {
  const [state, formAction] = useFormState<OutcomeLogState, FormData>(logOutcome, {});

  if (state.success) {
    if (state.sideEffects === 'severe') {
      return (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 space-y-4">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 shrink-0 w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-600" aria-hidden="true">
                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-red-900">Pause use immediately</p>
              <p className="text-xs text-red-700 leading-relaxed">
                Severe reactions are uncommon but serious. Stop using this product and contact your healthcare provider before continuing. Your check-in has been saved.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 pl-11">
            <Link
              href="/book"
              className="rounded-full bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700 transition-colors"
            >
              Talk to a PlantBridge coach
            </Link>
            <Link
              href="/education/cannabinoid-cbd"
              className="rounded-full border border-red-200 bg-white px-4 py-2 text-xs font-semibold text-red-700 hover:bg-red-50 transition-colors"
            >
              Learn about side effects
            </Link>
          </div>
          <p className="pl-11 text-[10px] text-red-500 leading-relaxed">
            This is educational information only. In case of emergency, call 911 or contact Poison Control at 1-800-222-1222.
          </p>
        </div>
      );
    }

    return (
      <div className="rounded-xl bg-secondary px-4 py-3 text-sm font-medium text-secondary-foreground">
        ✓ Check-in saved. Keep tracking to see your trend.
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="carePlanItemId" value={carePlanItemId} />

      {/* Effectiveness rating */}
      <div className="space-y-2">
        <p className="text-sm font-semibold text-foreground">
          How effective was <span className="capitalize">{subject}</span>?
        </p>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((v) => (
            <label key={v} className="cursor-pointer flex-1">
              <input type="radio" name="rating" value={v} className="sr-only peer" required />
              <span className="flex h-10 w-full items-center justify-center rounded-xl border border-border text-sm font-semibold transition-colors peer-checked:border-primary peer-checked:bg-primary peer-checked:text-primary-foreground hover:border-primary/50">
                {v}
              </span>
            </label>
          ))}
        </div>
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Not helpful</span><span>Very helpful</span>
        </div>
      </div>

      {/* Symptom level */}
      <div className="space-y-2">
        <p className="text-sm font-semibold text-foreground">Current symptom level</p>
        <p className="text-xs text-muted-foreground">How are your symptoms right now? (1 = none, 10 = severe)</p>
        <div className="flex flex-wrap gap-1.5">
          {Array.from({ length: 10 }, (_, i) => i + 1).map((v) => (
            <label key={v} className="cursor-pointer">
              <input type="radio" name="symptom_level" value={v} className="sr-only peer" />
              <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-xs font-semibold transition-colors peer-checked:border-primary peer-checked:bg-primary peer-checked:text-primary-foreground hover:border-primary/50">
                {v}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Dose taken */}
      <div className="space-y-1.5">
        <label htmlFor={`dose-${carePlanItemId}`} className="text-sm font-semibold text-foreground">
          Dose taken <span className="text-muted-foreground font-normal">(optional)</span>
        </label>
        <input
          id={`dose-${carePlanItemId}`}
          name="dose_taken"
          type="text"
          maxLength={80}
          placeholder="e.g. 2.5 mg tincture, 1 gummy, 3 drops"
          className="w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50"
        />
      </div>

      {/* Side effects */}
      <div className="space-y-2">
        <p className="text-sm font-semibold text-foreground">
          Any side effects? <span className="text-muted-foreground font-normal">(optional)</span>
        </p>
        <div className="space-y-2">
          {SIDE_EFFECTS.map(({ value, label }) => (
            <label
              key={value}
              className="flex cursor-pointer items-center gap-3 rounded-xl border border-border p-3 text-sm transition-colors hover:bg-secondary has-[:checked]:border-primary has-[:checked]:bg-secondary"
            >
              <input type="radio" name="side_effects" value={value} className="accent-primary" />
              <span>{label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Notes */}
      <div className="space-y-1.5">
        <label htmlFor={`notes-${carePlanItemId}`} className="text-sm font-semibold text-foreground">
          Notes <span className="text-muted-foreground font-normal">(optional)</span>
        </label>
        <textarea
          id={`notes-${carePlanItemId}`}
          name="notes"
          rows={2}
          maxLength={500}
          placeholder="Any other observations…"
          className="w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 resize-none"
        />
      </div>

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}

      <SubmitButton />
    </form>
  );
}
