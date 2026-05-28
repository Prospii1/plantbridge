# PlantBridge — CLAUDE.md

> This file is the source of truth for how Claude Code works in this repo.
> Read it on every session before making changes. Update it when conventions change.
> If anything in this file conflicts with a one-off user request, **ask first** before deviating.

---

## 0. How to use this file

- **Treat sections 1–6 as hard rules.** Do not violate them without explicit permission from the user in the current session.
- **Sections 7+ are conventions.** Follow them by default; deviate only with a stated reason.
- When the user asks for something ambiguous, **ask one clarifying question before generating code** — do not assume.
- When you finish a task, end your response with a short "What I did / What I didn't do / Suggested next" summary. No exceptions.
- Never invent files, packages, env vars, or Supabase tables that aren't already in the repo or this doc. If you need one, propose it and wait for approval.

---

## 1. Project overview

**PlantBridge** is a cannabis wellness intelligence platform. It guides users through educational intake, generates personalized educational care plans (cannabinoids, terpenes, formats, timing), tracks outcomes over time, and — long-term — becomes a data intelligence layer for the cannabis wellness market.

**What this is:** an educational and wellness guidance platform.
**What this is NOT:** a medical, diagnostic, prescribing, or telemedicine platform.

The full vision has 12 modules across 4 phases. **We build in phase order.** Do not start Phase 2 work until Phase 1 is shipped and stable, even if asked.

**Current phase:** Phase 1 (auth, onboarding, intake, recommendation engine, care plans, outcome tracking, subscriptions).

---

## 2. The non-negotiables (read every time)

These are the rules that, if broken, create legal, security, or trust failures we cannot recover from. **No exceptions, no clever workarounds.**

### 2.1 Language rules
PlantBridge content — UI copy, recommendation output, emails, care plans, error messages — **never** uses:
- Medical/diagnostic language: "diagnose," "treat," "cure," "prescribe," "dose for [condition]," "therapy for [disease]"
- Outcome guarantees: "will help," "is proven to," "fixes," "eliminates"
- Disease names framed as targets: "for cancer," "for PTSD," "for depression"

PlantBridge content **does** use:
- Educational framing: "may support," "users often explore," "research suggests," "is associated with"
- Wellness framing: "wellness goal," "comfort," "relaxation," "focus," "sleep support"
- Disclaimers: every care plan, every recommendation, every outcome screen carries the disclaimer block from `lib/copy/disclaimers.ts`.

If you're unsure whether a phrase crosses the line, **default to softer educational framing** and flag it for review.

### 2.2 Row Level Security (RLS) is mandatory
Every Supabase table that touches user data **must** have RLS enabled and explicit policies before it is used in code. No exceptions.
- Default policy on every user-scoped table: users can only read/write rows where `user_id = auth.uid()`.
- Admin/coach/partner access is granted only via explicit role checks against the `profiles.role` column.
- Service-role keys are used **only** in Edge Functions and `/api` routes, **never** in client components.
- Before merging any migration, run `npm run rls:audit` (see Section 11) and paste the output into the PR.

### 2.3 Secrets and keys
- The `SUPABASE_SERVICE_ROLE_KEY` is never imported into any file under `app/`, `components/`, or `lib/client/`. Only `lib/server/` and `supabase/functions/` may use it.
- `.env.local` is never committed. If you generate one, add it to `.gitignore` first.
- Never log full JWTs, full Stripe webhook payloads, or full user PII to console.

### 2.4 Schema changes
- Every schema change is a migration file in `supabase/migrations/` with a timestamp prefix and a descriptive name.
- Never edit an existing migration — write a new one.
- Every migration includes both `up` and the inverse `down` logic in comments.

### 2.5 No silent failures
- Never `catch (e) {}` without either logging via `lib/observability/log.ts` or rethrowing.
- Stripe webhook handlers must return non-2xx on internal failure so Stripe retries. Idempotency is mandatory.

