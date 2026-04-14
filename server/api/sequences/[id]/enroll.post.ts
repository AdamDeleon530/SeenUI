import { requireTenantContext } from '../../../utils/tenant'
import { useSupabaseAdmin } from '../../../lib/supabase'
import { sendEmail, interpolateTemplate, buildLeadEmailVars, getTenantReviewUrl } from '../../../lib/email'

// POST /api/sequences/:id/enroll
// Enroll a lead in a sequence and immediately process step 1 if delay_days === 0
export default defineEventHandler(async (event) => {
  const { tenantId } = await requireTenantContext(event)
  const sequenceId = getRouterParam(event, 'id')
  const db = useSupabaseAdmin()
  const config = useRuntimeConfig()

  const body = await readBody<{ lead_id: string }>(event)
  if (!body.lead_id) throw createError({ statusCode: 400, message: 'lead_id is required' })

  // Verify sequence belongs to tenant
  const { data: sequence } = await db
    .from('email_sequences')
    .select('*, steps:sequence_steps(*)')
    .eq('id', sequenceId!)
    .eq('tenant_id', tenantId)
    .single()

  if (!sequence) throw createError({ statusCode: 404, message: 'Sequence not found' })
  if (!sequence.is_active) throw createError({ statusCode: 400, message: 'Sequence is not active' })

  // Verify lead belongs to tenant
  const { data: lead } = await db
    .from('leads')
    .select('*')
    .eq('id', body.lead_id)
    .eq('tenant_id', tenantId)
    .single()

  if (!lead) throw createError({ statusCode: 404, message: 'Lead not found' })

  // Compute next_send_at from first step delay
  const sortedSteps = (sequence.steps ?? []).sort((a: any, b: any) => a.step_order - b.step_order)
  const firstStep = sortedSteps[0]
  const nextSendAt = firstStep
    ? new Date(Date.now() + firstStep.delay_days * 86400_000).toISOString()
    : null

  // Insert enrollment (upsert to handle re-enrollment gracefully)
  const { data: enrollment, error } = await db
    .from('sequence_enrollments')
    .upsert(
      {
        tenant_id:    tenantId,
        sequence_id:  sequenceId!,
        lead_id:      body.lead_id,
        current_step: 0,
        status:       'active',
        enrolled_at:  new Date().toISOString(),
        next_send_at: nextSendAt,
      },
      { onConflict: 'sequence_id,lead_id' },
    )
    .select()
    .single()

  if (error) throw createError({ statusCode: 500, message: error.message })

  // Log activity
  await db.from('lead_activities').insert({
    tenant_id:   tenantId,
    lead_id:     body.lead_id,
    user_id:     null,
    type:        'sequence_enrolled',
    description: `Enrolled in sequence: ${sequence.name}`,
    metadata:    { sequence_id: sequenceId, sequence_name: sequence.name },
  })

  // If first step has delay_days === 0, send immediately
  if (firstStep?.delay_days === 0) {
    sendFirstStepImmediately(tenantId, lead, firstStep, config).catch(console.error)
  }

  return { ok: true, enrollment_id: enrollment.id, next_send_at: nextSendAt }
})

async function sendFirstStepImmediately(tenantId: string, lead: any, step: any, config: any) {
  const db = useSupabaseAdmin()

  const { data: tenant } = await db
    .from('tenants')
    .select('name, notification_email')
    .eq('id', tenantId)
    .single()

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

  let subject: string, html: string, text: string

  if (step.template_id) {
    const { data: tpl } = await db
      .from('email_templates')
      .select('*')
      .eq('id', step.template_id)
      .single()
    if (!tpl) return
    subject = interpolateTemplate(tpl.subject, vars)
    html    = interpolateTemplate(tpl.body_html, vars)
    text    = interpolateTemplate(tpl.body_text, vars)
  } else {
    if (!step.subject || !step.body_html) return
    subject = interpolateTemplate(step.subject, vars)
    html    = interpolateTemplate(step.body_html, vars)
    text    = step.body_text ? interpolateTemplate(step.body_text, vars) : subject
  }

  const result = await sendEmail({ to: lead.email, toName: lead.full_name, subject, html, text }, customFrom)

  await db.from('email_sends').insert({
    tenant_id:     tenantId,
    lead_id:       lead.id,
    template_type: 'sequence',
    to_email:      lead.email,
    to_name:       lead.full_name,
    subject,
    status:        result.error ? 'failed' : 'sent',
    error_message: result.error ?? null,
    sent_at:       result.error ? null : new Date().toISOString(),
  })
}
