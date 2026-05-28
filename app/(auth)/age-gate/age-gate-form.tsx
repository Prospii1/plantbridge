'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { confirmAgeAction, type AgeGateState } from './actions';

const initialState: AgeGateState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
    >
      {pending ? 'Confirming…' : 'Yes, I am 21 or older'}
    </button>
  );
}

export function AgeGateForm() {
  const [state, formAction] = useFormState(confirmAgeAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {state.error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      )}
      <SubmitButton />
      <a
        href="/"
        className="rounded-md border border-border px-4 py-2 text-center text-sm font-medium text-foreground hover:bg-muted"
      >
        No, exit
      </a>
    </form>
  );
}
