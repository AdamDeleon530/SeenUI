-- Migration 011: Review URL per tenant
-- Used in {{review_url}} email template variable

alter table public.tenant_settings
  add column if not exists review_url text;
