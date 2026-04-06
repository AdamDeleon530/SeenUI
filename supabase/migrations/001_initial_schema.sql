-- =============================================================================
-- LOCAL BOOKING ENGINE — Initial Schema
-- =============================================================================
-- Multi-tenant architecture. Every table that contains tenant data has a
-- tenant_id column. Row-Level Security (RLS) policies enforce isolation.
-- The service role key bypasses RLS for server-side admin operations.
-- =============================================================================

-- Enable required extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pg_trgm"; -- for text search on leads

-- =============================================================================
-- AGENCIES
-- Top-level entity for agency admin users who manage multiple clients
-- =============================================================================
create table public.agencies (
  id             uuid primary key default uuid_generate_v4(),
  name           text not null,
  slug           text not null unique,
  logo_url       text,
  owner_user_id  uuid references auth.users(id) on delete set null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- =============================================================================
-- TENANTS
-- Each tenant = one business (med spa, salon, etc.)
-- =============================================================================
create table public.tenants (
  id                  uuid primary key default uuid_generate_v4(),
  name                text not null,
  slug                text not null unique,
  logo_url            text,
  website_domain      text,
  notification_email  text,
  timezone            text not null default 'America/New_York',
  plan                text not null default 'trial' check (plan in ('trial', 'starter', 'pro', 'agency')),
  status              text not null default 'active' check (status in ('active', 'suspended', 'cancelled')),
  agency_id           uuid references public.agencies(id) on delete set null,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- =============================================================================
-- TENANT SETTINGS
-- Per-tenant configuration for forms, embed, and email workflows
-- =============================================================================
create table public.tenant_settings (
  id                              uuid primary key default uuid_generate_v4(),
  tenant_id                       uuid not null unique references public.tenants(id) on delete cascade,
  business_hours                  jsonb,
  booking_form_fields             jsonb not null default '[]'::jsonb,
  embed_primary_color             text not null default '#6172f3',
  embed_button_text               text not null default 'Book a Consultation',
  embed_heading                   text not null default 'Request an Appointment',
  embed_subheading                text,
  confirmation_email_enabled      boolean not null default true,
  follow_up_email_enabled         boolean not null default true,
  review_request_email_enabled    boolean not null default true,
  review_request_delay_hours      integer not null default 24,
  created_at                      timestamptz not null default now(),
  updated_at                      timestamptz not null default now()
);

-- =============================================================================
-- USER PROFILES
-- Extends auth.users with app-specific fields and tenant context
-- =============================================================================
create table public.user_profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text,
  avatar_url  text,
  role        text not null default 'staff' check (role in ('agency_admin', 'business_owner', 'staff')),
  tenant_id   uuid references public.tenants(id) on delete set null,
  agency_id   uuid references public.agencies(id) on delete set null,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- =============================================================================
-- AGENCY <> TENANT MEMBERSHIPS
-- Links agency accounts to the client tenants they manage
-- =============================================================================
create table public.agency_tenant_memberships (
  id          uuid primary key default uuid_generate_v4(),
  agency_id   uuid not null references public.agencies(id) on delete cascade,
  tenant_id   uuid not null references public.tenants(id) on delete cascade,
  created_at  timestamptz not null default now(),
  unique(agency_id, tenant_id)
);

-- =============================================================================
-- SERVICES
-- Service catalog per tenant (used as options in booking forms)
-- =============================================================================
create table public.services (
  id          uuid primary key default uuid_generate_v4(),
  tenant_id   uuid not null references public.tenants(id) on delete cascade,
  name        text not null,
  description text,
  duration_minutes integer,
  is_active   boolean not null default true,
  order_index integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- =============================================================================
-- PIPELINE STAGES
-- Kanban columns — seeded with defaults, customizable per tenant
-- =============================================================================
create table public.pipeline_stages (
  id          uuid primary key default uuid_generate_v4(),
  tenant_id   uuid not null references public.tenants(id) on delete cascade,
  name        text not null,
  color       text not null default '#6172f3',
  order_index integer not null default 0,
  is_default  boolean not null default false,  -- new leads land in the default stage
  is_terminal boolean not null default false,  -- won/lost stages
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Only one default stage per tenant
create unique index pipeline_stages_one_default_per_tenant
  on public.pipeline_stages(tenant_id)
  where is_default = true;

-- =============================================================================
-- TAGS
-- Reusable labels per tenant for organizing leads
-- =============================================================================
create table public.tags (
  id          uuid primary key default uuid_generate_v4(),
  tenant_id   uuid not null references public.tenants(id) on delete cascade,
  name        text not null,
  color       text not null default '#6172f3',
  created_at  timestamptz not null default now(),
  unique(tenant_id, name)
);

-- =============================================================================
-- LEADS
-- Core entity — a captured lead / booking request
-- =============================================================================
create table public.leads (
  id                          uuid primary key default uuid_generate_v4(),
  tenant_id                   uuid not null references public.tenants(id) on delete cascade,

  -- Contact
  full_name                   text not null,
  email                       text not null,
  phone                       text,

  -- Request
  requested_service           text,
  preferred_date              date,
  preferred_time              text,  -- HH:MM stored as text
  notes                       text,

  -- Pipeline
  status                      text not null default 'new' check (
    status in ('new', 'contacted', 'consultation_scheduled', 'booked', 'no_show', 'won', 'lost')
  ),
  stage_id                    uuid references public.pipeline_stages(id) on delete set null,
  assigned_to                 uuid references auth.users(id) on delete set null,

  -- Attribution
  source                      text not null default 'website_form' check (
    source in ('website_form', 'embed_widget', 'manual', 'referral', 'google', 'instagram', 'facebook', 'other')
  ),
  source_page                 text,
  referring_url               text,
  utm_source                  text,
  utm_medium                  text,
  utm_campaign                text,
  utm_content                 text,
  utm_term                    text,

  -- Appointment tracking
  consultation_scheduled_at   timestamptz,
  booked_appointment_at       timestamptz,
  appointment_completed_at    timestamptz,

  -- Meta
  is_archived                 boolean not null default false,
  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now()
);

-- Indexes for common query patterns
create index leads_tenant_id_idx           on public.leads(tenant_id);
create index leads_tenant_status_idx       on public.leads(tenant_id, status);
create index leads_tenant_stage_idx        on public.leads(tenant_id, stage_id);
create index leads_tenant_created_at_idx   on public.leads(tenant_id, created_at desc);
create index leads_tenant_email_idx        on public.leads(tenant_id, email);

-- Full text search index
create index leads_fts_idx on public.leads
  using gin(to_tsvector('english', coalesce(full_name, '') || ' ' || coalesce(email, '') || ' ' || coalesce(phone, '')));

-- =============================================================================
-- LEAD TAGS (join table)
-- =============================================================================
create table public.lead_tags (
  lead_id     uuid not null references public.leads(id) on delete cascade,
  tag_id      uuid not null references public.tags(id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (lead_id, tag_id)
);

-- =============================================================================
-- LEAD ACTIVITIES
-- Immutable timeline of events for each lead
-- =============================================================================
create table public.lead_activities (
  id          uuid primary key default uuid_generate_v4(),
  tenant_id   uuid not null references public.tenants(id) on delete cascade,
  lead_id     uuid not null references public.leads(id) on delete cascade,
  user_id     uuid references auth.users(id) on delete set null,  -- null = system event
  type        text not null check (
    type in (
      'lead_created', 'status_changed', 'note_added', 'email_sent',
      'appointment_scheduled', 'appointment_completed', 'tag_added',
      'tag_removed', 'field_updated'
    )
  ),
  description text not null,
  metadata    jsonb,
  created_at  timestamptz not null default now()
);

create index lead_activities_lead_id_idx on public.lead_activities(lead_id, created_at desc);

-- =============================================================================
-- LEAD NOTES
-- Internal staff notes attached to a lead (editable, unlike activities)
-- =============================================================================
create table public.lead_notes (
  id          uuid primary key default uuid_generate_v4(),
  tenant_id   uuid not null references public.tenants(id) on delete cascade,
  lead_id     uuid not null references public.leads(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete restrict,
  content     text not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index lead_notes_lead_id_idx on public.lead_notes(lead_id, created_at desc);

-- =============================================================================
-- EMAIL TEMPLATES
-- Per-tenant email content, seeded with defaults on tenant creation
-- =============================================================================
create table public.email_templates (
  id              uuid primary key default uuid_generate_v4(),
  tenant_id       uuid not null references public.tenants(id) on delete cascade,
  type            text not null check (
    type in (
      'lead_confirmation', 'lead_notification', 'follow_up',
      'consultation_reminder', 'appointment_reminder', 'review_request'
    )
  ),
  subject         text not null,
  body_html       text not null,
  body_text       text not null,
  is_enabled      boolean not null default true,
  trigger_status  text,  -- lead status that triggers this template
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique(tenant_id, type)
);

-- =============================================================================
-- EMAIL SENDS
-- Audit log of all emails sent through the system
-- =============================================================================
create table public.email_sends (
  id              uuid primary key default uuid_generate_v4(),
  tenant_id       uuid not null references public.tenants(id) on delete cascade,
  lead_id         uuid references public.leads(id) on delete set null,
  template_type   text not null,
  to_email        text not null,
  to_name         text,
  subject         text not null,
  status          text not null default 'queued' check (status in ('queued', 'sent', 'failed', 'skipped')),
  error_message   text,
  sent_at         timestamptz,
  created_at      timestamptz not null default now()
);

create index email_sends_tenant_id_idx on public.email_sends(tenant_id, created_at desc);
create index email_sends_lead_id_idx   on public.email_sends(lead_id);

-- =============================================================================
-- UPDATED_AT TRIGGER FUNCTION
-- Automatically updates updated_at on row modification
-- =============================================================================
create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Apply updated_at trigger to all relevant tables
create trigger tenants_updated_at            before update on public.tenants            for each row execute function public.handle_updated_at();
create trigger tenant_settings_updated_at    before update on public.tenant_settings    for each row execute function public.handle_updated_at();
create trigger user_profiles_updated_at      before update on public.user_profiles      for each row execute function public.handle_updated_at();
create trigger agencies_updated_at           before update on public.agencies           for each row execute function public.handle_updated_at();
create trigger services_updated_at           before update on public.services           for each row execute function public.handle_updated_at();
create trigger pipeline_stages_updated_at    before update on public.pipeline_stages    for each row execute function public.handle_updated_at();
create trigger leads_updated_at              before update on public.leads              for each row execute function public.handle_updated_at();
create trigger lead_notes_updated_at         before update on public.lead_notes         for each row execute function public.handle_updated_at();
create trigger email_templates_updated_at    before update on public.email_templates    for each row execute function public.handle_updated_at();

-- =============================================================================
-- AUTO-CREATE USER PROFILE ON SIGNUP
-- Triggered by Supabase Auth on new user creation
-- =============================================================================
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.user_profiles (id, full_name, email)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.email
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- Note: email column added for convenience — not stored in user_profiles table above
-- (profile joins auth.users for email). Remove 'email' if not needed.
-- Actually: store it in profile for easy joins without auth.users access
alter table public.user_profiles add column if not exists email text;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
