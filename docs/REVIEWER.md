# Reviewer guide — EudaPM

Production: https://pm-joes9987.vercel.app

## Fastest path (recommended)

Signup is open for cohort reviewers — no invite code required.

1. Visit `/signup` and create an account (any email works; confirmation is disabled).
2. Create a project on **Projects** (optionally link a public GitHub repo).
3. Add and assign tasks on **Dashboard**; try **Search**, **Progress**, and **Comments**.

## Shared demo workspace (optional)

If you prefer not to create a new account, use the read-only demo login:

| Field | Value |
|-------|-------|
| Email | `eudapm-reviewer@example.com` |
| Password | `EudaPM-Review-2026` |

The demo account includes a sample project with tasks and a linked GitHub repo. You can explore the dashboard, search, progress page, and repo activity feed without mutating your own data.

To refresh the demo workspace after schema changes:

```bash
# From repo root, with Supabase service role in env:
# SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
node scripts/seed-reviewer-demo.mjs
```

## What to verify

| Area | Where |
|------|-------|
| Marketing home + auth | `/`, `/login`, `/signup`, forgot password |
| Projects + GitHub link | `/projects` → edit → GitHub repo → **Activity** |
| Tasks + filters | `/dashboard` |
| Search | `/search` |
| Leaderboard | `/progress` |
| Live sync | Two browsers on `/dashboard` (optional) |

## Notes

- GitHub activity requires sign-in (API is session-gated).
- Difficulty points: only the **project owner** can set Mid (25) or High (50); others default to Low (10).
- Email digests (Brevo) are optional infra — see `docs/BREVO_EMAIL_SETUP.md`.
