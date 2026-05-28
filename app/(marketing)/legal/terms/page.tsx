import type { Metadata } from 'next';
import { DISCLAIMERS } from '@/lib/shared/copy/disclaimers';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'PlantBridge Terms of Service',
};

// Version must match what signup action records in profiles.consent_versions
const TERMS_VERSION = '1.0';

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground">Terms of Service</h1>
        <p className="text-sm text-muted-foreground">
          Version {TERMS_VERSION} · Last updated: May 2026
        </p>
      </div>

      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        <strong>Legal review pending.</strong> This document is a placeholder and has not yet been reviewed by legal counsel. It must be reviewed and finalized before any public launch.
      </div>

      <section className="space-y-4 text-sm text-foreground leading-relaxed">
        <h2 className="text-lg font-semibold">1. Acceptance of Terms</h2>
        <p>
          By creating an account or using PlantBridge (&ldquo;Service&rdquo;), you agree to be bound by these Terms of Service. If you do not agree, do not use the Service.
        </p>
        <p>
          You must be 21 years of age or older and located in a jurisdiction where adult-use cannabis is legally permitted to use this Service.
        </p>
      </section>

      <section className="space-y-4 text-sm text-foreground leading-relaxed">
        <h2 className="text-lg font-semibold">2. Educational Purpose Only</h2>
        <p>{DISCLAIMERS.standard}</p>
        <p>
          PlantBridge provides wellness education and informational content only. We do not provide medical advice, diagnosis, treatment, or prescriptions. Nothing on PlantBridge should be construed as medical advice.
        </p>
        <p>{DISCLAIMERS.medication}</p>
      </section>

      <section className="space-y-4 text-sm text-foreground leading-relaxed">
        <h2 className="text-lg font-semibold">3. Eligibility</h2>
        <p>
          You represent that you are at least 21 years old and that you are accessing the Service from a jurisdiction where adult-use cannabis is legal. PlantBridge reserves the right to terminate accounts that do not meet these requirements.
        </p>
      </section>

      <section className="space-y-4 text-sm text-foreground leading-relaxed">
        <h2 className="text-lg font-semibold">4. User Accounts</h2>
        <p>
          You are responsible for maintaining the confidentiality of your account credentials and for all activity under your account. Notify us immediately of any unauthorized use at support@plantbridge.com.
        </p>
      </section>

      <section className="space-y-4 text-sm text-foreground leading-relaxed">
        <h2 className="text-lg font-semibold">5. Subscriptions and Payments</h2>
        <p>
          Paid subscriptions are billed on a recurring basis. You may cancel at any time through your account settings. Cancellations take effect at the end of the current billing period. Refunds are handled on a case-by-case basis.
        </p>
      </section>

      <section className="space-y-4 text-sm text-foreground leading-relaxed">
        <h2 className="text-lg font-semibold">6. Prohibited Uses</h2>
        <p>You may not use the Service to:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Provide medical advice to others</li>
          <li>Violate any applicable law or regulation</li>
          <li>Scrape, crawl, or systematically access content without permission</li>
          <li>Impersonate any person or entity</li>
          <li>Transmit spam or unsolicited communications</li>
        </ul>
      </section>

      <section className="space-y-4 text-sm text-foreground leading-relaxed">
        <h2 className="text-lg font-semibold">7. Disclaimer of Warranties</h2>
        <p>
          THE SERVICE IS PROVIDED &ldquo;AS IS&rdquo; WITHOUT WARRANTIES OF ANY KIND. PLANTBRIDGE DOES NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, ERROR-FREE, OR THAT ANY INFORMATION PROVIDED WILL PRODUCE ANY PARTICULAR HEALTH OUTCOME.
        </p>
      </section>

      <section className="space-y-4 text-sm text-foreground leading-relaxed">
        <h2 className="text-lg font-semibold">8. Limitation of Liability</h2>
        <p>
          TO THE FULLEST EXTENT PERMITTED BY LAW, PLANTBRIDGE SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, OR CONSEQUENTIAL DAMAGES ARISING FROM YOUR USE OF THE SERVICE.
        </p>
      </section>

      <section className="space-y-4 text-sm text-foreground leading-relaxed">
        <h2 className="text-lg font-semibold">9. Changes to Terms</h2>
        <p>
          We may update these Terms at any time. Continued use of the Service after changes constitutes acceptance of the new Terms. We will notify registered users of material changes by email.
        </p>
      </section>

      <section className="space-y-4 text-sm text-foreground leading-relaxed">
        <h2 className="text-lg font-semibold">10. Contact</h2>
        <p>Questions about these Terms? Contact us at legal@plantbridge.com.</p>
      </section>
    </div>
  );
}
