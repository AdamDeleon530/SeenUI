import { requireTenantContext } from '../../utils/tenant'
import { useSupabaseAdmin } from '../../lib/supabase'

// GET /api/sequences — list all sequences with step count and active enrollment count
export default defineEventHandler(async (event) => {
  const { tenantId } = await requireTenantContext(event)
  const db = useSupabaseAdmin()

  const { data, error } = await db
    .from('email_sequences')
    .select(`
      *,
      steps:sequence_steps(id, step_order, delay_days, template_id, subject),
      enrollments:sequence_enrollments(id, status)
    `)
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })

  if (error) throw createError({ statusCode: 500, message: error.message })

  return data ?? []
})
