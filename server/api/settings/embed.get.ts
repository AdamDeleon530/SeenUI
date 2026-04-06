import { requireTenantContext } from '../../utils/tenant'
import { useSupabaseAdmin } from '../../lib/supabase'

// GET /api/settings/embed — get embed config + generated snippet
export default defineEventHandler(async (event) => {
  const { tenantId } = await requireTenantContext(event)
  const config = useRuntimeConfig()
  const db = useSupabaseAdmin()

  const { data } = await db
    .from('tenant_settings')
    .select('embed_primary_color, embed_button_text, embed_heading, embed_subheading, requested_service_placeholder, embed_border_radius, embed_font_family, embed_background_color, embed_text_color, embed_label_color, embed_input_border_color')
    .eq('tenant_id', tenantId)
    .single()

  const appUrl = config.appUrl

  // Generate the three embed snippet variants
  const snippets = {
    inline: `<!-- Local Booking Engine: Inline Form -->
<div id="lbe-booking-form" data-tenant="${tenantId}"></div>
<script src="${appUrl}/embed/widget.js" async></script>`,

    floating: `<!-- Local Booking Engine: Floating CTA Button -->
<div id="lbe-floating" data-tenant="${tenantId}" data-mode="floating"></div>
<script src="${appUrl}/embed/widget.js" async></script>`,

    modal: `<!-- Local Booking Engine: Modal Trigger (add data-lbe-trigger to any button) -->
<button data-lbe-trigger data-tenant="${tenantId}">Book a Consultation</button>
<script src="${appUrl}/embed/widget.js" async></script>`,
  }

  return {
    settings: data,
    tenant_id: tenantId,
    snippets,
    api_url: `${appUrl}/api/embed/${tenantId}`,
  }
})
