import Stripe from 'stripe'
import { useStripe, planFromPriceId } from '../../lib/stripe'
import { useSupabaseAdmin } from '../../lib/supabase'

// POST /api/billing/webhook
// Receives Stripe events and keeps our DB in sync.
// Must be excluded from CSRF / auth middleware — uses Stripe signature verification instead.
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const stripe = useStripe()

  const sig = getHeader(event, 'stripe-signature')
  if (!sig) throw createError({ statusCode: 400, message: 'Missing stripe-signature header' })

  // Read raw body for signature verification
  const rawBody = await readRawBody(event)
  if (!rawBody) throw createError({ statusCode: 400, message: 'Empty body' })

  let stripeEvent: Stripe.Event
  try {
    stripeEvent = stripe.webhooks.constructEvent(rawBody, sig, config.stripeWebhookSecret as string)
  } catch (err: any) {
    throw createError({ statusCode: 400, message: `Webhook signature invalid: ${err.message}` })
  }

  const db = useSupabaseAdmin()

  // ── Handle events ─────────────────────────────────────────────────────────
  switch (stripeEvent.type) {

    case 'checkout.session.completed': {
      const session = stripeEvent.data.object as Stripe.Checkout.Session
      const tenantId = session.metadata?.tenant_id
      if (!tenantId || !session.subscription) break

      const sub = await stripe.subscriptions.retrieve(session.subscription as string)
      const priceId = sub.items.data[0]?.price.id
      const planInfo = planFromPriceId(priceId)

      await db.from('tenants').update({
        stripe_subscription_id: sub.id,
        subscription_status:    sub.status,
        plan:                   planInfo?.plan ?? 'starter',
        plan_interval:          planInfo?.interval ?? 'monthly',
        current_period_ends_at: new Date(sub.current_period_end * 1000).toISOString(),
      }).eq('id', tenantId)
      break
    }

    case 'customer.subscription.updated':
    case 'customer.subscription.created': {
      const sub = stripeEvent.data.object as Stripe.Subscription
      const tenantId = sub.metadata?.tenant_id
      if (!tenantId) break

      const priceId = sub.items.data[0]?.price.id
      const planInfo = planFromPriceId(priceId)

      await db.from('tenants').update({
        stripe_subscription_id: sub.id,
        subscription_status:    sub.status,
        plan:                   planInfo?.plan ?? 'starter',
        plan_interval:          planInfo?.interval ?? 'monthly',
        current_period_ends_at: new Date(sub.current_period_end * 1000).toISOString(),
      }).eq('stripe_customer_id', sub.customer as string)
      break
    }

    case 'customer.subscription.deleted': {
      const sub = stripeEvent.data.object as Stripe.Subscription
      await db.from('tenants').update({
        subscription_status:    'canceled',
        plan:                   'trial',
        stripe_subscription_id: null,
      }).eq('stripe_customer_id', sub.customer as string)
      break
    }

    case 'invoice.payment_failed': {
      const invoice = stripeEvent.data.object as Stripe.Invoice
      if (invoice.subscription) {
        await db.from('tenants').update({
          subscription_status: 'past_due',
        }).eq('stripe_customer_id', invoice.customer as string)
      }
      break
    }
  }

  return { received: true }
})
