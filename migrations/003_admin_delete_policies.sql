-- Allow admin (lianslabb@gmail.com) to delete any row
-- First get the admin user's ID dynamically via email lookup

create or replace function public.is_admin()
returns boolean as $$
  select exists (
    select 1 from auth.users
    where id = auth.uid()
    and email = 'lianslabb@gmail.com'
  );
$$ language sql security definer;

-- Admin delete policies
create policy "Admin delete teams" on public.teams for delete using (public.is_admin());
create policy "Admin delete goalies" on public.goalies for delete using (public.is_admin());
create policy "Admin delete sessions" on public.sessions for delete using (public.is_admin());
create policy "Admin delete favorites" on public.favorites for delete using (public.is_admin());
create policy "Admin delete requests" on public.requests for delete using (public.is_admin());
create policy "Admin delete responses" on public.responses for delete using (public.is_admin());
