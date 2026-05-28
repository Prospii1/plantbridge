import { loadIntakeQuestions } from '@/lib/server/intake/load-questions';
import { IntakeStepper } from '@/components/intake/intake-stepper';
import { submitIntake } from '@/app/(app)/onboarding/actions';
import { DISCLAIMERS } from '@/lib/shared/copy/disclaimers';

export default function OnboardingPage() {
  const questions = loadIntakeQuestions();

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="mx-auto max-w-2xl px-4">
        <div className="mb-10 space-y-2 text-center">
          <h1 className="text-2xl font-semibold text-foreground">Wellness Intake</h1>
          <p className="text-muted-foreground">
            A few questions to personalise your educational care plan.
          </p>
        </div>

        <IntakeStepper questions={questions} submitAction={submitIntake} />

        <p className="mt-10 text-center text-xs text-muted-foreground">
          {DISCLAIMERS.standard}
        </p>
      </div>
    </div>
  );
}
