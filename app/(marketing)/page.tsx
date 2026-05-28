import { DISCLAIMERS } from '@/lib/shared/copy/disclaimers';

export default function HomePage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col items-center gap-8 px-6 py-24 text-center">
      <div className="flex flex-col gap-4">
        <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          Cannabis wellness,{' '}
          <span className="text-primary">personalized for you.</span>
        </h1>
        <p className="text-lg text-muted-foreground">
          PlantBridge guides you through a personalized intake and builds an
          educational care plan around your wellness goals — cannabinoids,
          terpenes, formats, and timing that may support what you&apos;re
          looking for.
        </p>
      </div>

      <div className="flex gap-4">
        <a
          href="/signup"
          className="rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          Get started
        </a>
        <a
          href="/login"
          className="rounded-md border border-border px-6 py-3 text-sm font-medium text-foreground hover:bg-muted"
        >
          Sign in
        </a>
      </div>

      <p className="max-w-xl text-xs text-muted-foreground">
        {DISCLAIMERS.standard}
      </p>
    </div>
  );
}