### 2.6 No diagnostic claims in recommendations
The recommendation engine outputs **educational suggestions**, not treatment plans. Recommendation cards must always include:
- A "this is educational, not medical advice" footer
- A "talk to your healthcare provider before changing medications" line when the intake flags medication use

---

## 3. Tech stack (locked)

Do not introduce new frameworks or libraries without approval. If you need a library, propose it with: name, purpose, size, last-commit date, and 1–2 alternatives.

| Layer | Choice | Version |
|---|---|---|
| Framework | Next.js (App Router) | 14+ |
| Language | TypeScript | strict mode on |
| UI | React + Tailwind + shadcn/ui | latest |
| Backend | Supabase (Postgres, Auth, RLS, Edge Functions, Storage, Realtime) | latest |
| Payments | Stripe (Checkout + Customer Portal + Webhooks) | latest |
| Observability | Posthog (events) + Sentry (errors) | latest |
| Email | Resend | latest |
| Deployment | Vercel | — |
| Package manager | pnpm | — |
| Node | 20 LTS | — |

**Future-but-not-now (do not install yet):** vector DB, embeddings, ML libraries, warehouse connectors. The schema and event log are designed so we can add these later without rebuilding.

---

## 4. Folder structure

```
/
├── app/                          # Next.js App Router
│   ├── (marketing)/              # public site, landing, pricing, legal
│   ├── (auth)/                   # login, signup, age-gate, state-select
│   ├── (app)/                    # authenticated user area
│   │   ├── onboarding/           # intake flow
│   │   ├── care-plan/            # generated care plan view
│   │   ├── tracking/             # outcome logging
│   │   ├── account/              # subscription, profile
│   │   └── education/            # education hub
│   ├── (admin)/                  # admin portal (role-gated)
│   ├── api/                      # route handlers
│   │   ├── stripe/webhook/
│   │   ├── intake/
│   │   ├── recommend/
│   │   └── outcomes/
│   └── layout.tsx
│
├── components/
│   ├── ui/                       # shadcn primitives only — do not modify these by hand
│   ├── intake/                   # intake-specific components
│   ├── care-plan/
│   ├── tracking/
│   ├── admin/
│   └── shared/                   # cross-feature shared components
│
├── lib/
│   ├── server/                   # server-only code (uses service role) — never imported by client
│   │   ├── supabase-admin.ts
│   │   ├── stripe.ts
│   │   └── recommend/            # recommendation engine
│   ├── client/                   # client-safe helpers
│   │   └── supabase-browser.ts
│   ├── shared/                   # isomorphic (types, validators, copy)
│   │   ├── types/
│   │   ├── validators/           # zod schemas
│   │   └── copy/                 # all user-facing strings live here
│   └── observability/
│
├── content/                      # versioned content the engine reads
│   ├── intake/
│   │   └── questions.v1.json     # intake question definitions
│   ├── recommendations/
│   │   └── rules.v1.json         # recommendation rules (see Section 7)
│   └── education/                # markdown education content
│
├── supabase/
│   ├── migrations/               # timestamped SQL migrations
│   ├── functions/                # edge functions
│   └── seed.sql
│
├── tests/                        # vitest + playwright
└── CLAUDE.md                     # this file
```

**Rules:**
- Never put server-only code under `lib/client/` or any client component.
- Never put user-facing strings directly in components — they live in `lib/shared/copy/`.
- Never hardcode recommendation logic in components or API routes — it lives in `content/recommendations/` and is consumed by `lib/server/recommend/`.

---

## 5. Coding conventions

### TypeScript
- `strict: true`, `noUncheckedIndexedAccess: true`.
- Every exported function has explicit return types.
- No `any`. Use `unknown` and narrow, or define the type.
- Use `zod` for all runtime validation of external input (form data, API requests, Stripe webhooks, intake answers).

