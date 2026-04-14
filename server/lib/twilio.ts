/**
 * Twilio SMS integration.
 *
 * Provides sendSms() for outbound messages and validateTwilioWebhook()
 * for signature validation on inbound webhook callbacks.
 */

import twilio from 'twilio'

export async function sendSms(
  to: string,
  body: string,
  from?: string,
): Promise<{ sid: string; status: string; error: string | null }> {
  const config = useRuntimeConfig()
  const twilioConfig = config.twilio as { accountSid: string; authToken: string; phoneNumber: string }
  const { accountSid, authToken, phoneNumber } = twilioConfig

  if (!accountSid || !authToken) {
    throw new Error('Twilio credentials not configured. Set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN.')
  }

  const client = twilio(accountSid, authToken)
  const fromNumber = from ?? phoneNumber

  try {
    const message = await client.messages.create({ body, from: fromNumber, to })
    return { sid: message.sid, status: message.status, error: null }
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err)
    return { sid: '', status: 'failed', error: errMsg }
  }
}

/**
 * Validates that an incoming webhook request originated from Twilio.
 * Uses X-Twilio-Signature header and HMAC-SHA1 verification.
 *
 * Returns true if valid, false otherwise.
 */
export function validateTwilioWebhook(event: any): boolean {
  const config = useRuntimeConfig()
  const { authToken } = config.twilio as { accountSid: string; authToken: string; phoneNumber: string }

  if (!authToken) return false

  const signature = getHeader(event, 'x-twilio-signature') ?? ''
  const url = getRequestURL(event).href

  try {
    return twilio.validateRequest(authToken, signature, url, {})
  } catch {
    return false
  }
}
