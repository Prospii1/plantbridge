import { loadIntakeQuestions } from '@/lib/server/intake/load-questions';
import { IntakeStepper } from '@/components/intake/intake-stepper';
import { submitIntake } from '@/app/(app)/onboarding/actions';
import { DISCLAIMERS } from '@/lib/shared/copy/disclaimers';

export default function OnboardingPage() {
  const questions = loadIntakeQuestions();

  return (
    <div className="min-h-screen bg-gradient-to-b from-secondary to-background">
      <div className="mx-auto max-w-lg px-5 pt-10 pb-24">
        <div className="mb-8 space-y-1.5">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">Wellness intake</p>
          <h1 className="font-display text-2xl font-medium text-foreground leading-snug">
            Tell us about yourself
          </h1>
          <p className="text-sm text-muted-foreground">
            Your answers build a personalized educational care plan. Takes about 3 minutes.
          </p>
        </div>

        <IntakeStepper questions={questions} submitAction={submitIntake} />

        <p className="mt-8 text-center text-xs text-muted-foreground leading-relaxed">
          {DISCLAIMERS.standard}
        </p>
      </div>
    </div>
  );
}
