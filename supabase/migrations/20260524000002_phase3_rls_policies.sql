-- Migration: phase3_rls_policies
-- Created: 2026-05-24
-- RLS policies for all Phase 3 tables + coach read policies on Phase 1 tables.
--
-- Admin subquery pattern (avoids recursion):
--   exists (select 1 from profiles p where p.user_id = auth.uid() and p.role = 'admin')
--
-- Coach subquery pattern:
--   exists (select 1 from profiles p where p.user_id = auth.uid() and p.role = 'coach')
--
-- down:
--   Drop all policies listed below, then disable RLS on each table.

-- ── coaches ───────────────────────────────────────────────────────────────────

alter table coaches enable row level security;

create policy "coaches_select_own" on coaches
  for select using (auth.uid() = user_id);

create policy "coaches_update_own" on coaches
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "coaches_admin_all" on coaches
  for all using (
    exists (select 1 from profiles p where p.user_id = auth.uid() and p.role = 'admin')
  );

-- ── coach_clients ─────────────────────────────────────────────────────────────

alter table coach_clients enable row level security;

-- Coaches can read their own assignment rows.
create policy "coach_clients_coach_select" on coach_clients
  for select using (auth.uid() = coach_id);

-- Users can read the assignment row where they are the client.
create policy "coach_clients_user_select" on coach_clients
  for select using (auth.uid() = user_id);

-- Admins manage all assignments.
create policy "coach_clients_admin_all" on coach_clients
  for all using (
    exists (select 1 from profiles p where p.user_id = auth.uid() and p.role = 'admin')
  );

-- ── conversations ─────────────────────────────────────────────────────────────

alter table conversations enable row level security;

create policy "conversations_participant_select" on conversations
  for select using (auth.uid() = coach_id or auth.uid() = user_id);

create policy "conversations_participant_insert" on conversations
  for insert with check (auth.uid() = coach_id or auth.uid() = user_id);

create policy "conversations_participant_update" on conversations
  for update using (auth.uid() = coach_id or auth.uid() = user_id);

-- ── messages ──────────────────────────────────────────────────────────────────

alter table messages enable row level security;

create policy "messages_participant_select" on messages
  for select using (
    exists (
      select 1 from conversations c
      where c.id = conversation_id
        and (c.coach_id = auth.uid() or c.user_id = auth.uid())
    )
  );

create policy "messages_participant_insert" on messages
  for insert with check (
    auth.uid() = sender_id
    and exists (
      select 1 from conversations c
      where c.id = conversation_id
        and (c.coach_id = auth.uid() or c.user_id = auth.uid())
    )
  );

-- Recipients can mark messages as read (update read_at only).
create policy "messages_recipient_update" on messages
  for update using (
    exists (
      select 1 from conversations c
      where c.id = conversation_id
        and (c.coach_id = auth.uid() or c.user_id = auth.uid())
    )
  );

-- ── coach_availability ────────────────────────────────────────────────────────

alter table coach_availability enable row level security;

create policy "coach_availability_coach_all" on coach_availability
  for all using (auth.uid() = coach_id) with check (auth.uid() = coach_id);

-- Assigned users can read their coach's availability.
create policy "coach_availability_client_select" on coach_availability
  for select using (
    exists (
      select 1 from coach_clients cc
      where cc.coach_id = coach_availability.coach_id
        and cc.user_id = auth.uid()
        and cc.status = 'active'
    )
  );

-- ── bookings ──────────────────────────────────────────────────────────────────

alter table bookings enable row level security;

create policy "bookings_coach_all" on bookings
  for all using (auth.uid() = coach_id) with check (auth.uid() = coach_id);

create policy "bookings_user_select" on bookings
  for select using (auth.uid() = user_id);

create policy "bookings_user_insert" on bookings
  for insert with check (
    auth.uid() = user_id
    and exists (
      select 1 from coach_clients cc
      where cc.coach_id = bookings.coach_id
        and cc.user_id = auth.uid()
        and cc.status = 'active'
    )
  );

-- ── partners ──────────────────────────────────────────────────────────────────

alter table partners enable row level security;

create policy "partners_own_select" on partners
  for select using (auth.uid() = user_id);

create policy "partners_own_update" on partners
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "partners_admin_all" on partners
  for all using (
    exists (select 1 from profiles p where p.user_id = auth.uid() and p.role = 'admin')
  );

-- ── dispensary_products ───────────────────────────────────────────────────────

alter table dispensary_products enable row level security;

-- Products are publicly readable (authenticated users can browse them).
create policy "dispensary_products_public_select" on dispensary_products
  for select using (true);

-- Partners can manage their own products.
create policy "dispensary_products_partner_insert" on dispensary_products
  for insert with check (
    exists (
      select 1 from partners pt
      where pt.id = dispensary_products.partner_id
        and pt.user_id = auth.uid()
    )
  );

create policy "dispensary_products_partner_update" on dispensary_products
  for update using (
    exists (
      select 1 from partners pt
      where pt.id = dispensary_products.partner_id
        and pt.user_id = auth.uid()
    )
  );

create policy "dispensary_products_partner_delete" on dispensary_products
  for delete using (
    exists (
      select 1 from partners pt
      where pt.id = dispensary_products.partner_id
        and pt.user_id = auth.uid()
    )
  );

create policy "dispensary_products_admin_all" on dispensary_products
  for all using (
    exists (select 1 from profiles p where p.user_id = auth.uid() and p.role = 'admin')
  );

-- ── Coach read policies on Phase 1 tables ─────────────────────────────────────
-- Allow coaches to read their assigned clients' care plan and outcome data.
-- Uses coach_clients junction to scope access strictly to active assignments.

create policy "care_plans_coach_read" on care_plans
  for select using (
    exists (
      select 1 from coach_clients cc
      where cc.coach_id = auth.uid()
        and cc.user_id = care_plans.user_id
        and cc.status = 'active'
    )
  );

create policy "care_plan_items_coach_read" on care_plan_items
  for select using (
    exists (
      select 1 from coach_clients cc
      where cc.coach_id = auth.uid()
        and cc.user_id = care_plan_items.user_id
        and cc.status = 'active'
    )
  );

create policy "outcome_logs_coach_read" on outcome_logs
  for select using (
    exists (
      select 1 from coach_clients cc
      where cc.coach_id = auth.uid()
        and cc.user_id = outcome_logs.user_id
        and cc.status = 'active'
    )
  );
