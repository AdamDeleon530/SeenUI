import { requireTenantContext } from '../../utils/tenant'
import { useSupabaseAdmin } from '../../lib/supabase'

// PATCH /api/settings/review-url
export default defineEventHandler(async (event) => {
  const { tenantId } = await requireTenantContext(event)
  const db = useSupabaseAdmin()

  const body = await readBody<{ review_url: string | null }>(event)

  const { error } = await db
    .from('tenant_settings')
    .update({ review_url: body.review_url ?? null })
    .eq('tenant_id', tenantId)

  if (error) throw createError({ statusCode: 500, message: error.message })

  return { ok: true }
})
