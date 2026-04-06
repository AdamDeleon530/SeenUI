import { requireTenantContext } from '../../utils/tenant'
import { useSupabaseAdmin } from '../../lib/supabase'

// POST /api/settings/email-domain-verify
// Triggers a re-check of DNS verification status with Resend
export default defineEventHandler(async (event) => {
  const { tenantId } = await requireTenantContext(event)
  const config = useRuntimeConfig()
  const db = useSupabaseAdmin()

  const { data: settings } = await db
    .from('tenant_settings')
    .select('resend_domain_id')
    .eq('tenant_id', tenantId)
    .single()

  if (!settings?.resend_domain_id) {
    throw createError({ statusCode: 400, message: 'No domain registered yet' })
  }

  if (!config.resendApiKey) throw createError({ statusCode: 500, message: 'Email service not configured' })

  // Trigger Resend to re-check DNS
  await $fetch(`https://api.resend.com/domains/${settings.resend_domain_id}/verify`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${config.resendApiKey}` },
  }).catch(() => {})

  // Fetch updated status
  const domain = await $fetch<any>(`https://api.resend.com/domains/${settings.resend_domain_id}`, {
    headers: { Authorization: `Bearer ${config.resendApiKey}` },
  })

  const verified = domain.status === 'verified'
  await db
    .from('tenant_settings')
    .update({ email_domain_status: verified ? 'verified' : 'pending' })
    .eq('tenant_id', tenantId)

  return {
    status: domain.status,
    verified,
    dns_records: domain.records ?? [],
  }
})
