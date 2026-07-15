-- Run AFTER deploying the Edge Function and storing secrets in Vault.
-- Schedule: daily at 08:00 UTC (adjust cron expression as needed).
--
-- Prerequisites:
-- 1. Enable extensions: pg_cron, pg_net (Dashboard → Database → Extensions)
-- 2. Store cron secret in Vault:
--      select vault.create_secret('YOUR_CRON_SECRET', 'cron_secret');
-- 3. Deploy function:
--      supabase functions deploy send-deadline-reminders --no-verify-jwt
-- 4. Set Edge Function secrets (BREVO_API_KEY, BREVO_SENDER_EMAIL, CRON_SECRET, APP_URL)

-- Remove existing job if re-running this script
select cron.unschedule(jobid)
from cron.job
where jobname = 'send-deadline-reminders-daily';

select cron.schedule(
  'send-deadline-reminders-daily',
  '0 8 * * *',
  $$
  select net.http_post(
    url := 'https://vidprovlxevofniwyhgs.supabase.co/functions/v1/send-deadline-reminders',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret')
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 60000
  ) as request_id;
  $$
);
