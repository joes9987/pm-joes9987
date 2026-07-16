-- Harden UPDATE policies with WITH CHECK to prevent ownership column tampering.

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles for update to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "Owners can update projects" on public.projects;
create policy "Owners can update projects"
  on public.projects for update to authenticated
  using (auth.uid() = owner_id)
  with check (
    auth.uid() = owner_id
    and owner_id is not distinct from (
      select p.owner_id from public.projects p where p.id = projects.id
    )
  );

drop policy if exists "Task creators and assignees can update tasks" on public.tasks;
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

drop policy if exists "Users can update own notifications" on public.notifications;
create policy "Users can update own notifications"
  on public.notifications for update to authenticated
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and user_id is not distinct from (
      select n.user_id from public.notifications n where n.id = notifications.id
    )
  );
