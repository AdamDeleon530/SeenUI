import { requireTenantContext } from '../../../utils/tenant'
import { useSupabaseAdmin } from '../../../lib/supabase'

// POST /api/leads/:id/tags — add a tag to a lead
export default defineEventHandler(async (event) => {
  const { userId, tenantId } = await requireTenantContext(event)
  const leadId = getRouterParam(event, 'id')
  const body = await readBody<{ tag_id: string }>(event)

  if (!body.tag_id) throw createError({ statusCode: 400, message: 'tag_id is required' })

  const db = useSupabaseAdmin()

  // Validate lead + tag belong to same tenant
  const [leadRes, tagRes] = await Promise.all([
    db.from('leads').select('id').eq('id', leadId!).eq('tenant_id', tenantId).single(),
    db.from('tags').select('id, name').eq('id', body.tag_id).eq('tenant_id', tenantId).single(),
  ])

  if (!leadRes.data) throw createError({ statusCode: 404, message: 'Lead not found' })
  if (!tagRes.data) throw createError({ statusCode: 404, message: 'Tag not found' })

  const { error } = await db
    .from('lead_tags')
    .insert({ lead_id: leadId, tag_id: body.tag_id })

  if (error && !error.message.includes('duplicate')) {
    throw createError({ statusCode: 500, message: error.message })
  }

  await db.from('lead_activities').insert({
    tenant_id: tenantId,
    lead_id: leadId,
    user_id: userId,
    type: 'tag_added',
    description: `Tag "${tagRes.data.name}" added`,
    metadata: { tag_id: body.tag_id, tag_name: tagRes.data.name },
  })

  return { success: true }
})
