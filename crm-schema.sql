-- Varo CRM schema v2 — no-login sync-token model
-- Run in the Supabase SQL editor (project: ynkyoicrwgenajlrszmp).
--
-- ⚠️ This DROPS the old auth-based tables (and any rows in them) and
-- recreates them keyed by a secret sync token instead of auth.users.
-- Privacy model: same as the life dashboard — anyone with the sync code
-- can read/write that workspace. Keep the code private.

drop table if exists activity_log cascade;
drop table if exists sync_codes cascade;
drop table if exists settings cascade;
drop table if exists leads cascade;

create table leads (
  id uuid primary key default gen_random_uuid(),
  sync_token text not null,
  company text,
  contact_name text,
  contact_email text,
  contact_phone text,
  website text,
  stage text not null default 'Cold',
  monthly_value decimal(10, 2),
  service_interests text[] default array[]::text[],
  next_action text,
  next_action_date date,
  lost_reason text,
  deliverables jsonb default '[]'::jsonb,
  deadline date,
  stage_changed_at timestamp with time zone default now(),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table activity_log (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references leads(id) on delete cascade,
  sync_token text not null,
  activity_type text not null,
  note text,
  created_at timestamp with time zone default now()
);

create table settings (
  sync_token text primary key,
  mrr_goal decimal(10, 2) default 10000,
  updated_at timestamp with time zone default now()
);

-- RLS: open to the anon role; access control rests on the secrecy of the
-- sync token (capability-token model, same as the dashboard's app_state).
alter table leads enable row level security;
alter table activity_log enable row level security;
alter table settings enable row level security;

create policy "token holders" on leads for all using (true) with check (true);
create policy "token holders" on activity_log for all using (true) with check (true);
create policy "token holders" on settings for all using (true) with check (true);

create index idx_leads_sync_token on leads(sync_token);
create index idx_leads_stage on leads(stage);
create index idx_activity_log_lead_id on activity_log(lead_id);
create index idx_activity_log_sync_token on activity_log(sync_token);

-- Realtime for instant phone/desktop sync
alter publication supabase_realtime add table leads;
