import { requireTenantContext } from '../../../utils/tenant'
import { useSupabaseAdmin } from '../../../lib/supabase'

// GET /api/sms/:leadId/messages — fetch SMS thread for a lead
export default defineEventHandler(async (event) => {
  const { tenantId } = await requireTenantContext(event)
  const leadId = getRouterParam(event, 'leadId')

  if (!leadId) throw createError({ statusCode: 400, message: 'leadId is required' })

  const db = useSupabaseAdmin()

  const { data: messages, error } = await db
    .from('sms_messages')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('lead_id', leadId)
    .order('sent_at', { ascending: true })

  if (error) throw createError({ statusCode: 500, message: error.message })

  return messages ?? []
})
