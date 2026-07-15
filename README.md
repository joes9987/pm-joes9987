# Cohort PM — @joes9987

Project 1 submission for the Hult Cohort Summer Pilot 2026: a production project management platform for 30+ cohort members.

## Production URL

https://pm-joes9987.vercel.app

## Stack

- **Next.js 16** (App Router) on **Vercel**
- **Supabase** (Auth + Postgres + RLS)
- **TypeScript** + **Tailwind CSS**

## Architecture

```
Browser (React)
  → Supabase Auth (email/password, cookie session via @supabase/ssr)
  → Postgres (profiles, projects, tasks, notifications)
  → Row Level Security policies for authenticated cohort access
  → DB triggers for assignment/completion notifications
```

### Data model

| Table | Purpose |
|-------|---------|
| `profiles` | Cohort member display name + email (auto-created on signup) |
| `projects` | Named workspaces with archive flag and optional `target_date` |
| `tasks` | Title, description, status, assignee, optional `due_date` |
| `notifications` | In-app alerts (assigned, due soon, overdue, completed) |

## Setup (fresh clone)

1. Clone and install:

```bash
git clone https://github.com/joes9987/pm-joes9987.git
cd pm-joes9987
npm install
```

2. Create a Supabase project (or use an existing one) and run:
   - `supabase/schema.sql` for fresh installs, **or**
   - `supabase/migrations/20260715_motivation_features.sql` if upgrading an existing database

3. Copy env template:

```bash
cp .env.example .env.local
```

4. Fill in:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

5. In Supabase Auth settings, disable email confirmation for review-week smoke tests (optional).

6. Run locally:

```bash
npm run dev
```

7. Sign up, create a project (optionally set a target deadline), create and assign a task with a due date.

## Baseline features

- [x] Email/password auth (30+ accounts)
- [x] Projects: create, edit (description), archive/restore
- [x] Tasks: title, description, status workflow (3 states)
- [x] Assign tasks to any cohort member
- [x] Filter tasks by project, status, assignee
- [x] Public HTTPS deployment target (Vercel)

## Differentiating features (motivation)

- [x] **Due dates** on tasks with urgency badges (overdue, due today, due soon)
- [x] **In-app notifications** on assignment, deadline proximity, and task completion
- [x] **Motivation dashboard** — Focus today, weekly due count, completion and on-time rates
- [x] **Progress page** — per-project completion bars, overdue counts, project deadline countdown
- [x] **Project target dates** — optional project-level deadline for goal tracking
- [x] **Quick filters** — My tasks, Overdue, Due this week
- [x] **Email digests (Brevo)** — daily overdue/today/tomorrow reminders via Supabase Edge Function

## Email digest setup

See [docs/BREVO_EMAIL_SETUP.md](docs/BREVO_EMAIL_SETUP.md) for Brevo account, Edge Function deploy, and pg_cron schedule.

## Known limitations

- Email digests require Brevo sender verification and Supabase Edge Function secrets (not auto-configured on clone)
- No GitHub issue/PR linking yet
- No review/vote module (planned differentiator for later projects)
- Email confirmation may need to be disabled in Supabase for frictionless reviewer access

## Agent usage

Built with Cursor Agent: scaffolded Next.js app, implemented Supabase schema + RLS, auth flows, project/task UI, motivation features (due dates, notifications, progress metrics), and deployment docs.

## License

MIT
