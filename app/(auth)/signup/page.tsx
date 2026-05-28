import type { Metadata } from 'next';
import Link from 'next/link';
import { DISCLAIMERS } from '@/lib/shared/copy/disclaimers';
import { SignupForm } from './signup-form';

export const metadata: Metadata = { title: 'Create account' };

export default function SignupPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1 text-center">
        <h1 className="text-xl font-semibold text-foreground">Create your account</h1>
        <p className="text-sm text-muted-foreground">
          Start your personalized wellness education journey.
        </p>
      </div>

      <SignupForm />

      <p className="text-center text-xs text-muted-foreground">
        Already have an account?{' '}
        <Link href="/login" className="text-primary underline-offset-4 hover:underline">
          Sign in
        </Link>
      </p>

      <p className="text-center text-xs text-muted-foreground">
        {DISCLAIMERS.ageAndState}
      </p>
    </div>
  );
}
