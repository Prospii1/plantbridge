import type { Metadata } from 'next';
import { DISCLAIMERS } from '@/lib/shared/copy/disclaimers';
import { AgeGateForm } from './age-gate-form';

export const metadata: Metadata = { title: 'Age verification' };

export default function AgeGatePage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2 text-center">
        <h1 className="text-xl font-semibold text-foreground">Age verification</h1>
        <p className="text-sm text-muted-foreground">
          PlantBridge provides educational content about cannabis wellness. You
          must be 21 years of age or older to continue.
        </p>
      </div>

      <AgeGateForm />

      <p className="text-center text-xs text-muted-foreground">
        {DISCLAIMERS.ageAndState}
      </p>
    </div>
  );
}
