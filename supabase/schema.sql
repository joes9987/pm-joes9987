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
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists tasks_project_id_idx on public.tasks (project_id);
create index if not exists tasks_assignee_id_idx on public.tasks (assignee_id);
create index if not exists tasks_status_idx on public.tasks (status);

alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.tasks enable row level security;

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
