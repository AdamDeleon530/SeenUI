import { requireTenantContext } from '../../utils/tenant'
import { useSupabaseAdmin } from '../../lib/supabase'

// POST /api/settings/email-domain
// Registers a new sending domain with Resend and saves the domain ID
export default defineEventHandler(async (event) => {
  const { tenantId } = await requireTenantContext(event)
  const config = useRuntimeConfig()
  const db = useSupabaseAdmin()

  const body = await readBody<{ domain: string; from_name: string; from_address: string }>(event)

  if (!body.domain?.trim()) throw createError({ statusCode: 400, message: 'domain is required' })
  if (!body.from_address?.trim()) throw createError({ statusCode: 400, message: 'from_address is required' })
  if (!config.resendApiKey) throw createError({ statusCode: 500, message: 'Email service not configured' })

  // Validate that from_address matches the domain
  const emailDomain = body.from_address.split('@')[1]
  if (emailDomain !== body.domain.trim()) {
    throw createError({ statusCode: 400, message: 'From address must match the domain you are verifying' })
  }

  // Check if a domain is already registered for this tenant — delete it first
  const { data: existing } = await db
    .from('tenant_settings')
    .select('resend_domain_id')
    .eq('tenant_id', tenantId)
    .single()

  if (existing?.resend_domain_id) {
    await $fetch(`https://api.resend.com/domains/${existing.resend_domain_id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${config.resendApiKey}` },
    }).catch(() => {})
  }

  // Create the domain in Resend
  let resendDomain: any
  try {
    resendDomain = await $fetch<any>('https://api.resend.com/domains', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: { name: body.domain.trim() },
    })
  } catch (err: any) {
    const msg = err?.data?.message ?? err?.message ?? 'Failed to register domain with Resend'
    throw createError({ statusCode: 422, message: msg })
  }

  // Save to tenant settings
  await db
    .from('tenant_settings')
    .update({
      email_from_name: body.from_name?.trim() || null,
      email_from_address: body.from_address.trim(),
      resend_domain_id: resendDomain.id,
      email_domain_status: 'pending',
    })
    .eq('tenant_id', tenantId)

  return {
    domain_id: resendDomain.id,
    dns_records: resendDomain.records ?? [],
    status: resendDomain.status,
  }
})
