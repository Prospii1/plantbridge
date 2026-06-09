'use client';

import { useState, useMemo } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { QuestionRenderer } from '@/components/intake/question-renderer';
import type { ValidatedIntakeQuestion } from '@/lib/shared/validators/intake-questions';
import type { IntakeSubmitState } from '@/app/(app)/onboarding/actions';
import type { IntakeAnswerValue } from '@/lib/shared/types/intake';

interface IntakeStepperProps {
  questions: ValidatedIntakeQuestion[];
  submitAction: (prev: IntakeSubmitState, formData: FormData) => Promise<IntakeSubmitState>;
}

/** Returns true if the question should be shown given the current answers */
function isVisible(question: ValidatedIntakeQuestion, answers: Record<string, IntakeAnswerValue>): boolean {
  if (!question.show_if) return true;
  const val = answers[question.show_if.answer];
  if (Array.isArray(val)) {
    return question.show_if.includes_any.some((v) => val.includes(v));
  }
  // single-value answer (e.g. single_choice stored as string)
  if (typeof val === 'string') {
    return question.show_if.includes_any.includes(val);
  }
  return false;
}

function SubmitButton({ canAdvance }: { canAdvance: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={!canAdvance || pending}
      className="rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:opacity-90 disabled:pointer-events-none disabled:opacity-40"
    >
      {pending ? 'Building your plan…' : 'Build my care plan →'}
    </button>
  );
}

export function IntakeStepper({ questions, submitAction }: IntakeStepperProps) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, IntakeAnswerValue>>({});
  const [state, formAction] = useFormState(submitAction, {});

  // Recompute visible questions whenever answers change
  const visibleQuestions = useMemo(
    () => questions.filter((q) => isVisible(q, answers)),
    [questions, answers],
  );

  const current = visibleQuestions[step] ?? visibleQuestions[0];
  const isLast = step === visibleQuestions.length - 1;
  const progress = ((step + 1) / visibleQuestions.length) * 100;

  if (!current) return null;

  function handleChange(id: string, value: IntakeAnswerValue) {
    setAnswers((prev) => ({ ...prev, [id]: value }));
  }

  function handleNext() {
    if (!current) return;
    if (current.required && answers[current.id] === undefined) return;
    setStep((s) => Math.min(s + 1, visibleQuestions.length - 1));
  }

  function handleBack() {
    setStep((s) => Math.max(0, s - 1));
  }

  const canAdvance = !current.required || answers[current.id] !== undefined;

  return (
    <div className="mx-auto w-full max-w-xl space-y-8">
      {/* Progress */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Question {step + 1} of {visibleQuestions.length}</span>
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
      <QuestionRenderer
        question={current}
        value={answers[current.id]}
        onChange={handleChange}
      />

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
          className="rounded-full border border-border px-5 py-2.5 text-sm font-medium transition-colors hover:bg-secondary disabled:pointer-events-none disabled:opacity-40"
        >
          ← Back
        </button>

        {isLast ? (
          <form action={formAction}>
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
            className="rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:opacity-90 disabled:pointer-events-none disabled:opacity-40"
          >
            Continue →
          </button>
        )}
      </div>
    </div>
  );
}
