import { requireTenantContext } from '../../utils/tenant'
import { useSupabaseAdmin } from '../../lib/supabase'

// DELETE /api/leads/:id — archive (soft delete) a lead
export default defineEventHandler(async (event) => {
  const { tenantId } = await requireTenantContext(event)
  const id = getRouterParam(event, 'id')

  const db = useSupabaseAdmin()
  const { error } = await db
    .from('leads')
    .update({ is_archived: true })
    .eq('id', id!)
    .eq('tenant_id', tenantId)

  if (error) throw createError({ statusCode: 500, message: error.message })

  return { success: true }
})
