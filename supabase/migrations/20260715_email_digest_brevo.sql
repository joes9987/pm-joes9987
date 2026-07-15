-- Daily email digest idempotency log (Edge Function writes via service role)

create table if not exists public.email_sent_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  digest_date date not null,
  sent_at timestamptz not null default now(),
  brevo_message_id text,
  unique (user_id, digest_date)
);

create index if not exists email_sent_log_digest_date_idx on public.email_sent_log (digest_date);

alter table public.email_sent_log enable row level security;

-- No policies: only service role (Edge Function) should read/write this table.
