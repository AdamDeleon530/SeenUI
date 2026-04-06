import { requireTenantContext } from '../../utils/tenant'
import { useSupabaseAdmin } from '../../lib/supabase'

// GET /api/leads — list leads for the current tenant
export default defineEventHandler(async (event) => {
  const { tenantId } = await requireTenantContext(event)
  const db = useSupabaseAdmin()

  const query = getQuery(event)
  const { status, stage_id, search, is_archived, date_from, date_to } = query

  let dbQuery = db
    .from('leads')
    .select(`
      *,
      tags:lead_tags(tag:tags(*)),
      assigned_user:assigned_to(id, full_name, email)
    `)
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })

  // Filters
  if (is_archived !== undefined) {
    dbQuery = dbQuery.eq('is_archived', is_archived === 'true')
  } else {
    dbQuery = dbQuery.eq('is_archived', false)
  }

  if (status) {
    const statuses = (status as string).split(',')
    dbQuery = dbQuery.in('status', statuses)
  }

  if (stage_id) {
    dbQuery = dbQuery.eq('stage_id', stage_id as string)
  }

  if (search) {
    // Use full-text search across name/email/phone
    dbQuery = dbQuery.or(
      `full_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`
    )
  }

  if (date_from) {
    dbQuery = dbQuery.gte('created_at', date_from as string)
  }
  if (date_to) {
    dbQuery = dbQuery.lte('created_at', date_to as string)
  }

  const { data, error } = await dbQuery

  if (error) {
    throw createError({ statusCode: 500, message: error.message })
  }

  return data
})
