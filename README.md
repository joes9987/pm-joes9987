# EudaPM — @joes9987

Project 1 submission for the Hult Cohort Summer Pilot 2026: a production project management platform for 30+ cohort members.

**Product name:** EudaPM (repo / Vercel hostname remain `pm-joes9987`).

## Production URL

https://pm-joes9987.vercel.app

## Stack

- **Next.js 16** (App Router) on **Vercel**
- **Supabase** (Auth + Postgres + RLS + Realtime)
- **TypeScript** + **Tailwind CSS**
- **Brevo** for transactional email digests

## Architecture

```
Browser (React)
  → Supabase Auth (email/password, cookie session via @supabase/ssr)
  → Postgres (profiles, projects, tasks, task_comments, notifications, point_events)
  → Row Level Security policies for authenticated cohort access
  → Realtime on tasks, notifications, task_comments, point_events
  → DB triggers for assignment/completion notifications + points
```

### Data model

| Table | Purpose |
|-------|---------|
| `profiles` | Cohort member display name + email (auto-created on signup) |
| `projects` | Named workspaces with archive flag and optional `target_date` |
| `tasks` | Title, description, status, assignee, difficulty, optional `due_date`, soft-delete via `deleted_at` |
| `task_comments` | Per-task activity thread |
| `notifications` | In-app alerts (assigned, due soon, overdue, completed) |
| `point_events` | Points awarded on task completion |

## Setup (fresh clone)

1. Clone and install:

```bash
git clone https://github.com/joes9987/pm-joes9987.git
cd pm-joes9987
npm install
```

2. Create a Supabase project (or use an existing one) and run:
   - `supabase/schema.sql` for fresh installs, **or**
   - apply migrations in order if upgrading an existing database

3. Copy the committed env template:

```bash
cp .env.example .env.local
```

4. Fill in:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

Optional: set `GITHUB_TOKEN` (a fine-grained personal access token, no scopes needed for public repos) to raise the GitHub API rate limit for the repo activity feed from 60 to 5,000 requests/hour.

5. In Supabase Auth settings, disable email confirmation for review-week smoke tests (optional).

6. Run locally:

```bash
npm run dev
```

7. Sign up, create a project (optionally set a target deadline), create and assign a task with a due date. Edit projects and reassign tasks after creation on **Projects** and **Dashboard**.

## Baseline features

- [x] Email/password auth (30+ accounts)
- [x] Projects: create, edit (name, description, target date), archive/restore
- [x] Tasks: title, description, status workflow (3 states); edit and reassign after creation
- [x] Assign tasks to any cohort member
- [x] Filter tasks by project, status, assignee
- [x] Public HTTPS deployment target (Vercel)

## Differentiating features

- [x] **Due dates** with urgency badges (overdue, due today, due soon)
- [x] **In-app notifications** + Realtime updates
- [x] **Motivation strip** — Focus today, completion, on-time rates
- [x] **Progress page** — per-project metrics + live leaderboard
- [x] **Difficulty points + leaderboard** — Low/Mid/High (10/25/50 pts); weekly top-3 kudos email
- [x] **Email digests (Brevo)** — daily overdue/today/tomorrow reminders
- [x] **Global search** — tasks + projects (`/search`)
- [x] **Task comments** — threaded activity under each task
- [x] **Soft-delete tasks** — delete/restore with “Show deleted”
- [x] **Profile settings** — display name (`/settings`)
- [x] **Live TaskBoard** — Realtime merges for insert/update/delete
- [x] **GitHub repo tracking** — link a public repo to a project; commits, PRs, and issues surface on Projects and the Dashboard (cached 5 min)

## Email digest setup

See [docs/BREVO_EMAIL_SETUP.md](docs/BREVO_EMAIL_SETUP.md) for Brevo account, Edge Function deploy, and pg_cron schedule.

## Leaderboard setup

See [docs/LEADERBOARD.md](docs/LEADERBOARD.md) for difficulty scoring, Realtime leaderboard, and weekly kudos emails.

## Known limitations

- Email digests require Brevo sender verification and Supabase Edge Function secrets (not auto-configured on clone)
- No GitHub issue/PR linking yet
- No review/vote module (planned differentiator for later projects)
- No invite-only signup / Kanban / calendar views yet
- Email confirmation may need to be disabled in Supabase for frictionless reviewer access

## Agent usage

Built with Cursor Agent: scaffolded Next.js app, implemented Supabase schema + RLS, auth flows, project/task UI, motivation features, Brevo digests, gamification, and the EudaPM product pass (search, comments, soft-delete, settings, live sync).

## License

MIT