### Naming
- Files: `kebab-case.ts` (components: `kebab-case.tsx`)
- Variables/functions: `camelCase`
- Types/interfaces: `PascalCase`
- Constants: `SCREAMING_SNAKE_CASE`
- DB tables and columns: `snake_case`, plural for tables (`outcome_logs`, not `OutcomeLog`)
- Routes: `kebab-case` URL segments

### Imports
- Absolute imports via `@/` alias only — no `../../../`.
- Group order: node built-ins → external packages → `@/lib` → `@/components` → relative.

### Components
- Server components by default. Add `"use client"` only when you need hooks, state, or browser APIs.
- One component per file. Co-locate small helpers in the same file; promote to `shared/` when reused.
- Props are explicit types, not `React.FC`.

### Data fetching
- Server components fetch via `lib/server/supabase-admin.ts` or RLS-respecting server client.
- Client components fetch via `/api` routes or Supabase browser client — never the service role.
- Mutations go through `/api` routes or Server Actions, never direct from client to DB for sensitive tables.

---

## 6. Database conventions

### Core tables (Phase 1)
These exist or will exist. Do not rename. Do not duplicate.

- `profiles` — extends `auth.users`. Holds `role` (`user` | `coach` | `partner` | `admin`), `state`, `age_verified_at`, `subscription_tier`.
- `intake_sessions` — one row per intake completion. References `user_id`.
- `intake_answers` — normalized answers, references `intake_sessions.id` and `question_id`.
- `recommendation_profiles` — derived profile from intake (cannabinoid preferences, terpene mix, format preferences, severity scores).
- `care_plans` — generated care plan, references `recommendation_profile_id`, includes `engine_version` and `rules_version`.
- `care_plan_items` — individual recommendation cards within a plan.
- `outcome_logs` — user-reported outcomes after using something from a care plan.
- `subscriptions` — mirrors Stripe state. `stripe_customer_id`, `stripe_subscription_id`, `tier`, `status`, `current_period_end`.
- `events` — append-only analytics event log. Schema-flexible JSON column. This is the foundation for the future intelligence engine — **log generously**.
- `recommendation_versions` — versioned snapshots of `rules.vN.json` so we can audit which version generated which plan.

### Universal columns
Every table has: `id uuid primary key default gen_random_uuid()`, `created_at timestamptz default now()`, `updated_at timestamptz default now()`. User-scoped tables also have `user_id uuid references auth.users(id) on delete cascade`.

### IDs
UUIDs everywhere. Never serial/bigserial.

### RLS template
For any user-scoped table, this is the minimum policy set (named tightly so we can audit):

```sql
alter table <table> enable row level security;

create policy "<table>_select_own" on <table>
  for select using (auth.uid() = user_id);

create policy "<table>_insert_own" on <table>
  for insert with check (auth.uid() = user_id);

create policy "<table>_update_own" on <table>
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
```

Admin access is a separate policy and **must** use the `profiles.role` check, not a hardcoded user ID.

### Migrations
- Run with `pnpm supabase db push` against local first, always.
- Every migration is reviewed by reading the diff before push.
- Destructive migrations (drop column, drop table, rename) require a backup note in the migration file and a two-step deploy (add new, migrate data, remove old).

---

## 7. The recommendation engine

This is the most important part of the codebase and the easiest one for an agent to screw up. Read this section carefully.

### Design principles
1. **Rules live in JSON, not code.** `content/recommendations/rules.v1.json` is the single source of truth. Code in `lib/server/recommend/` only loads, validates, and executes — it never embeds rules.
2. **The engine is deterministic.** Same input → same output. No randomness, no LLM calls in v1.
3. **Every output is versioned.** Each care plan stores the `rules_version` and `engine_version` used. We never lose the ability to explain why a recommendation was made.
4. **Confidence is a first-class field.** Every output recommendation carries a confidence score (0.0–1.0) computed by the rules. Even if v1 displays a simple label, the field exists.

