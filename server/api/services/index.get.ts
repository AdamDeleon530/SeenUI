import { requireTenantContext } from '../../utils/tenant'
import { useSupabaseAdmin } from '../../lib/supabase'

export default defineEventHandler(async (event) => {
  const { tenantId } = await requireTenantContext(event)
  const db = useSupabaseAdmin()

  const { data, error } = await db
    .from('services')
    .select('id, name, description, duration_minutes, is_active, order_index')
    .eq('tenant_id', tenantId)
    .order('order_index', { ascending: true })

  if (error) throw createError({ statusCode: 500, message: error.message })
  return data ?? []
})
