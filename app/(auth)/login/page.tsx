import type { Metadata } from 'next';
import Link from 'next/link';
import { LoginForm } from './login-form';

export const metadata: Metadata = { title: 'Sign in' };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string; error?: string }>;
}) {
  const params = await searchParams;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1 text-center">
        <h1 className="text-xl font-semibold text-foreground">Sign in</h1>
        <p className="text-sm text-muted-foreground">
          Welcome back to PlantBridge.
        </p>
      </div>

      {params.error === 'confirmation_failed' && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-center text-sm text-destructive">
          Email confirmation failed. Please try signing up again.
        </p>
      )}

      <LoginForm redirectTo={params.redirect} />

      <p className="text-center text-xs text-muted-foreground">
        Don&apos;t have an account?{' '}
        <Link href="/signup" className="text-primary underline-offset-4 hover:underline">
          Create one
        </Link>
      </p>
    </div>
  );
}
