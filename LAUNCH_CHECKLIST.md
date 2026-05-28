# PlantBridge Launch Compliance & Hosted Testing Guide

This guide details the procedures for configuring integration keys, coordinating professional reviews (clinical and legal), and executing end-to-end testing on a hosted Supabase instance.

---

## 🛠️ Section 1: Integration Keys Configuration (Stripe, PostHog, Sentry)

To ensure operational readiness, map credentials for both **local development** and **hosted staging/production** environments.

### 1. Stripe Configuration
* **Business Classification:** When activating your Stripe merchant account, register the business under a low-risk category, such as **"wellness education, consulting, and content platform"**. Avoid terms like "dispensary," "cannabis," or "medical clinic" to prevent high-risk account classification.
* **API Credentials:**
  * Copy `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (test key begins with `pk_test_...`) and `STRIPE_SECRET_KEY` (begins with `sk_test_...`) from the [Stripe Developer Portal](https://dashboard.stripe.com/test/apikeys).
  * Generate a subscription price (recurring) in your Stripe Dashboard, and copy the ID (e.g., `price_...`) to `STRIPE_SELF_GUIDED_PRICE_ID` in your environment variables.
* **Webhook Listening:**
  * **Local Testing:** Run `stripe listen --forward-to localhost:3001/api/stripe/webhook` via the Stripe CLI. Copy the returned signature secret (begins with `whsec_...`) to `STRIPE_WEBHOOK_SECRET`.
  * **Hosted Environments:** Add a webhook endpoint in your Stripe dashboard pointing to `https://<your-custom-domain>.com/api/stripe/webhook` and subscribe to:
    * `checkout.session.completed`
    * `customer.subscription.updated`
    * `customer.subscription.deleted`
    * `invoice.payment_succeeded`
    * `invoice.payment_failed`

### 2. PostHog Setup
1. Access your [PostHog Console](https://app.posthog.com).
2. Retrieve the Project API Key from **Project Settings → API Keys**.
3. Set `NEXT_PUBLIC_POSTHOG_KEY` to this value.
4. Set `NEXT_PUBLIC_POSTHOG_HOST` to `https://us.i.posthog.com` (or `https://eu.i.posthog.com` for EU data storage).

### 3. Sentry Setup
1. Access your [Sentry Console](https://sentry.io).
2. Retrieve the DSN from **Project Settings → Client Keys (DSN)**.
3. Set `NEXT_PUBLIC_SENTRY_DSN` to the DSN URL.

---

## 🧠 Section 2: Clinical Domain Expert Review Protocol

Because recommendations include active plant substances (cannabinoids and terpenes), all underlying logic must be reviewed by qualified clinicians to verify user safety.

### 1. Designated Reviewers
* **Cannabis Nurse / Clinician:** Specializes in patient intake and lifestyle wellness guidance.
* **Clinical Pharmacist:** Expert in biochemical drug-drug interactions and cannabinoid metabolization.

### 2. Material Package
Provide reviewers with:
* The Intake Question Matrix: [questions.v1.json](file:///c:/Users/DELL/Desktop/Web%20projects/Plantbridge/content/intake/questions.v1.json)
* The Recommendation Rules Engine: [rules.v1.json](file:///c:/Users/DELL/Desktop/Web%20projects/Plantbridge/content/recommendations/rules.v1.json)

### 3. Verification Criteria
* **Clinical Safety:** Ensure sleep and relaxation attributes correctly associate with `linalool` (terpene) and `cbd` (cannabinoid).
* **Severity Constraints:** Validate that severe intake logs (severity score $\ge 3$) receive higher-confidence education cards without crossing into therapeutic diagnostic advice.
* **Contraindication Triggers:** Verify that if prescription medication use is flagged in the intake, a distinct provider consultation warning is displayed.

---

## ⚖️ Section 3: Legal & Regulatory Review Protocol

To safeguard the platform from regulatory audits (such as FDA, FTC, or state boards), verify that all copy avoids prescribing, diagnostic, or clinical language.

### 1. Legal Reviewers
* **FDA/FTC Regulatory Counsel:** Focuses on wellness vs. disease claims.
* **Cannabis Compliance Counsel:** Focuses on regional adult-use (21+) regulations.

### 2. Materials for Legal Review
* Disclaimers Module: [disclaimers.ts](file:///c:/Users/DELL/Desktop/Web%20projects/Plantbridge/lib/shared/copy/disclaimers.ts)
* Complete registration, onboarding, and check-out UI flow components.

### 3. Compliance Checklist
* **Non-Diagnostic Verbiage:** Do not use words like "diagnose," "treat," "cure," "prescribe," or "dosage." Replace them with "explore," "support," "wellness," and "educational suggestion."
* **Disclaimer Visibility:** Verify that standard, medication, and care plan disclaimers are placed in primary view (not hidden) before submission screens.
* **Enforced Age/State Gates:** Ensure that middleware and database policies strictly prevent access for individuals under 21 or residing in unauthorized jurisdictions.

---

## ☁️ Section 4: Hosted Supabase Staging Deployment & Testing

Follow these steps to deploy and execute live end-to-end user testing.

### 1. Database Provisioning & Schema Sync
1. Spin up a new database via the [Supabase Dashboard](https://supabase.com).
2. Retrieve the Project Reference ID.
3. Link and push migrations from your local workspace:
   ```bash
   pnpm supabase link --project-ref <your-project-ref-id>
   pnpm supabase db push
   ```

### 2. Remote Keys Configuration
Define the following environment variables in your web app hosting panel (e.g., Vercel):
* `NEXT_PUBLIC_SUPABASE_URL` (Hosted Supabase Endpoint)
* `NEXT_PUBLIC_SUPABASE_ANON_KEY` (Hosted Anon Key)
* `SUPABASE_SERVICE_ROLE_KEY` (Server-side only)
* `STRIPE_SECRET_KEY`
* `STRIPE_WEBHOOK_SECRET`
* `STRIPE_SELF_GUIDED_PRICE_ID`

Configure Edge Function variables using the Supabase CLI:
```bash
pnpm supabase secrets set STRIPE_SECRET_KEY=sk_live_...
```

### 3. Testing Execution Matrix (End-to-End User Journey)
Create a test account and complete the following pipeline:
1. **Gate Test:** Attempt access from an unauthorized state or with age < 21. Confirm automatic redirection to the `/not-available` or age-gate view.
2. **Onboarding Submission:** Complete the intake questionnaire. Verify database insertions in `intake_sessions` and `intake_answers`.
3. **Care Plan Matching:** Confirm the matching engine generates records in `care_plans` and `care_plan_items` on the live database, and redirects the user to `/care-plan/[planId]`.
4. **Subscription Webhook Loop:** Simulate a subscription payment. Check logs in `stripe_events` to verify the webhook constructs the Stripe signature successfully, rejects duplicate events, and upgrades `profiles.subscription_tier` to `self_guided`.
5. **Outcome Logging:** Log feedback metrics via the tracking dashboard. Confirm successful writes to the `outcome_logs` table.
