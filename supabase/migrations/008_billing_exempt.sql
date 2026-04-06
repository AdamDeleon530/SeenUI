-- Migration 008: Billing exempt flag for internal/test accounts

alter table public.tenants
  add column if not exists is_billing_exempt boolean not null default false;

-- Set your account to agency, exempt from billing
-- Replace with your actual tenant_id from the tenants table
-- Run this after applying the migration:
-- update public.tenants set plan = 'agency', subscription_status = 'active', is_billing_exempt = true where id = 'YOUR_TENANT_ID';
