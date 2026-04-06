import { requireTenantContext } from '../../utils/tenant'
import { useSupabaseAdmin } from '../../lib/supabase'

export default defineEventHandler(async (event) => {
  const { tenantId } = await requireTenantContext(event)
  const body = await readBody<{
    embed_primary_color?: string
    embed_button_text?: string
    embed_heading?: string
    embed_subheading?: string
    requested_service_placeholder?: string
    embed_border_radius?: number
    embed_font_family?: string
    embed_background_color?: string
    embed_text_color?: string
    embed_label_color?: string
    embed_input_border_color?: string
  }>(event)

  const db = useSupabaseAdmin()

  const fields: Record<string, unknown> = {}
  const map: Record<string, unknown> = {
    embed_primary_color: body.embed_primary_color,
    embed_button_text: body.embed_button_text,
    embed_heading: body.embed_heading,
    embed_subheading: body.embed_subheading,
    requested_service_placeholder: body.requested_service_placeholder,
    embed_border_radius: body.embed_border_radius,
    embed_font_family: body.embed_font_family,
    embed_background_color: body.embed_background_color,
    embed_text_color: body.embed_text_color,
    embed_label_color: body.embed_label_color,
    embed_input_border_color: body.embed_input_border_color,
  }
  for (const [k, v] of Object.entries(map)) {
    if (v !== undefined) fields[k] = v
  }

  const { error } = await db
    .from('tenant_settings')
    .update(fields)
    .eq('tenant_id', tenantId)

  if (error) throw createError({ statusCode: 500, message: error.message })

  return { ok: true }
})
