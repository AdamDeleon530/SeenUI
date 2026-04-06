import { requireTenantContext } from '../../utils/tenant'
import { useSupabaseAdmin } from '../../lib/supabase'
import { useStripe } from '../../lib/stripe'

// POST /api/billing/checkout
// Creates a Stripe Checkout session and returns the URL
export default defineEventHandler(async (event) => {
  const { tenantId } = await requireTenantContext(event)
  const config = useRuntimeConfig()
  const db = useSupabaseAdmin()
  const stripe = useStripe()

  const body = await readBody<{ plan: string; interval: 'monthly' | 'annual' }>(event)
  if (!body.plan || !body.interval) throw createError({ statusCode: 400, message: 'plan and interval are required' })

  // Resolve price ID server-side (never trust client-supplied price IDs)
  const prices = config.stripePrices as Record<string, string>
  const key = `${body.plan}_${body.interval}` // e.g. "pro_monthly"
  const priceId = prices[key]
  if (!priceId) throw createError({ statusCode: 400, message: 'Invalid plan or interval' })

  // Fetch tenant + user info
  const { data: tenant } = await db
    .from('tenants')
    .select('id, name, stripe_customer_id, notification_email')
    .eq('id', tenantId)
    .single()

  if (!tenant) throw createError({ statusCode: 404, message: 'Tenant not found' })

  // Reuse existing Stripe customer or create one
  let customerId = tenant.stripe_customer_id
  if (!customerId) {
    const customer = await stripe.customers.create({
      name: tenant.name,
      email: tenant.notification_email ?? undefined,
      metadata: { tenant_id: tenantId },
    })
    customerId = customer.id

    await db
      .from('tenants')
      .update({ stripe_customer_id: customerId })
      .eq('id', tenantId)
  }

  const appUrl = config.appUrl.replace(/\/$/, '')

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${appUrl}/settings/billing?success=1`,
    cancel_url:  `${appUrl}/settings/billing?canceled=1`,
    metadata: { tenant_id: tenantId },
    subscription_data: {
      metadata: { tenant_id: tenantId },
      trial_end: 'continue',
    },
    allow_promotion_codes: true,
  })

  return { url: session.url }
})
