import { requireTenantContext } from '../../utils/tenant'
import { useSupabaseAdmin } from '../../lib/supabase'

// DELETE /api/sequences/:id
export default defineEventHandler(async (event) => {
  const { tenantId } = await requireTenantContext(event)
  const id = getRouterParam(event, 'id')
  const db = useSupabaseAdmin()

  const { error } = await db
    .from('email_sequences')
    .delete()
    .eq('id', id!)
    .eq('tenant_id', tenantId)

  if (error) throw createError({ statusCode: 500, message: error.message })

  return { ok: true }
})
