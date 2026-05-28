-- Migration: fix_profiles_rls_recursion
-- Created: 2026-05-25
-- The original profiles_admin_all policy queried the profiles table from within
-- a profiles policy, causing infinite recursion for every authenticated request.
-- Fix: replace with a SECURITY DEFINER helper function that bypasses RLS internally.
--
-- down:
--   drop function if exists public.is_admin();
--   drop policy if exists "profiles_admin_all" on profiles;
--   create policy "profiles_admin_all" on profiles
--     for all using (
--       exists (select 1 from profiles p where p.user_id = auth.uid() and p.role = 'admin')
--     );

-- Drop the recursive policy
drop policy if exists "profiles_admin_all" on profiles;

-- Create a SECURITY DEFINER function so the admin check runs without triggering
-- profiles RLS policies (security definer runs as the function owner, bypassing RLS).
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from profiles
    where user_id = auth.uid()
      and role = 'admin'
  );
$$;

-- Re-add the admin policy using the non-recursive helper
create policy "profiles_admin_all" on profiles
  for all using (public.is_admin());
