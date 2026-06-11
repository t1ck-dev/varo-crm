-- Create leads table
create table leads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  company text not null,
  contact_name text,
  contact_email text,
  contact_phone text,
  website text,
  stage text not null default 'Cold',
  monthly_value decimal(10, 2) default 0,
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

-- Create activity_log table for touchpoints
create table activity_log (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references leads(id) on delete cascade,
  activity_type text not null,
  note text,
  created_at timestamp with time zone default now()
);

-- Create settings table
create table settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  mrr_goal decimal(10, 2) default 10000,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Enable RLS
alter table leads enable row level security;
alter table activity_log enable row level security;
alter table settings enable row level security;

-- RLS policies
create policy "Users can view their own leads" on leads
  for select using (auth.uid() = user_id);

create policy "Users can insert their own leads" on leads
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own leads" on leads
  for update using (auth.uid() = user_id);

create policy "Users can delete their own leads" on leads
  for delete using (auth.uid() = user_id);

create policy "Users can view activity logs for their leads" on activity_log
  for select using (
    exists (select 1 from leads where leads.id = activity_log.lead_id and leads.user_id = auth.uid())
  );

create policy "Users can insert activity logs for their leads" on activity_log
  for insert with check (
    exists (select 1 from leads where leads.id = activity_log.lead_id and leads.user_id = auth.uid())
  );

create policy "Users can manage their own settings" on settings
  for all using (auth.uid() = user_id);

-- Create indexes for performance
create index idx_leads_user_id on leads(user_id);
create index idx_leads_stage on leads(stage);
create index idx_activity_log_lead_id on activity_log(lead_id);
create index idx_settings_user_id on settings(user_id);
