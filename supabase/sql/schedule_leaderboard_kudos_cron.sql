-- Run AFTER deploying send-leaderboard-kudos and storing cron_secret in Vault.
-- Schedule: Mondays at 09:00 UTC (congratulates top 3 for the previous UTC week).
--
-- Prerequisites:
-- 1. pg_cron + pg_net enabled
-- 2. Vault secret cron_secret exists
-- 3. supabase functions deploy send-leaderboard-kudos --no-verify-jwt

select cron.unschedule(jobid)
from cron.job
where jobname = 'send-leaderboard-kudos-weekly';

select cron.schedule(
  'send-leaderboard-kudos-weekly',
  '0 9 * * 1',
  $$
  select net.http_post(
    url := 'https://vidprovlxevofniwyhgs.supabase.co/functions/v1/send-leaderboard-kudos',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret')
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 60000
  ) as request_id;
  $$
);
