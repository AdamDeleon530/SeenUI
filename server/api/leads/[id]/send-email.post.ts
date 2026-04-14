import { requireTenantContext } from '../../../utils/tenant'
import { useSupabaseAdmin } from '../../../lib/supabase'
import { sendEmail, interpolateTemplate, buildLeadEmailVars, getTenantReviewUrl } from '../../../lib/email'

// POST /api/leads/:id/send-email
// Manually send an email to a lead — either from a template or custom content
export default defineEventHandler(async (event) => {
  const { tenantId } = await requireTenantContext(event)
  const leadId = getRouterParam(event, 'id')
  const db = useSupabaseAdmin()
  const config = useRuntimeConfig()

  const body = await readBody<{
    template_id?: string   // use an existing template
    subject?: string       // custom subject (if no template)
    body_html?: string     // custom HTML body
    body_text?: string     // custom plain text
  }>(event)

  // Fetch lead (enforce tenant isolation)
  const { data: lead } = await db
    .from('leads')
    .select('*')
    .eq('id', leadId!)
    .eq('tenant_id', tenantId)
    .single()

  if (!lead) throw createError({ statusCode: 404, message: 'Lead not found' })

  // Fetch tenant for business name + email from config
  const { data: tenant } = await db
    .from('tenants')
    .select('name, notification_email')
    .eq('id', tenantId)
    .single()

  // Fetch email sending domain config
  const { data: emailSettings } = await db
    .from('tenant_settings')
    .select('email_from_address, email_from_name, email_domain_status, resend_domain_id')
    .eq('tenant_id', tenantId)
    .single()

  const customFrom = emailSettings?.email_from_address &&
    (emailSettings.email_domain_status === 'verified' || emailSettings.resend_domain_id)
    ? { address: emailSettings.email_from_address, name: emailSettings.email_from_name }
    : undefined

  const reviewUrl = await getTenantReviewUrl(tenantId)
  const vars = buildLeadEmailVars(lead, tenant?.name ?? 'Us', config.appUrl, lead.id, reviewUrl)

  let subject: string
  let html: string
  let text: string
  let templateType = 'manual'

  if (body.template_id) {
    // Use an existing template
    const { data: tpl } = await db
      .from('email_templates')
      .select('*')
      .eq('id', body.template_id)
      .eq('tenant_id', tenantId)
      .single()

    if (!tpl) throw createError({ statusCode: 404, message: 'Template not found' })

    subject = interpolateTemplate(tpl.subject, vars)
    html    = interpolateTemplate(tpl.body_html, vars)
    text    = interpolateTemplate(tpl.body_text, vars)
    templateType = tpl.type
  } else {
    // Custom one-off email
    if (!body.subject?.trim()) throw createError({ statusCode: 400, message: 'subject is required' })
    if (!body.body_html?.trim()) throw createError({ statusCode: 400, message: 'body_html is required' })

    subject = interpolateTemplate(body.subject, vars)
    html    = interpolateTemplate(body.body_html, vars)
    text    = body.body_text ? interpolateTemplate(body.body_text, vars) : subject
  }

  const result = await sendEmail({ to: lead.email, toName: lead.full_name, subject, html, text }, customFrom)

  // Log the send
  await db.from('email_sends').insert({
    tenant_id:     tenantId,
    lead_id:       lead.id,
    template_type: templateType,
    to_email:      lead.email,
    to_name:       lead.full_name,
    subject,
    status:        result.error ? 'failed' : 'sent',
    error_message: result.error ?? null,
    sent_at:       result.error ? null : new Date().toISOString(),
  })

  // Record activity
  await db.from('lead_activities').insert({
    tenant_id:   tenantId,
    lead_id:     lead.id,
    user_id:     null,
    type:        'email_sent',
    description: `Email sent: ${subject}`,
    metadata:    { subject, template_type: templateType },
  })

  if (result.error) throw createError({ statusCode: 500, message: `Email failed: ${result.error}` })

  return { ok: true, subject }
})
