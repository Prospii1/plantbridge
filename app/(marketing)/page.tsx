import Link from 'next/link';
import { DISCLAIMERS } from '@/lib/shared/copy/disclaimers';

const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Take the intake',
    body: 'Answer a short set of wellness goal questions. Takes about 5 minutes.',
  },
  {
    step: '02',
    title: 'Get your care plan',
    body: 'Receive a personalized educational plan — cannabinoids, terpenes, formats, and timing.',
  },
  {
    step: '03',
    title: 'Track your outcomes',
    body: 'Log how things are going over time and refine your plan as you learn.',
  },
];

const FEATURES = [
  {
    title: 'Personalized guidance',
    body: 'Every recommendation is built from your specific goals, not generic advice.',
  },
  {
    title: 'Education-first',
    body: 'Understand the science behind cannabinoids and terpenes before you try anything.',
  },
  {
    title: 'Outcome tracking',
    body: 'See what\'s actually working for you with a simple structured log.',
  },
];

export default function HomePage() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-20 space-y-24">
      {/* Hero */}
      <div className="flex flex-col items-center gap-8 text-center">
        <div className="flex flex-col gap-4 max-w-3xl">
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
          <Link
            href="/signup"
            className="rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
          >
            Get started free
          </Link>
          <Link
            href="/login"
            className="rounded-md border border-border px-6 py-3 text-sm font-medium text-foreground hover:bg-muted transition-colors"
          >
            Sign in
          </Link>
        </div>
      </div>

      {/* How it works */}
      <div className="space-y-10">
        <h2 className="text-center text-2xl font-semibold text-foreground">How it works</h2>
        <div className="grid gap-8 sm:grid-cols-3">
          {HOW_IT_WORKS.map(({ step, title, body }) => (
            <div key={step} className="flex flex-col gap-3">
              <span className="text-3xl font-bold text-primary/30">{step}</span>
              <h3 className="font-semibold text-foreground">{title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Features */}
      <div className="space-y-10">
        <h2 className="text-center text-2xl font-semibold text-foreground">Why PlantBridge</h2>
        <div className="grid gap-6 sm:grid-cols-3">
          {FEATURES.map(({ title, body }) => (
            <div
              key={title}
              className="rounded-lg border border-border bg-card p-6 space-y-2"
            >
              <h3 className="font-semibold text-foreground">{title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Disclaimer */}
      <p className="text-center text-xs text-muted-foreground max-w-xl mx-auto">
        {DISCLAIMERS.standard}
      </p>
    </div>
  );
}