### Rules JSON shape
```json
{
  "version": "1.0.0",
  "engine_min": "0.1.0",
  "rules": [
    {
      "id": "rec.terpene.linalool.sleep",
      "category": "terpene",
      "subject": "linalool",
      "when": {
        "all": [
          { "answer": "goal.primary", "in": ["sleep", "relaxation"] },
          { "answer": "severity.sleep", "gte": 3 }
        ]
      },
      "weight": 0.8,
      "education_ref": "edu.terpene.linalool",
      "copy_ref": "copy.rec.linalool.sleep"
    }
  ]
}
```

### Rules
- Rule IDs are dotted, stable, never reused. Adding a new rule = new ID. Removing a rule = mark `"deprecated": true`, do not delete.
- Education content and user-facing copy are **referenced**, not inlined. They live in `content/education/` and `lib/shared/copy/`.
- A schema validator (`lib/server/recommend/validate-rules.ts`) runs at startup. The app refuses to boot if rules don't validate.
- Adding or changing rules requires bumping the rules version (semver: patch for copy fixes, minor for new rules, major for shape changes) and writing a new `rules.vN.json` file.

### When the user asks you to "add a recommendation"
Do not edit code. Edit `content/recommendations/rules.v1.json`, bump the version, regenerate the version snapshot, and write a test that exercises the new rule with a sample intake.

---

## 8. Security and compliance guardrails

### Age and state gate
- Block all authenticated app routes until `profiles.age_verified_at` is set and `profiles.state` is one of the allowed states. Allowed states list lives in `lib/shared/config/allowed-states.ts` — do not hardcode.
- The age gate is server-side enforced in `middleware.ts`. Client-side checks are courtesy only.

### Disclaimers
- Every care plan view, every recommendation card, every outcome submission form includes the disclaimer block from `lib/shared/copy/disclaimers.ts`.
- The signup flow records consent in `profiles.consent_versions` (jsonb keyed by document name → version → timestamp).

### Health-adjacent data
- Treat all intake answers and outcome logs as sensitive even if not legally HIPAA-protected.
- Never include intake answers or outcomes in analytics events or third-party tools without aggregation.
- Posthog events carry `user_id` and event metadata only — never raw symptom text.

### Stripe
- Webhook handler is at `app/api/stripe/webhook/route.ts`.
- Verify the signature with `stripe.webhooks.constructEvent` on every call.
- Idempotency: store processed `event.id` in `stripe_events` table; skip duplicates.
- When the application asks Stripe for an account, describe the business as "wellness education and content platform" — **not** as a cannabis dispensary or marketplace. Do not include language that would trigger Stripe's restricted businesses review without legal sign-off.

---

## 9. Phased build order

Claude Code, when in doubt, defaults to the earliest unfinished phase. **Do not start a later phase early to "save time."**

### Phase 1 — Foundation (current)
**Goal: revenue-capable v1 with a credible intake → care plan → tracking loop.**

1. Repo setup, env, Supabase project, base schema, RLS, middleware, layout shell.
2. Auth + age/state gate + onboarding.
3. Intake engine (driven by `content/intake/questions.v1.json`).
4. Recommendation engine v1 (rules JSON, deterministic).
5. Care plan generation + view.
6. Outcome tracking (manual log form + simple history view).
7. Stripe — Self-Guided tier only. Customer portal for cancellation.
8. Basic Posthog event logging + Sentry.
9. Legal pages, disclaimers, consent recording.
10. Soft launch to waitlist.

**Phase 1 is done when:** A new user can sign up, complete intake, see a care plan, log an outcome, pay for a subscription, and cancel — all without manual intervention, in production, with RLS audited.

### Phase 2 — Operations
Admin dashboard (user management, content management, recommendation rule editor UI, subscription overview, basic analytics dashboards). Education CMS. Tiered subscriptions (Guided + Concierge) — *without* the coach features themselves; just the plumbing for tier differentiation.

### Phase 3 — Coach + partner ecosystem
Coach onboarding, dashboards, user assignments, messaging, scheduling. Partner accounts. Dispensary product locator (start with one provider, e.g. Dutchie, behind a feature flag).

