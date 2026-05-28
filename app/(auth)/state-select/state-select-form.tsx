'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { ALLOWED_STATES } from '@/lib/shared/config/allowed-states';
import { selectStateAction, type StateSelectState } from './actions';

const STATE_LABELS: Record<string, string> = {
  AZ: 'Arizona', CA: 'California', CO: 'Colorado', CT: 'Connecticut',
  DE: 'Delaware', IL: 'Illinois', MA: 'Massachusetts', MD: 'Maryland',
  ME: 'Maine', MI: 'Michigan', MN: 'Minnesota', MO: 'Missouri',
  NJ: 'New Jersey', NM: 'New Mexico', NV: 'Nevada', NY: 'New York',
  OH: 'Ohio', OR: 'Oregon', VT: 'Vermont', WA: 'Washington',
};

const initialState: StateSelectState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
    >
      {pending ? 'Saving…' : 'Continue'}
    </button>
  );
}

export function StateSelectForm() {
  const [state, formAction] = useFormState(selectStateAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="state" className="text-sm font-medium text-foreground">
          Your state
        </label>
        <select
          id="state"
          name="state"
          required
          defaultValue=""
          className="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="" disabled>
            Select your state…
          </option>
          {ALLOWED_STATES.map((code) => (
            <option key={code} value={code}>
              {STATE_LABELS[code] ?? code}
            </option>
          ))}
        </select>
      </div>

      {state.error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      )}

      <SubmitButton />
    </form>
  );
}
