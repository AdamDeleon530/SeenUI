-- Task 1: SMS via Twilio
-- Stores all SMS messages (inbound and outbound) per lead.

create table sms_messages (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  lead_id uuid not null references leads(id) on delete cascade,
  direction text not null check (direction in ('outbound', 'inbound')),
  body text not null,
  from_number text not null,
  to_number text not null,
  twilio_sid text,
  status text default 'sent' check (status in ('sent', 'delivered', 'failed', 'received')),
  is_read boolean default false,
  sent_at timestamptz default now(),
  created_at timestamptz default now()
);

create index on sms_messages (lead_id);
create index on sms_messages (tenant_id, is_read);
