import Link from 'next/link';
import type { SubscriptionTier } from '@/lib/server/stripe';

const TIER_CTA: Partial<Record<SubscriptionTier, { label: string; price: string }>> = {
  marketplace: { label: 'Marketplace Access', price: '$4.99/mo' },
  self_guided: { label: 'Self-Guided',        price: '$19.99/mo' },
  guided:      { label: 'Guided',             price: '$49.99/mo' },
};

interface UpgradeGateProps {
  feature: string;
  description: string;
  bullets: string[];
  severity?: number;
  requiredTier?: SubscriptionTier;
}

export function UpgradeGate({
  feature,
  description,
  bullets,
  severity,
  requiredTier = 'self_guided',
}: UpgradeGateProps) {
  const isHighSeverity = severity !== undefined && severity >= 7;
  const cta = TIER_CTA[requiredTier] ?? TIER_CTA.self_guided!;

  return (
    <div className="mx-auto max-w-md py-12 px-4 flex flex-col items-center gap-6 text-center">
      {/* Icon */}
      <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="text-primary" aria-hidden="true">
          <rect x="5" y="11" width="14" height="9" rx="2"/>
          <path d="M8 11V8a4 4 0 018 0v3"/>
        </svg>
      </div>

      {/* Header */}
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">
          {cta.label} required
        </p>
        <h2 className="font-display text-2xl font-medium text-foreground leading-tight">
          {feature}
        </h2>
        {isHighSeverity ? (
          <p className="text-sm text-foreground leading-relaxed font-medium">
            Your intake shows significant symptom severity ({severity}/10). A personalized care plan could make a real difference — here&apos;s what you&apos;d unlock:
          </p>
        ) : (
          <p className="text-sm text-muted-foreground leading-relaxed">
            {description}
          </p>
        )}
      </div>

      {/* Feature bullets */}
      <ul className="w-full rounded-2xl bg-secondary px-5 py-4 space-y-2 text-left">
        {bullets.map((b) => (
          <li key={b} className="flex items-start gap-2 text-sm text-foreground">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary mt-0.5 shrink-0" aria-hidden="true">
              <path d="M5 12.5l4.5 4.5L19 7"/>
            </svg>
            {b}
          </li>
        ))}
      </ul>

      {/* CTAs */}
      <div className="flex flex-col gap-2 w-full">
        <Link
          href="/account"
          className="w-full rounded-full bg-primary py-3 text-sm font-semibold text-primary-foreground text-center hover:opacity-90 transition-opacity"
          style={{ boxShadow: '0 6px 18px -8px var(--primary)' }}
        >
          Upgrade to {cta.label} — {cta.price}
        </Link>
        <Link
          href="/education"
          className="w-full rounded-full border border-border py-3 text-sm font-medium text-foreground text-center hover:bg-secondary transition-colors"
        >
          Explore the free Education Hub →
        </Link>
      </div>

      <p className="text-xs text-muted-foreground">
        Cancel anytime from your account settings.
      </p>
    </div>
  );
}
