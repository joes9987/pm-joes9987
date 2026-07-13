# AGENTS.md — pm-joes9987

## Project

Hult Cohort Project 1: PM platform for 30+ students tracking projects, tasks, and assignments.

## Agent roles used

| Role | Tool | Work |
|------|------|------|
| Research | Cursor | Requirements from `hult-cohort-program/curriculum/phase-1/project-1-pm-platform/` |
| Development | Cursor | Next.js + Supabase implementation |
| QA | Cursor | Fresh-clone setup, auth signup, project/task CRUD smoke path |

## Conventions

- Small focused commits; one concern per commit
- No secrets in repo; `.env.local` gitignored
- PR descriptions include summary, test plan, deploy URL

## Deploy

Vercel project linked to this repo. Supabase env vars required in Vercel dashboard.
