import { requireTenantContext } from '../../utils/tenant'
import { useSupabaseAdmin } from '../../lib/supabase'
import { sendSms } from '../../lib/twilio'
import type { SendSmsDto } from '~~/app/types/sms'

// POST /api/sms/send — send an SMS to a lead (starter plan and above)
export default defineEventHandler(async (event) => {
  // Validate body first so malformed requests get 400 before auth overhead
  const body = await readBody<SendSmsDto>(event)

  if (!body.lead_id?.trim()) {
    throw createError({ statusCode: 400, message: 'lead_id is required' })
  }
  if (!body.body?.trim()) {
    throw createError({ statusCode: 400, message: 'message body is required' })
  }

  const { userId, tenantId } = await requireTenantContext(event)
  const db = useSupabaseAdmin()

  // Enforce plan gate: SMS requires starter or above
  const { data: tenant } = await db
    .from('tenants')
    .select('plan')
    .eq('id', tenantId)
    .single()

  if (tenant?.plan === 'trial') {
    throw createError({ statusCode: 402, message: 'SMS requires a paid plan. Upgrade to Starter or above.' })
  }

  // Fetch lead's phone number
  const { data: lead } = await db
    .from('leads')
    .select('phone, full_name')
    .eq('id', body.lead_id)
    .eq('tenant_id', tenantId)
    .single()

  if (!lead) throw createError({ statusCode: 404, message: 'Lead not found' })
  if (!lead.phone) throw createError({ statusCode: 400, message: 'Lead has no phone number on file' })

  // Use tenant-specific Twilio number if configured, otherwise fall back to env
  const config = useRuntimeConfig()
  const { data: settings } = await db
    .from('tenant_settings')
    .select('twilio_phone_number')
    .eq('tenant_id', tenantId)
    .single()

  const fromNumber: string = (settings as any)?.twilio_phone_number
    ?? (config.twilio as any)?.phoneNumber

  // Send via Twilio
  const result = await sendSms(lead.phone, body.body.trim(), fromNumber)

  // Persist to sms_messages regardless of send success/failure
  const { data: message, error } = await db
    .from('sms_messages')
    .insert({
      tenant_id: tenantId,
      lead_id: body.lead_id,
      direction: 'outbound',
      body: body.body.trim(),
      from_number: fromNumber,
      to_number: lead.phone,
      twilio_sid: result.sid || null,
      status: result.error ? 'failed' : 'sent',
      is_read: true,
      sent_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) throw createError({ statusCode: 500, message: error.message })

  // Log activity (non-blocking). Wrap in Promise.resolve() because the Supabase
  // query builder is PromiseLike but doesn't expose .catch() directly.
  Promise.resolve(
    db.from('lead_activities').insert({
      tenant_id: tenantId,
      lead_id: body.lead_id,
      user_id: userId,
      type: 'email_sent', // reusing closest existing type; sms_sent can be added later
      description: `SMS sent to ${lead.full_name ?? lead.phone}`,
    }),
  ).catch(console.error)

  return message
})
