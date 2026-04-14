import { requireTenantContext } from '../../utils/tenant'
import { useSupabaseAdmin } from '../../lib/supabase'
import { sendEmail, interpolateTemplate, buildLeadEmailVars, getTenantReviewUrl } from '../../lib/email'
import type { CreateLeadDto } from '~~/app/types/lead'

// POST /api/leads — create a new lead (authenticated staff/owner)
export default defineEventHandler(async (event) => {
  const { userId, tenantId } = await requireTenantContext(event)
  const body = await readBody<CreateLeadDto>(event)

  // Validate required fields
  if (!body.full_name?.trim()) throw createError({ statusCode: 400, message: 'full_name is required' })
  if (!body.email?.trim()) throw createError({ statusCode: 400, message: 'email is required' })

  const db = useSupabaseAdmin()

  // Find the default pipeline stage for this tenant
  const { data: defaultStage } = await db
    .from('pipeline_stages')
    .select('id')
    .eq('tenant_id', tenantId)
    .eq('is_default', true)
    .single()

  // Create the lead
  const { data: lead, error } = await db
    .from('leads')
    .insert({
      tenant_id: tenantId,
      full_name: body.full_name.trim(),
      email: body.email.trim().toLowerCase(),
      phone: body.phone?.trim() ?? null,
      requested_service: body.requested_service?.trim() ?? null,
      preferred_date: body.preferred_date ?? null,
      preferred_time: body.preferred_time ?? null,
      notes: body.notes?.trim() ?? null,
      source: body.source ?? 'manual',
      source_page: body.source_page ?? null,
      referring_url: body.referring_url ?? null,
      utm_source: body.utm_source ?? null,
      utm_medium: body.utm_medium ?? null,
      utm_campaign: body.utm_campaign ?? null,
      utm_content: body.utm_content ?? null,
      utm_term: body.utm_term ?? null,
      stage_id: defaultStage?.id ?? null,
      status: 'new',
    })
    .select()
    .single()

  if (error) throw createError({ statusCode: 500, message: error.message })

  // Record activity
  await db.from('lead_activities').insert({
    tenant_id: tenantId,
    lead_id: lead.id,
    user_id: userId,
    type: 'lead_created',
    description: `Lead created manually by staff`,
  })

  // Send notification email to business (non-blocking)
  sendLeadNotificationEmail(tenantId, lead).catch(console.error)

  return lead
})

async function sendLeadNotificationEmail(tenantId: string, lead: any) {
  const db = useSupabaseAdmin()
  const config = useRuntimeConfig()

  const [tenantRes, templateRes, reviewUrl] = await Promise.all([
    db.from('tenants').select('name, notification_email').eq('id', tenantId).single(),
    db.from('email_templates')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('type', 'lead_notification')
      .eq('is_enabled', true)
      .single(),
    getTenantReviewUrl(tenantId),
  ])

  if (!tenantRes.data?.notification_email || !templateRes.data) return

  const vars = buildLeadEmailVars(lead, tenantRes.data.name, config.appUrl, lead.id, reviewUrl)
  const subject = interpolateTemplate(templateRes.data.subject, vars)
  const html = interpolateTemplate(templateRes.data.body_html, vars)
  const text = interpolateTemplate(templateRes.data.body_text, vars)

  const result = await sendEmail({
    to: tenantRes.data.notification_email,
    subject,
    html,
    text,
  })

  // Log the send
  await db.from('email_sends').insert({
    tenant_id: tenantId,
    lead_id: lead.id,
    template_type: 'lead_notification',
    to_email: tenantRes.data.notification_email,
    subject,
    status: result.error ? 'failed' : 'sent',
    error_message: result.error ?? null,
    sent_at: result.error ? null : new Date().toISOString(),
  })
}
