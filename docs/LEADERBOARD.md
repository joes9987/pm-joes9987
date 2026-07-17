# Difficulty points + leaderboard

Gamification for EudaPM: tasks have difficulty, completed tasks award points, and the Progress page shows a live leaderboard. Top 3 weekly earners get a Brevo kudos email each Monday.

## Scoring

| Difficulty | Points |
|------------|--------|
| Low | 10 |
| Mid | 25 |
| High | 50 |

Points are awarded to the **assignee** (or the completer / creator if unassigned) when a task status becomes `done`. Leaving `done` removes the award. Changing difficulty or assignee on a completed task updates the ledger.

## Schema

- `tasks.difficulty` — `low` \| `mid` \| `high`
- `point_events` — one row per awarded task (`unique(task_id)`)
- `leaderboard_kudos_log` — idempotency for weekly emails (`week_start` UTC Monday)

Migration: `supabase/migrations/20260716_task_difficulty_points.sql`

## Dashboard

`Leaderboard` on `/dashboard` shows all-time points + this week’s points (UTC week starting Monday). It subscribes to Realtime `postgres_changes` on `point_events`.

## Weekly kudos email

```
pg_cron (Monday 09:00 UTC)
  → Edge Function send-leaderboard-kudos
    → Aggregate point_events for previous UTC week
    → Brevo email to top 3
    → leaderboard_kudos_log
```

### Deploy

```powershell
supabase functions deploy send-leaderboard-kudos --no-verify-jwt
supabase db query --linked -f supabase/sql/schedule_leaderboard_kudos_cron.sql
```

Reuses existing Edge Function secrets: `BREVO_API_KEY`, `BREVO_SENDER_EMAIL`, `CRON_SECRET`, `APP_URL`.

### Manual test

```powershell
curl.exe -s -X POST "https://vidprovlxevofniwyhgs.supabase.co/functions/v1/send-leaderboard-kudos" `
  -H "Content-Type: application/json" `
  -H "x-cron-secret: YOUR_CRON_SECRET"
```
