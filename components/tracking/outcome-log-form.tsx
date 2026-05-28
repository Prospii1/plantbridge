'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { logOutcome, type OutcomeLogState } from '@/app/(app)/tracking/actions';

interface OutcomeLogFormProps {
  carePlanItemId: string;
  subject: string;
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-40"
    >
      {pending ? 'Saving…' : 'Log outcome'}
    </button>
  );
}

export function OutcomeLogForm({ carePlanItemId, subject }: OutcomeLogFormProps) {
  const [state, formAction] = useFormState<OutcomeLogState, FormData>(logOutcome, {});

  if (state.success) {
    return (
      <p className="text-sm text-primary font-medium">Outcome logged. Thank you for tracking!</p>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="carePlanItemId" value={carePlanItemId} />

      <div className="space-y-1">
        <p className="text-sm font-medium text-foreground">
          How did <span className="capitalize">{subject}</span> work for you?
        </p>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((v) => (
            <label key={v} className="cursor-pointer">
              <input type="radio" name="rating" value={v} className="sr-only peer" required />
              <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-sm font-medium transition-colors peer-checked:border-primary peer-checked:bg-primary peer-checked:text-primary-foreground hover:border-primary/60">
                {v}
              </span>
            </label>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">1 = Not helpful &nbsp;·&nbsp; 5 = Very helpful</p>
      </div>

      <div className="space-y-1">
        <label htmlFor={`notes-${carePlanItemId}`} className="text-sm text-muted-foreground">
          Notes (optional)
        </label>
        <textarea
          id={`notes-${carePlanItemId}`}
          name="notes"
          rows={2}
          maxLength={500}
          placeholder="Any observations you want to record…"
          className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 resize-none"
        />
      </div>

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}

      <SubmitButton />
    </form>
  );
}
