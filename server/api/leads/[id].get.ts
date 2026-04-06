import { requireTenantContext } from '../../utils/tenant'
import { useSupabaseAdmin } from '../../lib/supabase'

// GET /api/leads/:id — get single lead with full detail
export default defineEventHandler(async (event) => {
  const { tenantId } = await requireTenantContext(event)
  const id = getRouterParam(event, 'id')

  const db = useSupabaseAdmin()
  const { data, error } = await db
    .from('leads')
    .select(`
      *,
      tags:lead_tags(tag:tags(*)),
      activities:lead_activities(*),
      notes:lead_notes(*)
    `)
    .eq('id', id!)
    .eq('tenant_id', tenantId) // enforces tenant isolation
    .single()

  if (error || !data) {
    throw createError({ statusCode: 404, message: 'Lead not found' })
  }

  // Sort activities and notes by created_at desc
  if (data.activities) {
    data.activities.sort((a: any, b: any) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
  }

  return data
})
