-- Track "Stöd oss med en kaffe" clicks
create table public.support_clicks (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now()
);

-- Allow anyone to insert (visitors may not be logged in)
alter table public.support_clicks enable row level security;
create policy "Anyone can log support click" on public.support_clicks for insert with check (true);
create policy "Admin can read support clicks" on public.support_clicks for select using (public.is_admin());
