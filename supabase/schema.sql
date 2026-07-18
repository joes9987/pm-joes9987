-- EudaPM schema for Hult Cohort Project 1
-- Run in Supabase SQL editor or via supabase db push

create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  display_name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null default '',
  owner_id uuid not null references public.profiles (id) on delete cascade,
  archived boolean not null default false,
  target_date timestamptz,
  github_repo text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create type public.task_status as enum ('todo', 'in_progress', 'done');
create type public.task_difficulty as enum ('low', 'mid', 'high');

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  title text not null,
  description text not null default '',
  status public.task_status not null default 'todo',
  difficulty public.task_difficulty not null default 'low',
  assignee_id uuid references public.profiles (id) on delete set null,
  created_by uuid not null references public.profiles (id) on delete cascade,
  due_date timestamptz,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists tasks_project_id_idx on public.tasks (project_id);
create index if not exists tasks_assignee_id_idx on public.tasks (assignee_id);
create index if not exists tasks_status_idx on public.tasks (status);
create index if not exists tasks_due_date_idx on public.tasks (due_date)
  where due_date is not null;
create index if not exists tasks_deleted_at_idx on public.tasks (deleted_at)
  where deleted_at is null;

create table if not exists public.task_comments (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete cascade,
  body text not null check (char_length(trim(body)) > 0),
  created_at timestamptz not null default now()
);

create index if not exists task_comments_task_id_idx on public.task_comments (task_id, created_at);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  type text not null check (type in ('assigned', 'due_soon', 'overdue', 'completed')),
  task_id uuid references public.tasks (id) on delete cascade,
  message text not null,
  read_at timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id, task_id, type)
);

create index if not exists notifications_user_id_idx on public.notifications (user_id);
create index if not exists notifications_read_at_idx on public.notifications (read_at)
  where read_at is null;

create table if not exists public.email_sent_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  digest_date date not null,
  sent_at timestamptz not null default now(),
  brevo_message_id text,
  unique (user_id, digest_date)
);

create index if not exists email_sent_log_digest_date_idx on public.email_sent_log (digest_date);

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

alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.tasks enable row level security;
alter table public.task_comments enable row level security;
alter table public.notifications enable row level security;
alter table public.email_sent_log enable row level security;
alter table public.point_events enable row level security;
alter table public.leaderboard_kudos_log enable row level security;

create policy "Profiles are readable by authenticated users"
  on public.profiles for select to authenticated using (true);

create policy "Users can insert own profile"
  on public.profiles for insert to authenticated
  with check (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "Projects readable by authenticated users"
  on public.projects for select to authenticated using (true);

create policy "Authenticated users can create projects"
  on public.projects for insert to authenticated
  with check (auth.uid() = owner_id);

create policy "Owners can update projects"
  on public.projects for update to authenticated
  using (auth.uid() = owner_id)
  with check (
    auth.uid() = owner_id
    and owner_id is not distinct from (
      select p.owner_id from public.projects p where p.id = projects.id
    )
  );

create policy "Tasks readable by authenticated users"
  on public.tasks for select to authenticated using (true);

create policy "Authenticated users can create tasks"
  on public.tasks for insert to authenticated
  with check (auth.uid() = created_by);

create policy "Task creators and assignees can update tasks"
  on public.tasks for update to authenticated
  using (
    auth.uid() = created_by
    or auth.uid() = assignee_id
    or auth.uid() in (
      select owner_id from public.projects where id = project_id
    )
  )
  with check (
    created_by is not distinct from (
      select t.created_by from public.tasks t where t.id = tasks.id
    )
    and (
      auth.uid() = created_by
      or auth.uid() = assignee_id
      or auth.uid() in (
        select owner_id from public.projects where id = project_id
      )
    )
  );

create policy "Users can read own notifications"
  on public.notifications for select to authenticated
  using (auth.uid() = user_id);

create policy "Users can update own notifications"
  on public.notifications for update to authenticated
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and user_id is not distinct from (
      select n.user_id from public.notifications n where n.id = notifications.id
    )
  );

create policy "Users can insert own notifications"
  on public.notifications for insert to authenticated
  with check (auth.uid() = user_id);

create policy "Comments readable by authenticated users"
  on public.task_comments for select to authenticated using (true);

create policy "Authors can insert comments"
  on public.task_comments for insert to authenticated
  with check (auth.uid() = author_id);

create policy "Authors can update own comments"
  on public.task_comments for update to authenticated
  using (auth.uid() = author_id)
  with check (auth.uid() = author_id);

create policy "Authors can delete own comments"
  on public.task_comments for delete to authenticated
  using (auth.uid() = author_id);

create policy "Point events readable by authenticated users"
  on public.point_events for select to authenticated using (true);

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
  if tg_op = 'UPDATE'
    and old.status = 'done'
    and new.status is distinct from 'done'
  then
    delete from public.point_events where task_id = new.id;
    return new;
  end if;

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

create or replace function public.notify_task_assignment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.assignee_id is not null
    and (tg_op = 'INSERT' or new.assignee_id is distinct from old.assignee_id)
  then
    insert into public.notifications (user_id, type, task_id, message)
    values (
      new.assignee_id,
      'assigned',
      new.id,
      'You were assigned: ' || new.title
    )
    on conflict (user_id, task_id, type) do update
      set message = excluded.message,
          read_at = null,
          created_at = now();
  end if;
  return new;
end;
$$;

create or replace function public.notify_task_completed()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'done'
    and old.status is distinct from 'done'
    and new.created_by is not null
    and new.created_by is distinct from auth.uid()
  then
    insert into public.notifications (user_id, type, task_id, message)
    values (
      new.created_by,
      'completed',
      new.id,
      'Task completed: ' || new.title
    )
    on conflict (user_id, task_id, type) do update
      set message = excluded.message,
          read_at = null,
          created_at = now();
  end if;
  return new;
end;
$$;

drop trigger if exists on_task_assignment_notify on public.tasks;
create trigger on_task_assignment_notify
  after insert or update of assignee_id on public.tasks
  for each row execute function public.notify_task_assignment();

drop trigger if exists on_task_completed_notify on public.tasks;
create trigger on_task_completed_notify
  after update of status on public.tasks
  for each row execute function public.notify_task_completed();

drop trigger if exists on_task_points_award on public.tasks;
create trigger on_task_points_award
  after update of status, difficulty, assignee_id on public.tasks
  for each row execute function public.award_task_points();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Realtime for live TaskBoard, notifications, comments, leaderboard
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'tasks'
    ) then
      alter publication supabase_realtime add table public.tasks;
    end if;
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'notifications'
    ) then
      alter publication supabase_realtime add table public.notifications;
    end if;
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'task_comments'
    ) then
      alter publication supabase_realtime add table public.task_comments;
    end if;
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'point_events'
    ) then
      alter publication supabase_realtime add table public.point_events;
    end if;
  end if;
end $$;
