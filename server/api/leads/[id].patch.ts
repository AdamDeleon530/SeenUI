import { requireTenantContext } from '../../utils/tenant'
import { useSupabaseAdmin } from '../../lib/supabase'
import { sendEmail, interpolateTemplate, buildLeadEmailVars } from '../../lib/email'
import type { UpdateLeadDto } from '~~/app/types/lead'

// PATCH /api/leads/:id — update a lead's fields or status
export default defineEventHandler(async (event) => {
  const { userId, tenantId } = await requireTenantContext(event)
  const id = getRouterParam(event, 'id')
  const body = await readBody<UpdateLeadDto>(event)

  const db = useSupabaseAdmin()

  // Fetch current state for activity comparison
  const { data: current } = await db
    .from('leads')
    .select('status, stage_id')
    .eq('id', id!)
    .eq('tenant_id', tenantId)
    .single()

  if (!current) throw createError({ statusCode: 404, message: 'Lead not found' })

  const { data: updated, error } = await db
    .from('leads')
    .update(body)
    .eq('id', id!)
    .eq('tenant_id', tenantId)
    .select()
    .single()

  if (error) throw createError({ statusCode: 500, message: error.message })

  // Record status change activity
  if (body.status && body.status !== current.status) {
    await db.from('lead_activities').insert({
      tenant_id: tenantId,
      lead_id: id,
      user_id: userId,
      type: 'status_changed',
      description: `Status changed from "${current.status}" to "${body.status}"`,
      metadata: { from: current.status, to: body.status },
    })

    // Trigger email workflows for status changes (non-blocking)
    triggerStatusChangeEmails(tenantId, updated, body.status).catch(console.error)
  }

  return updated
})

async function triggerStatusChangeEmails(tenantId: string, lead: any, newStatus: string) {
  const db = useSupabaseAdmin()
  const config = useRuntimeConfig()

  // Find email template triggered by this status
  const { data: template } = await db
    .from('email_templates')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('trigger_status', newStatus)
    .eq('is_enabled', true)
    .single()

  if (!template) return

  const { data: tenant } = await db
    .from('tenants')
    .select('name')
    .eq('id', tenantId)
    .single()

  const vars = buildLeadEmailVars(lead, tenant?.name ?? '', config.appUrl, lead.id)
  const subject = interpolateTemplate(template.subject, vars)
  const html = interpolateTemplate(template.body_html, vars)
  const text = interpolateTemplate(template.body_text, vars)

  const result = await sendEmail({ to: lead.email, toName: lead.full_name, subject, html, text })

  await db.from('email_sends').insert({
    tenant_id: tenantId,
    lead_id: lead.id,
    template_type: template.type,
    to_email: lead.email,
    to_name: lead.full_name,
    subject,
    status: result.error ? 'failed' : 'sent',
    error_message: result.error ?? null,
    sent_at: result.error ? null : new Date().toISOString(),
  })
}
