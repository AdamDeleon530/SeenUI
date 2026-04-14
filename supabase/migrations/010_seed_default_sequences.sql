-- Migration 010: Seed default email sequences into provision_new_tenant
-- Also backfills existing tenants who don't have sequences yet

-- =============================================================================
-- Update provision_new_tenant to include default sequences
-- =============================================================================
create or replace function public.provision_new_tenant(
  p_tenant_id uuid,
  p_business_name text
)
returns void language plpgsql security definer as $$
declare
  v_default_stage_id uuid;
  v_follow_up_tpl_id uuid;
  v_review_tpl_id uuid;
  v_seq_new_lead_id uuid;
  v_seq_post_won_id uuid;
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
      'follow_up',
      'Still interested? Let''s find a time — ' || p_business_name,
      '<p>Hi {{first_name}},</p><p>We noticed you reached out to <strong>' || p_business_name || '</strong> but haven''t booked yet. We''d love to help!</p><p>If now isn''t the right time, no worries — just reply to this email and we''ll find a time that works for you.</p>',
      'Hi {{first_name}}, We noticed you haven''t booked yet. Reply to this email and we''ll find a time that works for you.',
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
    (p_tenant_id, 'VIP',       '#f59e0b'),
    (p_tenant_id, 'Referral',  '#22c55e'),
    (p_tenant_id, 'Hot Lead',  '#f43f5e'),
    (p_tenant_id, 'Follow Up', '#6172f3')
  on conflict (tenant_id, name) do nothing;

  -- 5. Seed default sequences
  -- Get template IDs we just created
  select id into v_follow_up_tpl_id
  from public.email_templates
  where tenant_id = p_tenant_id and type = 'follow_up'
  limit 1;

  select id into v_review_tpl_id
  from public.email_templates
  where tenant_id = p_tenant_id and type = 'review_request'
  limit 1;

  -- Sequence A: New Lead Follow-up (auto-enroll on new leads)
  insert into public.email_sequences (id, tenant_id, name, description, trigger_status, is_active)
  values (
    gen_random_uuid(),
    p_tenant_id,
    'New Lead Follow-up',
    'Automatically follows up with new leads who haven''t booked yet.',
    'new',
    true
  )
  returning id into v_seq_new_lead_id;

  insert into public.sequence_steps (sequence_id, step_order, delay_days, template_id, subject, body_html, body_text)
  values
    (
      v_seq_new_lead_id, 0, 1,
      null,
      'Quick follow-up from {{business_name}}',
      '<p>Hi {{first_name}},</p><p>Just wanted to make sure you got our confirmation! We''re excited to help you and would love to get something on the calendar.</p><p>Reply to this email or call us anytime.</p>',
      'Hi {{first_name}}, Just wanted to make sure you got our confirmation! Reply or call us anytime.'
    ),
    (
      v_seq_new_lead_id, 1, 3,
      v_follow_up_tpl_id,
      null, null, null
    ),
    (
      v_seq_new_lead_id, 2, 7,
      null,
      'Last chance to book — {{business_name}}',
      '<p>Hi {{first_name}},</p><p>We still have availability and would love to have you in. If you''re still interested, just reply to this email or book directly online.</p><p>If timing isn''t right, no worries at all — we''re here whenever you''re ready.</p>',
      'Hi {{first_name}}, We still have availability and would love to have you in. Reply anytime.'
    );

  -- Sequence B: Post-Booking Review Request (auto-enroll on won leads)
  insert into public.email_sequences (id, tenant_id, name, description, trigger_status, is_active)
  values (
    gen_random_uuid(),
    p_tenant_id,
    'Post-Booking Review Request',
    'Asks happy customers for a review after their appointment is marked as Won.',
    'won',
    true
  )
  returning id into v_seq_post_won_id;

  insert into public.sequence_steps (sequence_id, step_order, delay_days, template_id, subject, body_html, body_text)
  values
    (
      v_seq_post_won_id, 0, 1,
      null,
      'Thank you for choosing {{business_name}}!',
      '<p>Hi {{first_name}},</p><p>It was a pleasure working with you! We hope everything went smoothly.</p><p>If there''s anything else we can help you with, don''t hesitate to reach out.</p>',
      'Hi {{first_name}}, It was a pleasure working with you! Reach out anytime.'
    ),
    (
      v_seq_post_won_id, 1, 3,
      v_review_tpl_id,
      null, null, null
    );

