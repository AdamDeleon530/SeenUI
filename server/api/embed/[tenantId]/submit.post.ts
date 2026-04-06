import { useSupabaseAdmin } from '../../../lib/supabase'
import { sendEmail, interpolateTemplate, buildLeadEmailVars } from '../../../lib/email'
import type { CreateLeadDto } from '~~/app/types/lead'

/**
 * POST /api/embed/:tenantId/submit
 * Public endpoint — no auth required. Used by the embed widget on external sites.
 * Validates origin against tenant's configured domain (CORS handled separately).
 * Rate limiting: SCAFFOLD — add per-IP rate limiting in production.
 */
export default defineEventHandler(async (event) => {
  setResponseHeaders(event, {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Accept',
  })

  const tenantId = getRouterParam(event, 'tenantId')
  if (!tenantId) throw createError({ statusCode: 400, message: 'tenantId is required' })

  const body = await readBody<CreateLeadDto & { _recaptcha_token?: string }>(event)

  // Input validation
  if (!body.full_name?.trim()) throw createError({ statusCode: 400, message: 'Name is required' })
  if (!body.email?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
    throw createError({ statusCode: 400, message: 'Valid email is required' })
  }

  const db = useSupabaseAdmin()

  // Verify tenant is active
  const { data: tenant } = await db
    .from('tenants')
    .select('id, name, notification_email, status')
    .eq('id', tenantId)
    .single()

  if (!tenant || tenant.status !== 'active') {
    throw createError({ statusCode: 404, message: 'Not found' })
  }

  // Resolve default pipeline stage
  const { data: defaultStage } = await db
    .from('pipeline_stages')
    .select('id')
    .eq('tenant_id', tenantId)
    .eq('is_default', true)
    .single()

  // Extract UTM + attribution from body
  const lead = {
    tenant_id: tenantId,
    full_name: body.full_name.trim(),
    email: body.email.trim().toLowerCase(),
    phone: body.phone?.trim() ?? null,
    requested_service: body.requested_service?.trim() ?? null,
    preferred_date: body.preferred_date ?? null,
    preferred_time: body.preferred_time ?? null,
    notes: body.notes?.trim() ?? null,
    source: 'embed_widget' as const,
    source_page: body.source_page ?? null,
    referring_url: body.referring_url ?? null,
    utm_source: body.utm_source ?? null,
    utm_medium: body.utm_medium ?? null,
    utm_campaign: body.utm_campaign ?? null,
    utm_content: body.utm_content ?? null,
    utm_term: body.utm_term ?? null,
    stage_id: defaultStage?.id ?? null,
    status: 'new' as const,
  }

  const { data: createdLead, error } = await db
    .from('leads')
    .insert(lead)
    .select()
    .single()

  if (error) throw createError({ statusCode: 500, message: 'Failed to save request' })

  // Record creation activity
  await db.from('lead_activities').insert({
    tenant_id: tenantId,
    lead_id: createdLead.id,
    user_id: null, // system event — no authenticated user
    type: 'lead_created',
    description: 'Lead submitted via embed widget',
    metadata: { source_page: body.source_page, utm_source: body.utm_source },
  })

  // Send emails (non-blocking)
  sendEmbedEmails(tenantId, tenant, createdLead).catch(console.error)

  // Return minimal confirmation — don't expose internal IDs to public
  return {
    success: true,
    message: 'Your request has been received. We will be in touch shortly.',
  }
})

async function sendEmbedEmails(tenantId: string, tenant: any, lead: any) {
  const db = useSupabaseAdmin()
  const config = useRuntimeConfig()
  const vars = buildLeadEmailVars(lead, tenant.name, config.appUrl, lead.id)

  // 1. Confirmation to the lead
  const { data: confirmTemplate } = await db
    .from('email_templates')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('type', 'lead_confirmation')
    .eq('is_enabled', true)
    .single()

  if (confirmTemplate) {
    const subject = interpolateTemplate(confirmTemplate.subject, vars)
    const html = interpolateTemplate(confirmTemplate.body_html, vars)
    const text = interpolateTemplate(confirmTemplate.body_text, vars)
    const result = await sendEmail({ to: lead.email, toName: lead.full_name, subject, html, text })
    await db.from('email_sends').insert({
      tenant_id: tenantId,
      lead_id: lead.id,
      template_type: 'lead_confirmation',
      to_email: lead.email,
      to_name: lead.full_name,
      subject,
      status: result.error ? 'failed' : 'sent',
      error_message: result.error ?? null,
      sent_at: result.error ? null : new Date().toISOString(),
    })
  }

  // 2. Notification to business
  if (!tenant.notification_email) return
  const { data: notifTemplate } = await db
    .from('email_templates')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('type', 'lead_notification')
    .eq('is_enabled', true)
    .single()

  if (notifTemplate) {
    const subject = interpolateTemplate(notifTemplate.subject, vars)
    const html = interpolateTemplate(notifTemplate.body_html, vars)
    const text = interpolateTemplate(notifTemplate.body_text, vars)
    const result = await sendEmail({ to: tenant.notification_email, subject, html, text })
    await db.from('email_sends').insert({
      tenant_id: tenantId,
      lead_id: lead.id,
      template_type: 'lead_notification',
      to_email: tenant.notification_email,
      subject,
      status: result.error ? 'failed' : 'sent',
      error_message: result.error ?? null,
      sent_at: result.error ? null : new Date().toISOString(),
    })
  }
}
