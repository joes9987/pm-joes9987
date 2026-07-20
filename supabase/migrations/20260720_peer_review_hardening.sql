-- Peer review hardening: completed_at for on-time metrics, difficulty anti-farming, trigger updates.

alter table public.tasks add column if not exists completed_at timestamptz;

update public.tasks
set completed_at = updated_at
where status = 'done' and completed_at is null;

create or replace function public.enforce_task_difficulty()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  project_owner uuid;
begin
  select owner_id into project_owner
  from public.projects
  where id = new.project_id;

  if tg_op = 'UPDATE' and old.status = 'done' then
    new.difficulty := old.difficulty;
  end if;

  if new.difficulty <> 'low'::public.task_difficulty
    and auth.uid() is distinct from project_owner
  then
    raise exception 'Only the project owner can set difficulty above Low (10 pts)';
  end if;

  return new;
end;
$$;

create or replace function public.set_task_completed_at()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'done'::public.task_status
    and old.status is distinct from 'done'::public.task_status
  then
    new.completed_at := coalesce(new.completed_at, now());
  elsif new.status is distinct from 'done'::public.task_status
    and old.status = 'done'::public.task_status
  then
    new.completed_at := null;
  end if;

  return new;
end;
$$;

drop trigger if exists enforce_task_difficulty on public.tasks;
create trigger enforce_task_difficulty
  before insert or update of difficulty, project_id on public.tasks
  for each row execute function public.enforce_task_difficulty();

drop trigger if exists set_task_completed_at on public.tasks;
create trigger set_task_completed_at
  before update of status on public.tasks
  for each row execute function public.set_task_completed_at();

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

  recipient := coalesce(new.assignee_id, new.created_by);
  if recipient is null then
    return new;
  end if;

  pts := public.difficulty_points(new.difficulty);

  insert into public.point_events (user_id, task_id, points, difficulty, awarded_at)
  values (recipient, new.id, pts, new.difficulty, coalesce(new.completed_at, now()))
  on conflict (task_id) do update
    set user_id = excluded.user_id,
        points = excluded.points,
        difficulty = excluded.difficulty,
        awarded_at = case
          when public.point_events.user_id is distinct from excluded.user_id
            or public.point_events.points is distinct from excluded.points
            or public.point_events.difficulty is distinct from excluded.difficulty
          then excluded.awarded_at
          else public.point_events.awarded_at
        end;

  return new;
end;
$$;
