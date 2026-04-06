import { requireTenantContext } from '../../../utils/tenant'
import { useSupabaseAdmin } from '../../../lib/supabase'

// POST /api/leads/:id/notes — add a note to a lead
export default defineEventHandler(async (event) => {
  const { userId, tenantId } = await requireTenantContext(event)
  const leadId = getRouterParam(event, 'id')
  const body = await readBody<{ content: string }>(event)

  if (!body.content?.trim()) {
    throw createError({ statusCode: 400, message: 'content is required' })
  }

  const db = useSupabaseAdmin()

  // Verify lead belongs to tenant
  const { data: lead } = await db
    .from('leads')
    .select('id')
    .eq('id', leadId!)
    .eq('tenant_id', tenantId)
    .single()

  if (!lead) throw createError({ statusCode: 404, message: 'Lead not found' })

  const { data: note, error } = await db
    .from('lead_notes')
    .insert({
      tenant_id: tenantId,
      lead_id: leadId,
      user_id: userId,
      content: body.content.trim(),
    })
    .select('*, user:user_id(id, full_name, email)')
    .single()

  if (error) throw createError({ statusCode: 500, message: error.message })

  // Record activity
  await db.from('lead_activities').insert({
    tenant_id: tenantId,
    lead_id: leadId,
    user_id: userId,
    type: 'note_added',
    description: 'Note added',
  })

  return note
})