### Phase 4 — Intelligence
Analytics pipelines, anonymized outcome aggregation, recommendation effectiveness scoring, embeddings + vector search for product/strain matching, ML-assisted recommendation v2 (still deterministic-first; ML proposes, rules still gate).

---

## 10. Definition of done

A task is not done until:
- [ ] Code compiles, types pass (`pnpm typecheck`)
- [ ] Lint passes (`pnpm lint`)
- [ ] If it touched DB: migration written, RLS policies in place, `pnpm run rls:audit` clean
- [ ] If it touched payments: webhook tested with Stripe CLI, idempotency verified
- [ ] If it added user-facing copy: copy lives in `lib/shared/copy/`, disclaimer logic reviewed
- [ ] Tests written for non-trivial logic (recommendation rules, intake branching, webhook handlers)
- [ ] No `console.log` left behind; observability calls used instead
- [ ] CLAUDE.md updated if conventions changed

---

## 11. Commands

```bash
pnpm dev                    # local dev server
pnpm typecheck              # tsc --noEmit
pnpm lint                   # eslint
pnpm test                   # vitest
pnpm test:e2e               # playwright
pnpm supabase start         # local supabase
pnpm supabase db push       # apply migrations locally
pnpm supabase db diff       # show pending schema diff
pnpm run rls:audit          # custom script: lists every table and its policies
pnpm run rules:validate     # validate content/recommendations/*.json against schema
stripe listen --forward-to localhost:3000/api/stripe/webhook   # local webhook testing
```

---

## 12. When to stop and ask the user

Stop and ask **before** doing any of the following:
- Adding a new dependency
- Creating a new top-level folder
- Designing a new database table that's not in Section 6
- Writing code that touches medication, drug interactions, or specific medical conditions
- Anything involving real money flow you haven't been explicitly told to build
- Modifying RLS policies on a table that already has them
- Starting work that belongs to a later phase
- Changing anything in this CLAUDE.md

Ask **one** focused question. Don't dump five. Wait for the answer before proceeding.

---

## 13. Common failure modes to avoid

These are things agents (you) tend to do wrong on this kind of project. Watch for them in yourself.

1. **Over-engineering Phase 1 with Phase 4 abstractions.** If you're tempted to add a "pluggable recommendation strategy interface" in v1, don't. The rules JSON + one executor is the whole abstraction we need until ML lands.
2. **Generating recommendation rules from medical knowledge.** You don't have the domain authority to invent these. If asked to "add some starter rules," generate the *schema and 2–3 obviously-safe examples* (e.g. linalool → relaxation education), and explicitly note that the rule library must be reviewed by a domain expert before launch.
3. **Bypassing RLS for convenience.** Never use the service-role key in a server component "just to get it working." If RLS is blocking you, the policy is wrong — fix the policy.
4. **Sprawling intake question files.** Keep `questions.v1.json` flat and reviewable. If branching logic gets complex, propose a redesign, don't bury it in nested conditions.
5. **Stripe state drift.** Never compute subscription state from your DB without reconciling against Stripe. The webhook is the source of truth; the DB is a cache.
6. **Inventing libraries.** Before importing `react-something-something`, check it exists, check the last commit, check bundle size. Prefer building 30 lines over adding a 50KB dep.
7. **Skipping the disclaimer/copy layer.** If you find yourself writing user-facing text inline in JSX, stop and put it in `lib/shared/copy/` first.

---

## 14. What this doc doesn't cover

Things deliberately left for later or for human decision:
- Specific recommendation rule content (domain expert work)
- Final pricing for tiers (business decision)
- Coach credentialing model (legal + business decision)
- Dispensary partner selection (BD work)
- ML model architecture (Phase 4 decision)

If a session needs to make a call on any of the above, **ask the user**.

---

_Last updated: 2026-05-23_
_When this file changes, summarize the change in the commit message and bump the date._
