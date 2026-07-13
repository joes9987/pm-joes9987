# Cohort PM — @joes9987

Project 1 submission for the Hult Cohort Summer Pilot 2026: a production project management platform for 30+ cohort members.

## Production URL

Set after Vercel deploy — see latest release or Vercel dashboard for `pm-joes9987`.

## Stack

- **Next.js 16** (App Router) on **Vercel**
- **Supabase** (Auth + Postgres + RLS)
- **TypeScript** + **Tailwind CSS**

## Architecture

```
Browser (React)
  → Supabase Auth (email/password, cookie session via @supabase/ssr)
  → Postgres (profiles, projects, tasks)
  → Row Level Security policies for authenticated cohort access
```

### Data model

| Table | Purpose |
|-------|---------|
| `profiles` | Cohort member display name + email (auto-created on signup) |
| `projects` | Named workspaces with archive flag |
| `tasks` | Title, description, status (`todo` / `in_progress` / `done`), assignee |

## Setup (fresh clone)

1. Clone and install:

```bash
git clone https://github.com/joes9987/pm-joes9987.git
cd pm-joes9987
npm install
```

2. Create a Supabase project (or use an existing one) and run `supabase/schema.sql` in the SQL editor.

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

7. Sign up, create a project, create and assign a task.

## Baseline features

- [x] Email/password auth (30+ accounts)
- [x] Projects: create, edit (description), archive/restore
- [x] Tasks: title, description, status workflow (3 states)
- [x] Assign tasks to any cohort member
- [x] Filter tasks by project, status, assignee
- [x] Public HTTPS deployment target (Vercel)

## Known limitations

- No email notifications or due dates (differentiator backlog)
- No GitHub issue/PR linking yet
- No review/vote module (planned differentiator for later projects)
- Email confirmation may need to be disabled in Supabase for frictionless reviewer access

## Agent usage

Built with Cursor Agent: scaffolded Next.js app, implemented Supabase schema + RLS, auth flows, project/task UI, and deployment docs. QA via fresh-clone setup checklist and auth smoke path.

## License

MIT
