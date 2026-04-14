import { requireTenantContext } from '../../utils/tenant'
import { useSupabaseAdmin } from '../../lib/supabase'

// GET /api/sequences/:id — fetch a sequence with steps and enrollments
export default defineEventHandler(async (event) => {
  const { tenantId } = await requireTenantContext(event)
  const id = getRouterParam(event, 'id')
  const db = useSupabaseAdmin()

  const { data, error } = await db
    .from('email_sequences')
    .select(`
      *,
      steps:sequence_steps(*, template:email_templates(id, type, subject)),
      enrollments:sequence_enrollments(
        id, status, enrolled_at, next_send_at, current_step, completed_at,
        lead:leads(id, full_name, email, status)
      )
    `)
    .eq('id', id!)
    .eq('tenant_id', tenantId)
    .single()

  if (error || !data) throw createError({ statusCode: 404, message: 'Sequence not found' })

  return data
})
