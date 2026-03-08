-- Add address fields for rinks and goalies
alter table public.sessions add column if not exists rink_address text;
alter table public.goalies add column if not exists address text;
