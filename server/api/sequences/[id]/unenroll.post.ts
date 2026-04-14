import { requireTenantContext } from '../../../utils/tenant'
import { useSupabaseAdmin } from '../../../lib/supabase'

// POST /api/sequences/:id/unenroll
// Cancel a lead's enrollment in a sequence
export default defineEventHandler(async (event) => {
  const { tenantId } = await requireTenantContext(event)
  const sequenceId = getRouterParam(event, 'id')
  const db = useSupabaseAdmin()

  const body = await readBody<{ lead_id: string }>(event)
  if (!body.lead_id) throw createError({ statusCode: 400, message: 'lead_id is required' })

  const { error } = await db
    .from('sequence_enrollments')
    .update({ status: 'canceled', completed_at: new Date().toISOString() })
    .eq('sequence_id', sequenceId!)
    .eq('lead_id', body.lead_id)
    .eq('tenant_id', tenantId)

  if (error) throw createError({ statusCode: 500, message: error.message })

  await db.from('lead_activities').insert({
    tenant_id:   tenantId,
    lead_id:     body.lead_id,
    user_id:     null,
    type:        'sequence_unenrolled',
    description: 'Removed from email sequence',
    metadata:    { sequence_id: sequenceId },
  })

  return { ok: true }
})
