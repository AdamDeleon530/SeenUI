import { useSupabaseAdmin } from '../../../lib/supabase'

/**
 * GET /api/embed/:tenantId/config
 * Public endpoint — no auth required.
 * Returns the embed configuration for rendering the booking form.
 * Only exposes safe, non-sensitive tenant data.
 */
export default defineEventHandler(async (event) => {
  const tenantId = getRouterParam(event, 'tenantId')
  if (!tenantId) throw createError({ statusCode: 400, message: 'tenantId is required' })

  const db = useSupabaseAdmin()

  const [tenantRes, settingsRes, servicesRes] = await Promise.all([
    db.from('tenants').select('id, name, logo_url, status').eq('id', tenantId).single(),
    db.from('tenant_settings').select(
      'embed_primary_color, embed_button_text, embed_heading, embed_subheading, booking_form_fields'
    ).eq('tenant_id', tenantId).single(),
    db.from('services').select('id, name, duration_minutes')
      .eq('tenant_id', tenantId).eq('is_active', true)
      .order('order_index', { ascending: true }),
  ])

  if (!tenantRes.data || tenantRes.data.status !== 'active') {
    throw createError({ statusCode: 404, message: 'Tenant not found or inactive' })
  }

  return {
    tenant: {
      id: tenantRes.data.id,
      name: tenantRes.data.name,
      logo_url: tenantRes.data.logo_url,
    },
    embed: {
      primary_color: settingsRes.data?.embed_primary_color ?? '#6172f3',
      button_text: settingsRes.data?.embed_button_text ?? 'Book a Consultation',
      heading: settingsRes.data?.embed_heading ?? 'Request an Appointment',
      subheading: settingsRes.data?.embed_subheading ?? null,
      form_fields: settingsRes.data?.booking_form_fields ?? [],
    },
    services: servicesRes.data ?? [],
  }
})
