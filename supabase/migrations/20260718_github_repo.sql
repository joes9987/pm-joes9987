-- Link a GitHub repository to a project (stored as "owner/repo").
alter table public.projects add column if not exists github_repo text;
