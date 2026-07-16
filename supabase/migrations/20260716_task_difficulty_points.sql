-- Task difficulty + point ledger for cohort leaderboard gamification.

do $$
begin
  if not exists (select 1 from pg_type where typname = 'task_difficulty') then
    create type public.task_difficulty as enum ('low', 'mid', 'high');
  end if;
end $$;

alter table public.tasks
  add column if not exists difficulty public.task_difficulty not null default 'low';

create table if not exists public.point_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  task_id uuid not null references public.tasks (id) on delete cascade,
  points integer not null check (points in (10, 25, 50)),
  difficulty public.task_difficulty not null,
  awarded_at timestamptz not null default now(),
  unique (task_id)
);

create index if not exists point_events_user_id_idx on public.point_events (user_id);
create index if not exists point_events_awarded_at_idx on public.point_events (awarded_at);

create table if not exists public.leaderboard_kudos_log (
  week_start date primary key,
  sent_at timestamptz not null default now(),
  top_user_ids uuid[] not null
);

alter table public.point_events enable row level security;
alter table public.leaderboard_kudos_log enable row level security;

drop policy if exists "Point events readable by authenticated users" on public.point_events;
create policy "Point events readable by authenticated users"
  on public.point_events for select to authenticated using (true);

-- No client writes on point_events — security definer trigger only.

drop policy if exists "Kudos log readable by authenticated users" on public.leaderboard_kudos_log;
create policy "Kudos log readable by authenticated users"
  on public.leaderboard_kudos_log for select to authenticated using (true);

create or replace function public.difficulty_points (d public.task_difficulty)
returns integer
language sql
immutable
as $$
  select case d
    when 'low' then 10
    when 'mid' then 25
    when 'high' then 50
  end;
$$;

create or replace function public.award_task_points()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  recipient uuid;
  pts integer;
begin
  -- Leaving done: remove award
  if tg_op = 'UPDATE'
    and old.status = 'done'
    and new.status is distinct from 'done'
  then
    delete from public.point_events where task_id = new.id;
    return new;
  end if;

  -- Not done: nothing to award
  if new.status is distinct from 'done' then
    return new;
  end if;

  recipient := coalesce(new.assignee_id, auth.uid(), new.created_by);
  if recipient is null then
    return new;
  end if;

  pts := public.difficulty_points(new.difficulty);

  insert into public.point_events (user_id, task_id, points, difficulty, awarded_at)
  values (recipient, new.id, pts, new.difficulty, now())
  on conflict (task_id) do update
    set user_id = excluded.user_id,
        points = excluded.points,
        difficulty = excluded.difficulty,
        awarded_at = case
          when public.point_events.user_id is distinct from excluded.user_id
            or public.point_events.points is distinct from excluded.points
            or public.point_events.difficulty is distinct from excluded.difficulty
          then now()
          else public.point_events.awarded_at
        end;

  return new;
end;
$$;

drop trigger if exists on_task_points_award on public.tasks;
create trigger on_task_points_award
  after update of status, difficulty, assignee_id on public.tasks
  for each row execute function public.award_task_points();

-- Realtime: include point_events in supabase_realtime publication when present
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'point_events'
    ) then
      alter publication supabase_realtime add table public.point_events;
    end if;
  end if;
end $$;
