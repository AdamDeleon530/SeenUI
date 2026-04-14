/**
 * Email abstraction layer.
 *
 * Provider: Resend (simple REST API, generous free tier, great DX).
 * The interface is provider-agnostic — swap the send() impl to use
 * SendGrid, Postmark, etc. without changing call sites.
 *
 * SCAFFOLD: The provider integration is real but requires RESEND_API_KEY.
 * Without it, emails are logged to console in development.
 */

import type { EmailPayload } from '~~/app/types/email'

export async function sendEmail(
  payload: EmailPayload,
  fromOverride?: { address: string; name?: string | null },
): Promise<{ id?: string; error?: string }> {
  const config = useRuntimeConfig()
  const apiKey = config.resendApiKey

  // Dev fallback: log to console if no API key configured
  if (!apiKey) {
    console.log('[EMAIL] No RESEND_API_KEY configured. Would have sent:')
    console.log(`  To: ${payload.to}`)
    console.log(`  Subject: ${payload.subject}`)
    return { id: 'dev-mock' }
  }

  // Build from string: "Business Name <email@domain.com>" or plain address
  let fromAddress: string
  if (fromOverride?.address) {
    fromAddress = fromOverride.name
      ? `${fromOverride.name} <${fromOverride.address}>`
      : fromOverride.address
  } else {
    fromAddress = config.emailFrom
  }

  try {
    const response = await $fetch<{ id: string }>('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: {
        from: fromAddress,
        to: [payload.to],
        subject: payload.subject,
        html: payload.html,
        text: payload.text,
        reply_to: payload.replyTo,
      },
    })
    return { id: response.id }
  } catch (err: any) {
    console.error('[EMAIL] Send failed:', err.message)
    return { error: err.message }
  }
}

/**
 * Fetches the review_url for a tenant from tenant_settings.
 * Returns empty string if not configured.
 */
export async function getTenantReviewUrl(tenantId: string): Promise<string> {
  const { useSupabaseAdmin } = await import('./supabase')
  const db = useSupabaseAdmin()
  const { data } = await db
    .from('tenant_settings')
    .select('review_url')
    .eq('tenant_id', tenantId)
    .single()
  return data?.review_url ?? ''
}

/**
 * Interpolates template variables into email content.
 * Variables use {{variable_name}} syntax.
 */
export function interpolateTemplate(template: string, vars: Record<string, string | null | undefined>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? '')
}

/**
 * Builds template variables for a lead.
 */
export function buildLeadEmailVars(lead: {
  full_name: string
  email: string
  phone?: string | null
  requested_service?: string | null
  preferred_date?: string | null
}, tenantName: string, appUrl: string, leadId?: string, reviewUrl?: string | null): Record<string, string | null | undefined> {
  const firstName = lead.full_name.split(' ')[0]
  return {
    first_name: firstName,
    lead_name: lead.full_name,
    lead_email: lead.email,
    lead_phone: lead.phone ?? 'Not provided',
    requested_service: lead.requested_service ?? 'Not specified',
    preferred_date: lead.preferred_date ?? 'Flexible',
    business_name: tenantName,
    lead_url: leadId ? `${appUrl}/leads/${leadId}` : appUrl,
    review_url: reviewUrl ?? '',
  }
}
