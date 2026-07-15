-- Motivation features: due dates, project targets, in-app notifications

alter table public.projects
  add column if not exists target_date timestamptz null;

alter table public.tasks
  add column if not exists due_date timestamptz null;

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

alter table public.notifications enable row level security;

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
