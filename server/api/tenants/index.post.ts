import { serverSupabaseUser } from '#supabase/server'
import { useSupabaseAdmin } from '../../lib/supabase'

// POST /api/tenants — create a new tenant (called during onboarding)
export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) throw createError({ statusCode: 401, message: 'Unauthorized' })

  const body = await readBody<{ name: string; slug: string; notification_email?: string; timezone?: string }>(event)

  if (!body.name?.trim()) throw createError({ statusCode: 400, message: 'name is required' })
  if (!body.slug?.trim()) throw createError({ statusCode: 400, message: 'slug is required' })

  // Validate slug format
  if (!/^[a-z0-9-]+$/.test(body.slug)) {
    throw createError({ statusCode: 400, message: 'Slug must be lowercase letters, numbers, and hyphens only' })
  }

  const db = useSupabaseAdmin()

  // Create tenant
  const { data: tenant, error: tenantError } = await db
    .from('tenants')
    .insert({
      name: body.name.trim(),
      slug: body.slug.trim(),
      notification_email: body.notification_email ?? user.email,
      timezone: body.timezone ?? 'America/New_York',
    })
    .select()
    .single()

  if (tenantError) {
    if (tenantError.message.includes('unique')) {
      throw createError({ statusCode: 409, message: 'A business with that slug already exists' })
    }
    throw createError({ statusCode: 500, message: tenantError.message })
  }

  // Assign tenant to user profile
  await db
    .from('user_profiles')
    .update({ tenant_id: tenant.id, role: 'business_owner' })
    .eq('id', user.id)

  // Provision defaults (pipeline stages, email templates, tags)
  await db.rpc('provision_new_tenant', {
    p_tenant_id: tenant.id,
    p_business_name: tenant.name,
  })

  return tenant
})
