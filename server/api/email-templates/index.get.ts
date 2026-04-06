import { requireTenantContext } from '../../utils/tenant'
import { useSupabaseAdmin } from '../../lib/supabase'

// GET /api/email-templates — list all templates for the tenant
export default defineEventHandler(async (event) => {
  const { tenantId } = await requireTenantContext(event)
  const db = useSupabaseAdmin()

  const { data, error } = await db
    .from('email_templates')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: true })

  if (error) throw createError({ statusCode: 500, message: error.message })
  return data ?? []
})
