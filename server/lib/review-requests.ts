/**
 * Review request scheduling.
 *
 * When a lead is won, call scheduleReviewRequest(). It either sends immediately
 * (delay = 0) or inserts a scheduled_jobs row for the cron processor.
 *
 * Both supabase and email helpers are imported lazily inside each function so
 * that the module can be loaded in Vitest without needing @supabase/supabase-js
 * to be resolvable, and so that vi.mock factories for './email' don't run at
 * module load time (avoids TDZ issues when vi.mock captures a const that isn't
 * initialised until the test body runs).
 */

export type MinimalLead = {
  id: string
  email: string
  full_name: string
  phone?: string | null
  requested_service?: string | null
  preferred_date?: string | null
}

/**
 * Schedules (or immediately sends) a review request for a lead.
 * Called when a lead's status changes to 'won'.
 *
 * @param db  Optional Supabase client — pass a mock in tests, omit in production.
 */
export async function scheduleReviewRequest(
  tenantId: string,
  lead: MinimalLead,
  db?: any,
): Promise<void> {
  const dbClient = db ?? (await import('./supabase')).useSupabaseAdmin()

  const { data: settings } = await dbClient
    .from('tenant_settings')
    .select('review_request_delay_hours, review_request_sms_enabled, review_url')
    .eq('tenant_id', tenantId)
    .single()

  const delayHours: number = settings?.review_request_delay_hours ?? 24
  const reviewUrl: string = settings?.review_url ?? ''

  if (delayHours === 0) {
    // Import lazily so the module can be loaded without triggering email mocks at init time
    const { sendEmail } = await import('./email')
    await sendEmail({
      to: lead.email,
      toName: lead.full_name,
      subject: 'We\'d love your review!',
      html: buildReviewHtml(lead.full_name.split(' ')[0] ?? lead.full_name, reviewUrl),
      text: buildReviewText(lead.full_name.split(' ')[0] ?? lead.full_name, reviewUrl),
    })
  } else {
    const runAt = new Date(Date.now() + delayHours * 3_600_000).toISOString()
    await dbClient.from('scheduled_jobs').insert({
      tenant_id: tenantId,
      job_type: 'review_request',
      payload: {
        lead_id: lead.id,
        lead_email: lead.email,
        lead_name: lead.full_name,
        review_url: reviewUrl,
      },
      run_at: runAt,
      status: 'pending',
    })
  }
}

/**
 * Sends a review request using the tenant's review_request email template.
 * Called by the cron job processor for delayed sends.
 */
export async function sendScheduledReviewRequest(
  tenantId: string,
  payload: { lead_id: string; lead_email: string; lead_name: string; review_url?: string },
  db?: any,
): Promise<void> {
  const dbClient = db ?? (await import('./supabase')).useSupabaseAdmin()
  const config = useRuntimeConfig()

  const { data: lead } = await dbClient
    .from('leads')
    .select('id, full_name, email, phone, requested_service, preferred_date')
    .eq('id', payload.lead_id)
    .single()

  if (!lead) return

  const { data: template } = await dbClient
    .from('email_templates')
    .select('subject, body_html, body_text')
    .eq('tenant_id', tenantId)
    .eq('type', 'review_request')
    .single()

  const { data: tenant } = await dbClient
    .from('tenants')
    .select('name')
    .eq('id', tenantId)
    .single()

  const { sendEmail, buildLeadEmailVars, interpolateTemplate } = await import('./email')

  const reviewUrl = payload.review_url ?? ''
  const vars = buildLeadEmailVars(lead, tenant?.name ?? '', config.appUrl, lead.id, reviewUrl)

  if (template) {
    const subject = interpolateTemplate(template.subject ?? '', vars)
    const html = interpolateTemplate(template.body_html ?? '', vars)
    const text = interpolateTemplate(template.body_text ?? '', vars)
    await sendEmail({ to: lead.email, toName: lead.full_name, subject, html, text })
  } else {
    await sendEmail({
      to: lead.email,
      toName: lead.full_name,
      subject: 'We\'d love your review!',
      html: buildReviewHtml(lead.full_name.split(' ')[0] ?? lead.full_name, reviewUrl),
      text: buildReviewText(lead.full_name.split(' ')[0] ?? lead.full_name, reviewUrl),
    })
  }
}

function buildReviewHtml(firstName: string, reviewUrl: string): string {
  const cta = reviewUrl
    ? `<p style="margin:24px 0"><a href="${reviewUrl}" style="background:#2563eb;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600;display:inline-block;">Leave a Review</a></p>`
    : ''
  return `<p>Hi ${firstName},</p>
<p>Thank you for choosing us! We hope your experience was great.</p>
<p>Could you take a moment to leave us a review? It really helps other customers find us and means a lot to our team.</p>
${cta}
<p>Thanks again,<br>The Team</p>`
}

function buildReviewText(firstName: string, reviewUrl: string): string {
  return [
    `Hi ${firstName},`,
    '',
    'Thank you for choosing us! We hope your experience was great.',
    '',
    'Could you take a moment to leave us a review?',
    ...(reviewUrl ? ['', reviewUrl, ''] : []),
    'Thanks again,',
    'The Team',
  ].join('\n')
}
