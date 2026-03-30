-- Goalie favorite teams (goalies can save favorite teams)
create table public.goalie_favorites (
  id uuid primary key default gen_random_uuid(),
  goalie_id uuid references public.goalies(id) on delete cascade,
  team_id uuid references public.teams(id) on delete cascade,
  created_at timestamptz default now(),
  unique(goalie_id, team_id)
);

-- RLS
alter table public.goalie_favorites enable row level security;

create policy "Goalies manage own favorites"
  on public.goalie_favorites for all
  using (goalie_id in (select id from public.goalies where user_id = auth.uid()))
  with check (goalie_id in (select id from public.goalies where user_id = auth.uid()));

create policy "Teams can see who favorited them"
  on public.goalie_favorites for select
  using (team_id in (select id from public.teams where user_id = auth.uid()));
