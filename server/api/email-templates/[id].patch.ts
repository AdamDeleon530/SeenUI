import { requireTenantContext } from '../../utils/tenant'
import { useSupabaseAdmin } from '../../lib/supabase'

// PATCH /api/email-templates/:id
export default defineEventHandler(async (event) => {
  const { tenantId } = await requireTenantContext(event)
  const id = getRouterParam(event, 'id')
  const db = useSupabaseAdmin()

  const body = await readBody<{
    subject?: string
    body_html?: string
    body_text?: string
    is_enabled?: boolean
  }>(event)

  const fields: Record<string, unknown> = {}
  if (body.subject    !== undefined) fields.subject    = body.subject
  if (body.body_html  !== undefined) fields.body_html  = body.body_html
  if (body.body_text  !== undefined) fields.body_text  = body.body_text
  if (body.is_enabled !== undefined) fields.is_enabled = body.is_enabled

  const { data, error } = await db
    .from('email_templates')
    .update(fields)
    .eq('id', id!)
    .eq('tenant_id', tenantId) // tenant isolation
    .select()
    .single()

  if (error) throw createError({ statusCode: 500, message: error.message })
  return data
})
