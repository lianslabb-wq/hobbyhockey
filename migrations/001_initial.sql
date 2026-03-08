-- Hobbyhockey database schema

-- Teams table
create table public.teams (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  type text not null default 'Veteran',
  location text not null,
  region text not null default 'Stockholm',
  contact_name text not null,
  contact_email text not null,
  calendar_url text,
  user_id uuid references auth.users(id),
  created_at timestamptz default now()
);

-- Goalies table
create table public.goalies (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  email text not null unique,
  phone text,
  location text not null,
  region text not null default 'Stockholm',
  available boolean default true,
  user_id uuid references auth.users(id),
  created_at timestamptz default now()
);

-- Sessions (training/match times)
create table public.sessions (
  id uuid default gen_random_uuid() primary key,
  team_id uuid references public.teams(id) on delete cascade,
  date date not null,
  time time not null,
  type text not null default 'Träning',
  rink text not null,
  needs_goalie boolean default false,
  created_at timestamptz default now()
);

-- Favorite goalies per team
create table public.favorites (
  id uuid default gen_random_uuid() primary key,
  team_id uuid references public.teams(id) on delete cascade,
  goalie_id uuid references public.goalies(id) on delete cascade,
  unique(team_id, goalie_id)
);

-- Requests (team looking for goalie)
create table public.requests (
  id uuid default gen_random_uuid() primary key,
  team_id uuid references public.teams(id) on delete cascade,
  session_id uuid references public.sessions(id) on delete cascade,
  type text not null default 'open',
  status text not null default 'open',
  created_at timestamptz default now()
);

-- Responses from goalies
create table public.responses (
  id uuid default gen_random_uuid() primary key,
  request_id uuid references public.requests(id) on delete cascade,
  goalie_id uuid references public.goalies(id) on delete cascade,
  answer text not null,
  created_at timestamptz default now(),
  unique(request_id, goalie_id)
);

-- Enable Row Level Security
alter table public.teams enable row level security;
alter table public.goalies enable row level security;
alter table public.sessions enable row level security;
alter table public.favorites enable row level security;
alter table public.requests enable row level security;
alter table public.responses enable row level security;

-- Policies: anyone can read (public marketplace)
create policy "Public read teams" on public.teams for select using (true);
create policy "Public read goalies" on public.goalies for select using (true);
create policy "Public read sessions" on public.sessions for select using (true);
create policy "Public read favorites" on public.favorites for select using (true);
create policy "Public read requests" on public.requests for select using (true);
create policy "Public read responses" on public.responses for select using (true);

-- Policies: authenticated users can insert/update their own data
create policy "Users manage own teams" on public.teams for all using (auth.uid() = user_id);
create policy "Users manage own goalie profile" on public.goalies for all using (auth.uid() = user_id);
create policy "Team owners manage sessions" on public.sessions for all using (
  team_id in (select id from public.teams where user_id = auth.uid())
);
create policy "Team owners manage favorites" on public.favorites for all using (
  team_id in (select id from public.teams where user_id = auth.uid())
);
create policy "Team owners manage requests" on public.requests for all using (
  team_id in (select id from public.teams where user_id = auth.uid())
);
create policy "Goalies manage own responses" on public.responses for all using (
  goalie_id in (select id from public.goalies where user_id = auth.uid())
);
