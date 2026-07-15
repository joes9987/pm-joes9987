-- PM platform schema for Hult Cohort Project 1
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
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create type public.task_status as enum ('todo', 'in_progress', 'done');

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  title text not null,
  description text not null default '',
  status public.task_status not null default 'todo',
  assignee_id uuid references public.profiles (id) on delete set null,
  created_by uuid not null references public.profiles (id) on delete cascade,
  due_date timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists tasks_project_id_idx on public.tasks (project_id);
create index if not exists tasks_assignee_id_idx on public.tasks (assignee_id);
create index if not exists tasks_status_idx on public.tasks (status);
create index if not exists tasks_due_date_idx on public.tasks (due_date)
  where due_date is not null;

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

alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.tasks enable row level security;
alter table public.notifications enable row level security;
alter table public.email_sent_log enable row level security;

create policy "Profiles are readable by authenticated users"
  on public.profiles for select to authenticated using (true);

create policy "Users can insert own profile"
  on public.profiles for insert to authenticated
  with check (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update to authenticated
  using (auth.uid() = id);

create policy "Projects readable by authenticated users"
  on public.projects for select to authenticated using (true);

create policy "Authenticated users can create projects"
  on public.projects for insert to authenticated
  with check (auth.uid() = owner_id);

create policy "Owners can update projects"
  on public.projects for update to authenticated
  using (auth.uid() = owner_id);

create policy "Tasks readable by authenticated users"
  on public.tasks for select to authenticated using (true);

create policy "Authenticated users can create tasks"
  on public.tasks for insert to authenticated
  with check (auth.uid() = created_by);

create policy "Task creators and assignees can update tasks"
  on public.tasks for update to authenticated
  using (auth.uid() = created_by or auth.uid() = assignee_id or auth.uid() in (
    select owner_id from public.projects where id = project_id
  ));

create policy "Users can read own notifications"
  on public.notifications for select to authenticated
  using (auth.uid() = user_id);

create policy "Users can update own notifications"
  on public.notifications for update to authenticated
  using (auth.uid() = user_id);

create policy "Users can insert own notifications"
  on public.notifications for insert to authenticated
  with check (auth.uid() = user_id);

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
