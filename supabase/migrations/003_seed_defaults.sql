-- =============================================================================
-- SEED FUNCTION: Provision a new tenant with defaults
-- Called server-side after tenant creation
-- =============================================================================

create or replace function public.provision_new_tenant(
  p_tenant_id uuid,
  p_business_name text
)
returns void language plpgsql security definer as $$
declare
  v_default_stage_id uuid;
begin
  -- 1. Create tenant settings
  insert into public.tenant_settings (tenant_id, embed_heading)
  values (p_tenant_id, 'Book a Consultation at ' || p_business_name)
  on conflict (tenant_id) do nothing;

  -- 2. Seed pipeline stages
  insert into public.pipeline_stages (tenant_id, name, color, order_index, is_default, is_terminal)
  values
    (p_tenant_id, 'New Lead',               '#6172f3', 0, true,  false),
    (p_tenant_id, 'Contacted',              '#f59e0b', 1, false, false),
    (p_tenant_id, 'Consultation Scheduled', '#3b82f6', 2, false, false),
    (p_tenant_id, 'Booked',                 '#8b5cf6', 3, false, false),
    (p_tenant_id, 'Won',                    '#22c55e', 4, false, true),
    (p_tenant_id, 'Lost',                   '#f43f5e', 5, false, true)
  on conflict do nothing;

  -- Get the default stage id
  select id into v_default_stage_id
  from public.pipeline_stages
  where tenant_id = p_tenant_id and is_default = true
  limit 1;

  -- 3. Seed email templates
  insert into public.email_templates (tenant_id, type, subject, body_html, body_text, trigger_status)
  values
    (
      p_tenant_id,
      'lead_confirmation',
      'We received your request — ' || p_business_name,
      '<p>Hi {{first_name}},</p><p>Thank you for reaching out to <strong>' || p_business_name || '</strong>. We''ve received your booking request and will be in touch within 24 hours to confirm your appointment.</p><p>Here''s what you submitted:</p><ul><li><strong>Service:</strong> {{requested_service}}</li><li><strong>Preferred Date:</strong> {{preferred_date}}</li></ul><p>We look forward to seeing you!</p>',
      'Hi {{first_name}}, Thank you for reaching out to ' || p_business_name || '. We received your booking request and will be in touch within 24 hours.',
      null
    ),
    (
      p_tenant_id,
      'lead_notification',
      'New booking request from {{lead_name}}',
      '<p>You have a new booking request from <strong>{{lead_name}}</strong>.</p><p><strong>Email:</strong> {{lead_email}}<br><strong>Phone:</strong> {{lead_phone}}<br><strong>Service:</strong> {{requested_service}}<br><strong>Preferred Date:</strong> {{preferred_date}}</p><p><a href="{{lead_url}}">View Lead</a></p>',
      'New booking request from {{lead_name}}. Email: {{lead_email}}, Phone: {{lead_phone}}, Service: {{requested_service}}',
      null
    ),
    (
      p_tenant_id,
      'review_request',
      'How was your experience at ' || p_business_name || '?',
      '<p>Hi {{first_name}},</p><p>We hope you enjoyed your visit to <strong>' || p_business_name || '</strong>! We''d love to hear about your experience.</p><p>It only takes a minute to leave a review — and it means the world to us.</p><p><a href="{{review_url}}">Leave a Review</a></p><p>Thank you!</p>',
      'Hi {{first_name}}, We hope you enjoyed your visit! Please leave us a review at: {{review_url}}',
      'won'
    )
  on conflict (tenant_id, type) do nothing;

  -- 4. Seed default tags
  insert into public.tags (tenant_id, name, color)
  values
    (p_tenant_id, 'VIP',      '#f59e0b'),
    (p_tenant_id, 'Referral', '#22c55e'),
    (p_tenant_id, 'Hot Lead', '#f43f5e'),
    (p_tenant_id, 'Follow Up', '#6172f3')
  on conflict (tenant_id, name) do nothing;

end;
$$;
