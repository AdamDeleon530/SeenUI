import { serverSupabaseUser } from '#supabase/server'
import { useSupabaseAdmin } from '../../lib/supabase'

// GET /api/agency/tenants — list tenants managed by the current agency
export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) throw createError({ statusCode: 401, message: 'Unauthorized' })

  const db = useSupabaseAdmin()

  // Validate user is agency admin
  const { data: profile } = await db
    .from('user_profiles')
    .select('role, agency_id')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'agency_admin' || !profile.agency_id) {
    throw createError({ statusCode: 403, message: 'Agency admin access required' })
  }

  // Get all tenants in this agency with summary stats
  const { data: memberships } = await db
    .from('agency_tenant_memberships')
    .select('tenant_id')
    .eq('agency_id', profile.agency_id)

  const tenantIds = (memberships ?? []).map(m => m.tenant_id)
  if (!tenantIds.length) return []

  const { data: tenants } = await db
    .from('tenants')
    .select('id, name, slug, logo_url, status, plan, created_at')
    .in('id', tenantIds)
    .order('name')

  // Get lead counts per tenant
  const { data: leadCounts } = await db
    .from('leads')
    .select('tenant_id')
    .in('tenant_id', tenantIds)
    .eq('is_archived', false)

  const countsByTenant = (leadCounts ?? []).reduce<Record<string, number>>((acc, row) => {
    acc[row.tenant_id] = (acc[row.tenant_id] ?? 0) + 1
    return acc
  }, {})

  return (tenants ?? []).map(t => ({
    ...t,
    lead_count: countsByTenant[t.id] ?? 0,
  }))
})
