-- Extended widget styling options
alter table public.tenant_settings
  add column if not exists embed_border_radius    integer not null default 10,
  add column if not exists embed_font_family      text    not null default 'Inter',
  add column if not exists embed_background_color text    not null default '#ffffff',
  add column if not exists embed_text_color       text    not null default '#111827',
  add column if not exists embed_label_color      text    not null default '#374151',
  add column if not exists embed_input_border_color text  not null default '#d1d5db';
