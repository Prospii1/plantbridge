import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = { title: 'Check your email' };

export default function ConfirmPage() {
  return (
    <div className="flex flex-col gap-4 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-secondary">
        <span className="text-2xl">✉</span>
      </div>
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold text-foreground">Check your email</h1>
        <p className="text-sm text-muted-foreground">
          We sent a confirmation link to your email address. Click the link to
          activate your account and continue.
        </p>
      </div>
      <p className="text-xs text-muted-foreground">
        Didn&apos;t receive it? Check your spam folder, or{' '}
        <Link href="/signup" className="text-primary underline-offset-4 hover:underline">
          try signing up again
        </Link>
        .
      </p>
      {process.env.NODE_ENV === 'development' && (
        <p className="text-xs text-muted-foreground">
          Using local Supabase?{' '}
          <a href="http://localhost:54324" className="text-primary underline-offset-4 hover:underline">
            Check inbucket
          </a>
          {' '}for your confirmation email.
        </p>
      )}
    </div>
  );
}
