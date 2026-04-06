import { useSupabaseAdmin } from '../lib/supabase'

/**
 * Resolves the tenant_id for a given authenticated user.
 * Uses the service role client so it works even before RLS context is set.
 * Throws 401 if no user, 403 if no tenant.
 */
export async function resolveTenantFromUser(userId: string): Promise<string> {
  const db = useSupabaseAdmin()
  const { data, error } = await db
    .from('user_profiles')
    .select('tenant_id, role')
    .eq('id', userId)
    .single()

  if (error || !data) {
    throw createError({ statusCode: 403, message: 'User profile not found' })
  }
  if (!data.tenant_id) {
    throw createError({ statusCode: 403, message: 'No tenant assigned to user' })
  }
  return data.tenant_id
}

/**
 * Validates that a user has access to a given tenant.
 * Agency admins can access any tenant in their agency.
 */
export async function validateTenantAccess(userId: string, tenantId: string): Promise<void> {
  const db = useSupabaseAdmin()
  const { data: profile } = await db
    .from('user_profiles')
    .select('tenant_id, role, agency_id')
    .eq('id', userId)
    .single()

  if (!profile) throw createError({ statusCode: 403, message: 'Forbidden' })

  // Direct tenant match
  if (profile.tenant_id === tenantId) return

  // Agency admin check
  if (profile.role === 'agency_admin' && profile.agency_id) {
    const { data: membership } = await db
      .from('agency_tenant_memberships')
      .select('id')
      .eq('agency_id', profile.agency_id)
      .eq('tenant_id', tenantId)
      .single()
    if (membership) return
  }

  throw createError({ statusCode: 403, message: 'Forbidden: no access to this tenant' })
}

/**
 * Convenience: get both user and tenantId from event, with validation.
 * Use at the top of protected API route handlers.
 */
export async function requireTenantContext(event: any): Promise<{ userId: string; tenantId: string }> {
  const { getAuthenticatedUser } = await import('../lib/supabase')
  const user = await getAuthenticatedUser(event)
  if (!user) throw createError({ statusCode: 401, message: 'Unauthorized' })

  const tenantId = await resolveTenantFromUser(user.id)
  return { userId: user.id, tenantId }
}
