import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'PlantBridge Privacy Policy',
};

// Version must match what signup action records in profiles.consent_versions
const PRIVACY_VERSION = '1.0';

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground">
          Version {PRIVACY_VERSION} · Last updated: May 2026
        </p>
      </div>

      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        <strong>Legal review pending.</strong> This document is a placeholder and has not yet been reviewed by legal counsel. It must be reviewed and finalized before any public launch.
      </div>

      <section className="space-y-4 text-sm text-foreground leading-relaxed">
        <h2 className="text-lg font-semibold">1. Information We Collect</h2>
        <p>We collect information you provide directly, including:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Account information: email address and password hash</li>
          <li>Profile information: age verification status and state of residence</li>
          <li>Wellness intake responses: your wellness goals and preferences</li>
          <li>Outcome logs: your self-reported responses to care plan items</li>
          <li>Payment information: processed by Stripe; we do not store card numbers</li>
        </ul>
        <p>We also collect usage data such as pages visited, features used, and general platform analytics.</p>
      </section>

      <section className="space-y-4 text-sm text-foreground leading-relaxed">
        <h2 className="text-lg font-semibold">2. How We Use Your Information</h2>
        <p>We use your information to:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Provide and personalize the educational care plan service</li>
          <li>Process your subscription payments</li>
          <li>Send service-related communications</li>
          <li>Improve the platform using aggregated, anonymized analytics</li>
        </ul>
        <p>
          We treat all intake answers and outcome logs as sensitive. This data is never included in third-party analytics without aggregation and anonymization.
        </p>
      </section>

      <section className="space-y-4 text-sm text-foreground leading-relaxed">
        <h2 className="text-lg font-semibold">3. Data Sharing</h2>
        <p>We do not sell your personal information. We share data only with:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li><strong>Supabase</strong> — database and authentication infrastructure</li>
          <li><strong>Stripe</strong> — payment processing</li>
          <li><strong>Sentry</strong> — error monitoring (no PII in error payloads)</li>
          <li><strong>PostHog</strong> — product analytics (user ID and event type only, no symptom data)</li>
        </ul>
      </section>

      <section className="space-y-4 text-sm text-foreground leading-relaxed">
        <h2 className="text-lg font-semibold">4. Health-Adjacent Data</h2>
        <p>
          Your intake responses and outcome logs relate to your personal wellness. While PlantBridge is not a healthcare provider and this data is not a medical record, we treat it with heightened care: it is stored with row-level security, not shared with third parties in identifiable form, and not included in marketing communications.
        </p>
      </section>

      <section className="space-y-4 text-sm text-foreground leading-relaxed">
        <h2 className="text-lg font-semibold">5. Data Retention</h2>
        <p>
          We retain your account data for as long as your account is active. Upon account deletion, personal data is purged within 30 days, except where retention is required by law.
        </p>
      </section>

      <section className="space-y-4 text-sm text-foreground leading-relaxed">
        <h2 className="text-lg font-semibold">6. Your Rights</h2>
        <p>
          Depending on your location, you may have the right to access, correct, export, or delete your personal information. To exercise these rights, contact privacy@plantbridge.com.
        </p>
      </section>

      <section className="space-y-4 text-sm text-foreground leading-relaxed">
        <h2 className="text-lg font-semibold">7. Security</h2>
        <p>
          We use industry-standard security practices including encrypted transport (TLS), row-level security on all user data, and hashed password storage. No system is completely secure — use a strong, unique password for your account.
        </p>
      </section>

      <section className="space-y-4 text-sm text-foreground leading-relaxed">
        <h2 className="text-lg font-semibold">8. Contact</h2>
        <p>Privacy questions? Email privacy@plantbridge.com.</p>
      </section>
    </div>
  );
}
