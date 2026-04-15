-- Task 2 & 3: Scheduled Jobs
-- Powers review request delays and appointment reminders.

create table scheduled_jobs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  job_type text not null check (job_type in ('review_request', 'appointment_reminder', 'sequence_step')),
  payload jsonb not null,
  run_at timestamptz not null,
  status text default 'pending' check (status in ('pending', 'running', 'done', 'failed')),
  error text,
  created_at timestamptz default now()
);

create index on scheduled_jobs (status, run_at);

-- Task 2: review request config columns on tenant_settings
alter table tenant_settings
  add column if not exists review_request_delay_hours int default 24,
  add column if not exists review_request_sms_enabled boolean default false;
