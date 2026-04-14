-- Migration 009: Email Sequences (drip campaigns)

-- Sequence definitions
create table if not exists public.email_sequences (
  id            uuid primary key default gen_random_uuid(),
  tenant_id     uuid not null references public.tenants(id) on delete cascade,
  name          text not null,
  description   text,
  trigger_status text,           -- optional: auto-enroll when lead reaches this status
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Steps within a sequence
create table if not exists public.sequence_steps (
  id           uuid primary key default gen_random_uuid(),
  sequence_id  uuid not null references public.email_sequences(id) on delete cascade,
  step_order   int not null default 0,
  delay_days   int not null default 1,        -- days after enrollment (step 1) or prior step completion
  template_id  uuid references public.email_templates(id) on delete set null,
  subject      text,                          -- used if no template
  body_html    text,
  body_text    text,
  created_at   timestamptz not null default now()
);

-- Lead enrollments
create table if not exists public.sequence_enrollments (
  id            uuid primary key default gen_random_uuid(),
  tenant_id     uuid not null references public.tenants(id) on delete cascade,
  sequence_id   uuid not null references public.email_sequences(id) on delete cascade,
  lead_id       uuid not null references public.leads(id) on delete cascade,
  current_step  int not null default 0,
  status        text not null default 'active' check (status in ('active','completed','canceled','paused')),
  enrolled_at   timestamptz not null default now(),
  next_send_at  timestamptz,
  completed_at  timestamptz,
  unique(sequence_id, lead_id)   -- prevent duplicate enrollment in same sequence
);

-- Indexes
create index if not exists idx_email_sequences_tenant    on public.email_sequences(tenant_id);
create index if not exists idx_sequence_steps_sequence   on public.sequence_steps(sequence_id, step_order);
create index if not exists idx_sequence_enrollments_lead on public.sequence_enrollments(lead_id);
create index if not exists idx_sequence_enrollments_next on public.sequence_enrollments(next_send_at) where status = 'active';

-- RLS
alter table public.email_sequences    enable row level security;
alter table public.sequence_steps     enable row level security;
alter table public.sequence_enrollments enable row level security;

-- Allow service role full access (server-side only via admin client)
create policy "service_role_sequences"    on public.email_sequences    for all using (true);
create policy "service_role_steps"        on public.sequence_steps     for all using (true);
create policy "service_role_enrollments"  on public.sequence_enrollments for all using (true);
