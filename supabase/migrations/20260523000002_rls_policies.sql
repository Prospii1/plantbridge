-- Migration: rls_policies
-- Created: 2026-05-23
-- Enables RLS and creates access policies for all Phase 1 tables.
--
-- Policy naming convention: <table>_<operation>_<scope>
-- User-scoped tables: select/insert/update restricted to own rows (user_id = auth.uid()).
-- Admin policy on profiles: full access for rows where the caller's own profile has role='admin'.
-- Server-only tables (recommendation_versions, stripe_events): RLS on, no user policies —
--   access only via service role key in Edge Functions / API routes.
--
-- down:
--   For each table below: drop policy "<name>" on <table>; alter table <table> disable row level security;

-- ── profiles ──────────────────────────────────────────────────────────────────

alter table profiles enable row level security;

create policy "profiles_select_own" on profiles
  for select using (auth.uid() = user_id);

create policy "profiles_insert_own" on profiles
  for insert with check (auth.uid() = user_id);

create policy "profiles_update_own" on profiles
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Admins can read and write any profile row.
-- Uses a subquery rather than a join to avoid recursion on first insert.
create policy "profiles_admin_all" on profiles
  for all using (
    exists (
      select 1 from profiles p
      where p.user_id = auth.uid()
        and p.role = 'admin'
    )
  );

-- ── intake_sessions ───────────────────────────────────────────────────────────

alter table intake_sessions enable row level security;

create policy "intake_sessions_select_own" on intake_sessions
  for select using (auth.uid() = user_id);

create policy "intake_sessions_insert_own" on intake_sessions
  for insert with check (auth.uid() = user_id);

create policy "intake_sessions_update_own" on intake_sessions
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── intake_answers ────────────────────────────────────────────────────────────

alter table intake_answers enable row level security;

create policy "intake_answers_select_own" on intake_answers
  for select using (auth.uid() = user_id);

create policy "intake_answers_insert_own" on intake_answers
  for insert with check (auth.uid() = user_id);

create policy "intake_answers_update_own" on intake_answers
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── recommendation_profiles ───────────────────────────────────────────────────

alter table recommendation_profiles enable row level security;

create policy "recommendation_profiles_select_own" on recommendation_profiles
  for select using (auth.uid() = user_id);

create policy "recommendation_profiles_insert_own" on recommendation_profiles
  for insert with check (auth.uid() = user_id);

create policy "recommendation_profiles_update_own" on recommendation_profiles
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── care_plans ────────────────────────────────────────────────────────────────

alter table care_plans enable row level security;

create policy "care_plans_select_own" on care_plans
  for select using (auth.uid() = user_id);

create policy "care_plans_insert_own" on care_plans
  for insert with check (auth.uid() = user_id);

create policy "care_plans_update_own" on care_plans
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── care_plan_items ───────────────────────────────────────────────────────────

alter table care_plan_items enable row level security;

create policy "care_plan_items_select_own" on care_plan_items
  for select using (auth.uid() = user_id);

create policy "care_plan_items_insert_own" on care_plan_items
  for insert with check (auth.uid() = user_id);

create policy "care_plan_items_update_own" on care_plan_items
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── outcome_logs ──────────────────────────────────────────────────────────────

alter table outcome_logs enable row level security;

create policy "outcome_logs_select_own" on outcome_logs
  for select using (auth.uid() = user_id);

create policy "outcome_logs_insert_own" on outcome_logs
  for insert with check (auth.uid() = user_id);

create policy "outcome_logs_update_own" on outcome_logs
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── subscriptions ─────────────────────────────────────────────────────────────

alter table subscriptions enable row level security;

create policy "subscriptions_select_own" on subscriptions
  for select using (auth.uid() = user_id);

create policy "subscriptions_insert_own" on subscriptions
  for insert with check (auth.uid() = user_id);

create policy "subscriptions_update_own" on subscriptions
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── events ────────────────────────────────────────────────────────────────────
-- Users can insert their own events and read them back.
-- user_id is nullable; the insert policy allows null (anonymous events go via
-- server-side API route using service role, not this policy).

alter table events enable row level security;

create policy "events_select_own" on events
  for select using (auth.uid() = user_id);

create policy "events_insert_own" on events
  for insert with check (auth.uid() = user_id or user_id is null);

-- ── recommendation_versions ───────────────────────────────────────────────────
-- No user policies. Access only via service role in lib/server/.

alter table recommendation_versions enable row level security;

-- ── stripe_events ─────────────────────────────────────────────────────────────
-- No user policies. Access only via service role in webhook handler.

alter table stripe_events enable row level security;
