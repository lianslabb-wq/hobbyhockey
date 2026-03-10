-- Migration 005: Privacy & Security
-- Locks down data access: require login, protect goalie personal info

-- 1. Drop all public read policies (removes anonymous access)
drop policy if exists "Public read teams" on public.teams;
drop policy if exists "Public read goalies" on public.goalies;
drop policy if exists "Public read sessions" on public.sessions;
drop policy if exists "Public read favorites" on public.favorites;
drop policy if exists "Public read requests" on public.requests;
drop policy if exists "Public read responses" on public.responses;

-- 2. Authenticated read policies (must be logged in)
create policy "Authenticated read teams" on public.teams
  for select using (auth.uid() is not null);

create policy "Authenticated read sessions" on public.sessions
  for select using (auth.uid() is not null);

create policy "Authenticated read requests" on public.requests
  for select using (auth.uid() is not null);

create policy "Authenticated read responses" on public.responses
  for select using (auth.uid() is not null);

-- 3. Goalies: ONLY owner can read their own full profile + admin
-- (the existing "Users manage own goalie profile" policy already covers owner CRUD)
create policy "Admin reads all goalies" on public.goalies
  for select using (public.is_admin());

-- 4. Safe goalie directory view (only non-sensitive data)
-- security_invoker = false means it bypasses RLS (runs as view creator)
create view public.goalie_directory
with (security_invoker = false) as
select id, name, location, available
from public.goalies;

grant select on public.goalie_directory to authenticated;

-- 5. Consent tracking columns
alter table public.teams add column if not exists privacy_consent boolean default false;
alter table public.teams add column if not exists privacy_consent_at timestamptz;
alter table public.goalies add column if not exists privacy_consent boolean default false;
alter table public.goalies add column if not exists privacy_consent_at timestamptz;

-- 6. Support clicks: add user tracking
alter table public.support_clicks add column if not exists user_email text;
