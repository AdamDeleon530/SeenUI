import { requireTenantContext } from '../../utils/tenant'
import { useSupabaseAdmin } from '../../lib/supabase'

// PATCH /api/settings/review-url
export default defineEventHandler(async (event) => {
  const { tenantId } = await requireTenantContext(event)
  const db = useSupabaseAdmin()

  const body = await readBody<{
    review_url?: string | null
    review_request_delay_hours?: number
    review_request_sms_enabled?: boolean
  }>(event)

  const fields: Record<string, unknown> = {}
  if (body.review_url !== undefined) fields.review_url = body.review_url ?? null
  if (body.review_request_delay_hours !== undefined) fields.review_request_delay_hours = body.review_request_delay_hours
  if (body.review_request_sms_enabled !== undefined) fields.review_request_sms_enabled = body.review_request_sms_enabled

  if (!Object.keys(fields).length) return { ok: true }

  const { error } = await db
    .from('tenant_settings')
    .update(fields)
    .eq('tenant_id', tenantId)

  if (error) throw createError({ statusCode: 500, message: error.message })

  return { ok: true }
})
