-- Migration 007: Stripe billing

alter table public.tenants
  add column if not exists stripe_customer_id      text unique,
  add column if not exists stripe_subscription_id  text unique,
  add column if not exists subscription_status     text not null default 'trialing'
    check (subscription_status in ('trialing', 'active', 'past_due', 'canceled', 'incomplete', 'paused')),
  add column if not exists plan                    text not null default 'trial'
    check (plan in ('trial', 'starter', 'pro', 'agency')),
  add column if not exists plan_interval           text
    check (plan_interval in ('monthly', 'annual')),
  add column if not exists trial_ends_at           timestamptz not null default (now() + interval '14 days'),
  add column if not exists current_period_ends_at  timestamptz;

-- Index for webhook lookups
create index if not exists tenants_stripe_customer_idx on public.tenants(stripe_customer_id);
create index if not exists tenants_stripe_sub_idx      on public.tenants(stripe_subscription_id);
