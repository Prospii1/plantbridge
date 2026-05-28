import type { Metadata } from 'next';
import { DISCLAIMERS } from '@/lib/shared/copy/disclaimers';
import { StateSelectForm } from './state-select-form';

export const metadata: Metadata = { title: 'Select your state' };

export default function StateSelectPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2 text-center">
        <h1 className="text-xl font-semibold text-foreground">Where are you located?</h1>
        <p className="text-sm text-muted-foreground">
          PlantBridge is available in US states where adult-use cannabis is
          legal. Select your state to continue.
        </p>
      </div>

      <StateSelectForm />

      <p className="text-center text-xs text-muted-foreground">
        {DISCLAIMERS.ageAndState}
      </p>
    </div>
  );
}
