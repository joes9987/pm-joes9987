-- EudaPM product pass: soft-delete, comments, realtime for tasks/notifications

alter table public.tasks
  add column if not exists deleted_at timestamptz;

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

alter table public.task_comments enable row level security;

drop policy if exists "Comments readable by authenticated users" on public.task_comments;
create policy "Comments readable by authenticated users"
  on public.task_comments for select to authenticated using (true);

drop policy if exists "Authors can insert comments" on public.task_comments;
create policy "Authors can insert comments"
  on public.task_comments for insert to authenticated
  with check (auth.uid() = author_id);

drop policy if exists "Authors can update own comments" on public.task_comments;
create policy "Authors can update own comments"
  on public.task_comments for update to authenticated
  using (auth.uid() = author_id)
  with check (auth.uid() = author_id);

drop policy if exists "Authors can delete own comments" on public.task_comments;
create policy "Authors can delete own comments"
  on public.task_comments for delete to authenticated
  using (auth.uid() = author_id);

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
  end if;
end $$;
