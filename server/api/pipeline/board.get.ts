import { requireTenantContext } from '../../utils/tenant'
import { useSupabaseAdmin } from '../../lib/supabase'

// GET /api/pipeline/board — stages with leads for kanban view
export default defineEventHandler(async (event) => {
  const { tenantId } = await requireTenantContext(event)
  const db = useSupabaseAdmin()

  // Fetch stages
  const { data: stages, error: stagesError } = await db
    .from('pipeline_stages')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('order_index', { ascending: true })

  if (stagesError) throw createError({ statusCode: 500, message: stagesError.message })

  // Fetch non-archived leads with tags
  const { data: leads, error: leadsError } = await db
    .from('leads')
    .select(`
      id, full_name, email, phone, requested_service, preferred_date,
      status, stage_id, source, created_at, updated_at,
      tags:lead_tags(tag:tags(id, name, color)),
      assigned_user:assigned_to(id, full_name)
    `)
    .eq('tenant_id', tenantId)
    .eq('is_archived', false)
    .order('created_at', { ascending: false })

  if (leadsError) throw createError({ statusCode: 500, message: leadsError.message })

  // Group leads by stage_id
  const leadsByStage = (leads ?? []).reduce<Record<string, any[]>>((acc, lead) => {
    const key = lead.stage_id ?? 'unassigned'
    if (!acc[key]) acc[key] = []
    acc[key].push(lead)
    return acc
  }, {})

  // Attach leads to stages
  const board = (stages ?? []).map(stage => ({
    ...stage,
    leads: leadsByStage[stage.id] ?? [],
    lead_count: (leadsByStage[stage.id] ?? []).length,
  }))

  return board
})
