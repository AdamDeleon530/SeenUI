import { requireTenantContext } from '../../utils/tenant'
import { useSupabaseAdmin } from '../../lib/supabase'

export default defineEventHandler(async (event) => {
  const { tenantId } = await requireTenantContext(event)
  const body = await readBody<{ name: string; duration_minutes?: number }>(event)

  if (!body.name?.trim()) throw createError({ statusCode: 400, message: 'name is required' })

  const db = useSupabaseAdmin()

  // Set order_index to end of list
  const { count } = await db
    .from('services')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)

  const { data, error } = await db
    .from('services')
    .insert({
      tenant_id: tenantId,
      name: body.name.trim(),
      duration_minutes: body.duration_minutes ?? null,
      order_index: count ?? 0,
    })
    .select()
    .single()

  if (error) throw createError({ statusCode: 500, message: error.message })
  return data
})
