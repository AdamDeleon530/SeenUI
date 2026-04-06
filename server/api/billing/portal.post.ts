import { requireTenantContext } from '../../utils/tenant'
import { useSupabaseAdmin } from '../../lib/supabase'
import { useStripe } from '../../lib/stripe'

// POST /api/billing/portal
// Opens Stripe's hosted billing portal (manage card, cancel, upgrade)
export default defineEventHandler(async (event) => {
  const { tenantId } = await requireTenantContext(event)
  const config = useRuntimeConfig()
  const db = useSupabaseAdmin()
  const stripe = useStripe()

  const { data: tenant } = await db
    .from('tenants')
    .select('stripe_customer_id')
    .eq('id', tenantId)
    .single()

  if (!tenant?.stripe_customer_id) {
    throw createError({ statusCode: 400, message: 'No billing account found. Please subscribe first.' })
  }

  const appUrl = config.appUrl.replace(/\/$/, '')

  const session = await stripe.billingPortal.sessions.create({
    customer: tenant.stripe_customer_id,
    return_url: `${appUrl}/settings/billing`,
  })

  return { url: session.url }
})
