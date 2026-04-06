-- Migration 006: Email sending domain per tenant
-- Allows each tenant to verify their own domain in Resend for authenticated email delivery

alter table public.tenant_settings
  add column if not exists email_from_name         text,
  add column if not exists email_from_address      text,
  add column if not exists resend_domain_id        text,
  add column if not exists email_domain_status     text not null default 'unverified'
    check (email_domain_status in ('unverified', 'pending', 'verified', 'failed'));