end;
$$;

-- =============================================================================
-- Backfill existing tenants who have no sequences yet
-- =============================================================================
do $$
declare
  r record;
  v_follow_up_tpl_id uuid;
  v_review_tpl_id uuid;
  v_seq_new_lead_id uuid;
  v_seq_post_won_id uuid;
begin
  for r in
    select id, name from public.tenants
    where id not in (select distinct tenant_id from public.email_sequences)
  loop
    -- Ensure follow_up template exists
    insert into public.email_templates (tenant_id, type, subject, body_html, body_text, trigger_status)
    values (
      r.id,
      'follow_up',
      'Still interested? Let''s find a time — ' || r.name,
      '<p>Hi {{first_name}},</p><p>We noticed you reached out to <strong>' || r.name || '</strong> but haven''t booked yet. We''d love to help!</p><p>If now isn''t the right time, no worries — just reply to this email and we''ll find a time that works for you.</p>',
      'Hi {{first_name}}, We noticed you haven''t booked yet. Reply to this email and we''ll find a time that works for you.',
      null
    )
    on conflict (tenant_id, type) do nothing;

    select id into v_follow_up_tpl_id
    from public.email_templates
    where tenant_id = r.id and type = 'follow_up'
    limit 1;

    select id into v_review_tpl_id
    from public.email_templates
    where tenant_id = r.id and type = 'review_request'
    limit 1;

    -- Sequence A: New Lead Follow-up
    insert into public.email_sequences (id, tenant_id, name, description, trigger_status, is_active)
    values (
      gen_random_uuid(),
      r.id,
      'New Lead Follow-up',
      'Automatically follows up with new leads who haven''t booked yet.',
      'new',
      true
    )
    returning id into v_seq_new_lead_id;

    insert into public.sequence_steps (sequence_id, step_order, delay_days, template_id, subject, body_html, body_text)
    values
      (
        v_seq_new_lead_id, 0, 1,
        null,
        'Quick follow-up from {{business_name}}',
        '<p>Hi {{first_name}},</p><p>Just wanted to make sure you got our confirmation! We''re excited to help and would love to get something on the calendar.</p><p>Reply to this email or call us anytime.</p>',
        'Hi {{first_name}}, Just wanted to make sure you got our confirmation! Reply or call us anytime.'
      ),
      (
        v_seq_new_lead_id, 1, 3,
        v_follow_up_tpl_id,
        null, null, null
      ),
      (
        v_seq_new_lead_id, 2, 7,
        null,
        'Last chance to book — ' || r.name,
        '<p>Hi {{first_name}},</p><p>We still have availability and would love to have you in. If you''re still interested, just reply to this email or book directly online.</p><p>If timing isn''t right, no worries at all — we''re here whenever you''re ready.</p>',
        'Hi {{first_name}}, We still have availability. Reply anytime.'
      );

    -- Sequence B: Post-Booking Review Request
    insert into public.email_sequences (id, tenant_id, name, description, trigger_status, is_active)
    values (
      gen_random_uuid(),
      r.id,
      'Post-Booking Review Request',
      'Asks happy customers for a review after their appointment is marked as Won.',
      'won',
      true
    )
    returning id into v_seq_post_won_id;

    insert into public.sequence_steps (sequence_id, step_order, delay_days, template_id, subject, body_html, body_text)
    values
      (
        v_seq_post_won_id, 0, 1,
        null,
        'Thank you for choosing ' || r.name || '!',
        '<p>Hi {{first_name}},</p><p>It was a pleasure working with you! We hope everything went smoothly.</p><p>If there''s anything else we can help you with, don''t hesitate to reach out.</p>',
        'Hi {{first_name}}, It was a pleasure working with you! Reach out anytime.'
      ),
      (
        v_seq_post_won_id, 1, 3,
        v_review_tpl_id,
        null, null, null
      );

  end loop;
end;
$$;
