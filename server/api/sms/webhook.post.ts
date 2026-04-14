import { validateTwilioWebhook } from '../../lib/twilio'
import { useSupabaseAdmin } from '../../lib/supabase'

/**
 * POST /api/sms/webhook — Twilio inbound SMS callback (public route, no auth).
 *
 * Twilio calls this URL when a message is received on the configured number.
 * We validate the X-Twilio-Signature header before trusting the payload.
 */
export default defineEventHandler(async (event) => {
  // Validate signature before processing any payload
  if (!validateTwilioWebhook(event)) {
    throw createError({ statusCode: 403, message: 'Invalid Twilio signature' })
  }

  const body = await readBody(event)

  // Twilio webhook fields
  const from: string = body?.From ?? ''
  const to: string = body?.To ?? ''
  const text: string = body?.Body ?? ''
  const sid: string = body?.MessageSid ?? ''

  if (!from || !to || !text) {
    throw createError({ statusCode: 400, message: 'Missing required Twilio webhook fields' })
  }

  const db = useSupabaseAdmin()

  // Look up which tenant owns the 'To' number via their Twilio phone number setting
  // We search tenant_settings for a matching twilio_phone_number, or fall back to
  // the global runtime config phone number.
  const { data: settingsRow } = await db
    .from('tenant_settings')
    .select('tenant_id')
    .eq('twilio_phone_number', to)
    .single()

  // Fall back: if no per-tenant number match, try the global configured number
  const config = useRuntimeConfig()
  const globalPhone = (config.twilio as any)?.phoneNumber
  let tenantId: string | null = settingsRow?.tenant_id ?? null

  if (!tenantId && globalPhone === to) {
    // Fetch the first (and typically only) tenant when running single-tenant
    const { data: firstTenant } = await db
      .from('tenants')
      .select('id')
      .single()
    tenantId = firstTenant?.id ?? null
  }

  if (!tenantId) {
    // Unknown number — return empty TwiML so Twilio doesn't retry
    setResponseHeaders(event, { 'Content-Type': 'text/xml' })
    return '<?xml version="1.0" encoding="UTF-8"?><Response></Response>'
  }

  // Find the lead by their phone number within this tenant
  const { data: lead } = await db
    .from('leads')
    .select('id')
    .eq('tenant_id', tenantId)
    .eq('phone', from)
    .single()

  if (!lead) {
    setResponseHeaders(event, { 'Content-Type': 'text/xml' })
    return '<?xml version="1.0" encoding="UTF-8"?><Response></Response>'
  }

  // Persist the inbound message
  await db.from('sms_messages').insert({
    tenant_id: tenantId,
    lead_id: lead.id,
    direction: 'inbound',
    body: text,
    from_number: from,
    to_number: to,
    twilio_sid: sid,
    status: 'received',
    is_read: false,
    sent_at: new Date().toISOString(),
  })

  setResponseHeaders(event, { 'Content-Type': 'text/xml' })
  return '<?xml version="1.0" encoding="UTF-8"?><Response></Response>'
})
