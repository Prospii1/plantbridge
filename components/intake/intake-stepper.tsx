'use client';

import { useState } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { QuestionRenderer } from '@/components/intake/question-renderer';
import type { ValidatedIntakeQuestion } from '@/lib/shared/validators/intake-questions';
import type { IntakeSubmitState } from '@/app/(app)/onboarding/actions';
import type { IntakeAnswerValue } from '@/lib/shared/types/intake';

interface IntakeStepperProps {
  questions: ValidatedIntakeQuestion[];
  submitAction: (prev: IntakeSubmitState, formData: FormData) => Promise<IntakeSubmitState>;
}

function SubmitButton({ canAdvance }: { canAdvance: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={!canAdvance || pending}
      className="rounded-lg bg-primary px-6 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-40"
    >
      {pending ? 'Saving…' : 'Complete intake'}
    </button>
  );
}

export function IntakeStepper({ questions, submitAction }: IntakeStepperProps) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, IntakeAnswerValue>>({});
  const [state, formAction] = useFormState(submitAction, {});

  const current = questions[step] ?? questions[0];
  const isLast = step === questions.length - 1;
  const progress = ((step + 1) / questions.length) * 100;

  if (!current) return null;

  function handleChange(id: string, value: IntakeAnswerValue) {
    setAnswers((prev) => ({ ...prev, [id]: value }));
  }

  function handleNext() {
    if (!current) return;
    if (current.required && answers[current.id] === undefined) return;
    setStep((s) => s + 1);
  }

  function handleBack() {
    setStep((s) => Math.max(0, s - 1));
  }

  const canAdvance = !current.required || answers[current.id] !== undefined;

  return (
    <div className="mx-auto w-full max-w-xl space-y-8">
      {/* Progress bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Question {step + 1} of {questions.length}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-secondary">
          <div
            className="h-1.5 rounded-full bg-primary transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Question */}
      {current && (
        <QuestionRenderer
          question={current}
          value={answers[current.id]}
          onChange={handleChange}
        />
      )}

      {/* Error */}
      {state?.error && (
        <p className="text-sm text-destructive">{state.error}</p>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={handleBack}
          disabled={step === 0}
          className="rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-secondary disabled:pointer-events-none disabled:opacity-40"
        >
          Back
        </button>

        {isLast ? (
          <form action={formAction}>
            {/* Hidden inputs carrying all answers */}
            {Object.entries(answers).map(([key, val]) =>
              Array.isArray(val)
                ? val.map((v, i) => <input key={`${key}-${i}`} type="hidden" name={key} value={v} />)
                : <input key={key} type="hidden" name={key} value={String(val)} />,
            )}
            <SubmitButton canAdvance={canAdvance} />
          </form>
        ) : (
          <button
            type="button"
            onClick={handleNext}
            disabled={!canAdvance}
            className="rounded-lg bg-primary px-6 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-40"
          >
            Next
          </button>
        )}
      </div>
    </div>
  );
}
