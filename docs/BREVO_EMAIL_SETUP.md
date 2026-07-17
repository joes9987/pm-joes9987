# Brevo email digest setup

Daily deadline reminder emails via **Supabase Edge Function + Brevo API + pg_cron**.

Weekly leaderboard kudos (top 3) use the same Brevo secrets — see [LEADERBOARD.md](./LEADERBOARD.md).

## Architecture

```
pg_cron (08:00 UTC daily)
  → Edge Function send-deadline-reminders
  → Postgres (tasks, profiles, email_sent_log)
  → Brevo API (transactional email)
  → User inbox
```

## 1. Create a Brevo account

1. Sign up at [brevo.com](https://www.brevo.com)
2. Go to **Transactional → Email → Senders** and add a verified sender email  
   (e.g. `noreply@yourdomain.com` or Brevo’s sandbox sender for testing)
3. Go to **SMTP & API → API Keys** and create a key with **Send emails** permission

Free tier: **300 emails/day** — more than enough for ~30 cohort members × 1 digest/day.

## 2. Apply database migration

```powershell
cd "c:\Users\Admin\Desktop\ai cohort\pm-joes9987"
supabase db query --linked -f supabase/migrations/20260715_email_digest_brevo.sql
```

Creates `email_sent_log` for idempotency (one digest per user per UTC day).

## 3. Set Edge Function secrets

Generate a random cron secret (e.g. `openssl rand -hex 32` or any long random string).

```powershell
supabase secrets set `
  BREVO_API_KEY="xkeysib-..." `
  BREVO_SENDER_EMAIL="noreply@yourdomain.com" `
  BREVO_SENDER_NAME="EudaPM" `
  CRON_SECRET="your-long-random-secret" `
  APP_URL="https://pm-joes9987.vercel.app"
```

`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are injected automatically in hosted Edge Functions.

## 4. Deploy the Edge Function

```powershell
supabase functions deploy send-deadline-reminders --no-verify-jwt
```

`--no-verify-jwt` is required because pg_cron calls the function with `x-cron-secret`, not a user JWT.

## 5. Test manually

```powershell
curl -i -X POST "https://vidprovlxevofniwyhgs.supabase.co/functions/v1/send-deadline-reminders" `
  -H "Content-Type: application/json" `
  -H "x-cron-secret: YOUR_CRON_SECRET"
```

Expected response:

```json
{
  "digestDate": "2026-07-15",
  "candidates": 2,
  "sent": 1,
  "skipped": 0,
  "failures": []
}
```

**Test checklist:**
- Create a task assigned to yourself with due date today or tomorrow
- Run the curl command above
- Check inbox (and Brevo → Transactional → Logs)
- Run again — same user should show `"skipped": 1` (idempotency)

## 6. Schedule daily cron (production)

1. In Supabase Dashboard → **Database → Extensions**, enable **pg_cron** and **pg_net**
2. Store the same cron secret in Vault:

```sql
select vault.create_secret('YOUR_CRON_SECRET', 'cron_secret');
```

3. Run the schedule script:

```powershell
supabase db query --linked -f supabase/sql/schedule_email_digest_cron.sql
```

Default schedule: **08:00 UTC daily**. Edit the cron expression in that file if you want a different time.

## 7. Verify cron job

```sql
select jobid, jobname, schedule, active from cron.job;
```

Check Edge Function logs in Supabase Dashboard → **Edge Functions → send-deadline-reminders → Logs**.

## Environment variables reference

| Secret | Required | Purpose |
|--------|----------|---------|
| `BREVO_API_KEY` | Yes | Brevo transactional API key |
| `BREVO_SENDER_EMAIL` | Yes | Verified sender address in Brevo |
| `BREVO_SENDER_NAME` | No | Display name (default: EudaPM) |
| `CRON_SECRET` | Yes | Auth header for cron + manual triggers |
| `APP_URL` | No | Dashboard link in email (default: production URL) |

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `401 Unauthorized` | `x-cron-secret` header doesn’t match `CRON_SECRET` secret |
| Brevo `401` | Invalid or revoked API key |
| Brevo sender error | Verify sender email/domain in Brevo dashboard |
| No emails sent, `candidates: 0` | No open tasks with due dates in overdue/today/tomorrow buckets |
| Duplicate emails | Check `email_sent_log`; cron should only run once daily |

## Local development (optional)

```powershell
supabase functions serve send-deadline-reminders --no-verify-jwt --env-file supabase/.env.local
```

Create `supabase/.env.local` (gitignored) with the same secrets for local testing.
