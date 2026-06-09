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
    body: "See what's actually working for you with a simple structured log.",
  },
];

const PRICING_TIERS = [
  {
    name: 'Free',
    price: '$0',
    period: '/mo',
    features: ['Wellness intake questionnaire', '2 starter education articles', 'Basic plant awareness'],
    highlight: false,
    cta: 'Get started free',
  },
  {
    name: 'Marketplace Access',
    price: '$4.99',
    period: '/mo',
    features: ['Full Education Hub (17+ articles)', 'Marketplace discounts', 'Health & lab resource access', 'Certifications & tools'],
    highlight: true,
    cta: 'Start for $4.99/mo',
  },
  {
    name: 'Self-Guided',
    price: '$19.99',
    period: '/mo',
    features: ['Everything in Marketplace', 'Personalized care plan', 'Dosing guidance', 'Outcome tracking', 'Titration path'],
    highlight: false,
    cta: 'Get Self-Guided',
  },
  {
    name: 'Guided',
    price: '$49.99',
    period: '/mo',
    features: ['Everything in Self-Guided', 'Dedicated cannabis coach', 'Monthly 1:1 sessions', 'Priority support'],
    highlight: false,
    cta: 'Get Guided',
  },
] as const;

const TRUST_BADGES = [
  {
    label: 'Coach-reviewed',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z"/>
        <path d="M9 12l2 2 4-4"/>
      </svg>
    ),
  },
  {
    label: 'Lab-verified',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M10 4v5l-4.5 8a2 2 0 002 3h9a2 2 0 002-3L14 9V4"/>
        <path d="M9 4h6M7.5 15h9"/>
      </svg>
    ),
  },
  {
    label: 'Private',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="5" y="11" width="14" height="9" rx="2"/>
        <path d="M8 11V8a4 4 0 018 0v3"/>
      </svg>
    ),
  },
];

function PlantBridgeMark({ size = 76 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      style={{ display: 'block' }}
      aria-label="PlantBridge"
    >
      <circle cx="24" cy="24" r="22" fill="none" stroke="var(--primary)" strokeWidth="2" strokeOpacity="0.25" />
      <path d="M9 32c5-7 25-7 30 0" fill="none" stroke="var(--primary)" strokeWidth="2.4" strokeLinecap="round" strokeOpacity="0.5" />
      <path d="M24 34V18" fill="none" stroke="var(--primary)" strokeWidth="2.6" strokeLinecap="round" />
      <path d="M24 24c0-4-2.6-6.4-7.5-6.4C16.5 22 19.5 24 24 24z" fill="var(--primary)" />
      <path d="M24 20c0-3.6 2.4-5.6 6.6-5.6C30.6 18.2 28 20 24 20z" fill="var(--primary)" fillOpacity="0.7" />
    </svg>
  );
}

export default function HomePage() {
  return (
    <div>
      {/* ── Hero ── */}
      <section className="bg-gradient-to-b from-secondary to-background px-6 py-20 flex flex-col items-center gap-8 text-center">
        {/* Animated mark */}
        <div
          className="w-32 h-32 rounded-full bg-card flex items-center justify-center animate-breathe"
          style={{ boxShadow: '0 20px 50px -20px var(--primary)' }}
        >
          <PlantBridgeMark size={76} />
        </div>

        <div className="flex flex-col gap-4 max-w-lg">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">
            Personalized cannabis care
          </p>
          <h1 className="font-display text-4xl sm:text-5xl font-medium leading-tight tracking-tight text-foreground text-balance">
            Relief, guided by{' '}
            <em className="not-italic text-primary">your</em> body.
          </h1>
          <p className="text-base text-muted-foreground leading-relaxed">
            Answer a few questions and we&apos;ll build an educational care plan tuned
            to your wellness goals — no guesswork at the dispensary counter.
          </p>
        </div>

        {/* Trust badges */}
        <div className="flex flex-wrap items-center justify-center gap-5">
          {TRUST_BADGES.map(({ label, icon }) => (
            <div key={label} className="flex items-center gap-2 text-muted-foreground">
              <span className="text-primary">{icon}</span>
              <span className="text-sm font-medium">{label}</span>
            </div>
          ))}
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs">
          <Link
            href="/signup"
            className="flex-1 rounded-full bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground text-center hover:opacity-90 transition-opacity"
            style={{ boxShadow: '0 6px 18px -8px var(--primary)' }}
          >
            Get started
          </Link>
          <Link
            href="/login"
            className="flex-1 rounded-full border border-border bg-card px-6 py-3.5 text-sm font-semibold text-foreground text-center hover:bg-secondary transition-colors"
          >
            Sign in
          </Link>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="mx-auto max-w-4xl px-6 py-20 space-y-12">
        <h2 className="text-center font-display text-2xl font-medium text-foreground">
          How it works
        </h2>
        <div className="grid gap-8 sm:grid-cols-3">
          {HOW_IT_WORKS.map(({ step, title, body }) => (
            <div key={step} className="flex flex-col gap-3">
              <span className="text-3xl font-bold text-primary/25">{step}</span>
              <h3 className="font-semibold text-foreground">{title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section className="mx-auto max-w-4xl px-6 pb-20 space-y-12">
        <h2 className="text-center font-display text-2xl font-medium text-foreground">
          Why PlantBridge
        </h2>
        <div className="grid gap-5 sm:grid-cols-3">
          {FEATURES.map(({ title, body }) => (
            <div
              key={title}
              className="rounded-lg border border-border bg-card p-6 space-y-2 card-shadow"
            >
              <h3 className="font-semibold text-foreground">{title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Pricing ── */}
      <section className="mx-auto max-w-4xl px-6 pb-20 space-y-12">
        <div className="text-center space-y-2">
          <h2 className="font-display text-2xl font-medium text-foreground">Simple, transparent pricing</h2>
          <p className="text-sm text-muted-foreground">Start free. Upgrade when you&apos;re ready.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PRICING_TIERS.map(({ name, price, period, features, highlight, cta }) => (
            <div
              key={name}
              className={`rounded-2xl border p-5 space-y-4 flex flex-col ${
                highlight
                  ? 'border-primary bg-primary/5 card-shadow'
                  : 'border-border bg-card card-shadow'
              }`}
            >
              {highlight && (
                <span className="self-start rounded-full bg-primary/15 px-2.5 py-1 text-[10px] font-semibold text-primary">Most popular</span>
              )}
              <div>
                <p className="font-semibold text-foreground">{name}</p>
                <p className="text-xl font-bold text-primary mt-1">
                  {price}
                  {period && <span className="text-xs font-normal text-muted-foreground">{period}</span>}
                </p>
              </div>
              <ul className="flex-1 space-y-2">
                {features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-xs text-foreground">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary mt-0.5 shrink-0" aria-hidden="true">
                      <path d="M5 12.5l4.5 4.5L19 7"/>
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/signup"
                className={`block w-full rounded-full py-2.5 text-center text-sm font-semibold transition-opacity hover:opacity-90 ${
                  highlight
                    ? 'bg-primary text-primary-foreground'
                    : 'border border-border bg-card text-foreground hover:bg-secondary'
                }`}
              >
                {cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* ── Disclaimer ── */}
      <div className="px-6 pb-16">
        <p className="text-center text-xs text-muted-foreground max-w-xl mx-auto">
          {DISCLAIMERS.standard}
        </p>
      </div>
    </div>
  );
}
