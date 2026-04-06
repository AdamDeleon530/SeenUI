import { requireTenantContext } from '../../utils/tenant'
import { useSupabaseAdmin } from '../../lib/supabase'

// DELETE /api/email-templates/:id — deletes the template (it will be re-created on next provision or can be manually restored)
export default defineEventHandler(async (event) => {
  const { tenantId } = await requireTenantContext(event)
  const id = getRouterParam(event, 'id')
  const db = useSupabaseAdmin()

  const { error } = await db
    .from('email_templates')
    .delete()
    .eq('id', id!)
    .eq('tenant_id', tenantId)

  if (error) throw createError({ statusCode: 500, message: error.message })
  return { ok: true }
})
