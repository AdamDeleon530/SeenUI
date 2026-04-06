import { requireTenantContext } from '../../utils/tenant'
import { useSupabaseAdmin } from '../../lib/supabase'

// GET /api/pipeline/stages — list pipeline stages for current tenant
export default defineEventHandler(async (event) => {
  const { tenantId } = await requireTenantContext(event)
  const db = useSupabaseAdmin()

  const { data, error } = await db
    .from('pipeline_stages')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('order_index', { ascending: true })

  if (error) throw createError({ statusCode: 500, message: error.message })

  return data
})
