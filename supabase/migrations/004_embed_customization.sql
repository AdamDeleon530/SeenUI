-- Add custom placeholder for the requested service free-text field.
-- Used when no services are configured (widget falls back to this instead of "e.g. Botox, Facial...")
alter table public.tenant_settings
  add column if not exists requested_service_placeholder text not null default 'e.g. Botox, Facial...';
