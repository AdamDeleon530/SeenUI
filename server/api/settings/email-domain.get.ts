import { requireTenantContext } from '../../utils/tenant'
import { useSupabaseAdmin } from '../../lib/supabase'

// GET /api/settings/email-domain
// Returns current email domain config + live DNS records from Resend if a domain is registered
export default defineEventHandler(async (event) => {
  const { tenantId } = await requireTenantContext(event)
  const config = useRuntimeConfig()
  const db = useSupabaseAdmin()

  const { data: settings } = await db
    .from('tenant_settings')
    .select('email_from_name, email_from_address, resend_domain_id, email_domain_status')
    .eq('tenant_id', tenantId)
    .single()

  let dnsRecords: any[] = []
  let liveStatus: string | null = null

  // Fetch live DNS records from Resend if we have a domain registered
  if (settings?.resend_domain_id && config.resendApiKey) {
    try {
      const domain = await $fetch<any>(`https://api.resend.com/domains/${settings.resend_domain_id}`, {
        headers: { Authorization: `Bearer ${config.resendApiKey}` },
      })
      dnsRecords = domain.records ?? []
      liveStatus = domain.status ?? null
    } catch {
      // Domain may have been deleted in Resend — that's OK
    }
  }

  return {
    settings,
    dns_records: dnsRecords,
    live_status: liveStatus,
  }
})
