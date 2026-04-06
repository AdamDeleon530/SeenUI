import Stripe from 'stripe'

let _stripe: Stripe | null = null

export function useStripe(): Stripe {
  if (!_stripe) {
    const config = useRuntimeConfig()
    if (!config.stripeSecretKey) throw new Error('STRIPE_SECRET_KEY is not configured')
    _stripe = new Stripe(config.stripeSecretKey as string, { apiVersion: '2025-03-31.basil' })
  }
  return _stripe
}

// Map price ID → plan name + interval
export function planFromPriceId(priceId: string): { plan: string; interval: string } | null {
  const config = useRuntimeConfig()
  const p = config.stripePrices as Record<string, string>
  const map: Record<string, { plan: string; interval: string }> = {
    [p.starter_monthly]: { plan: 'starter', interval: 'monthly' },
    [p.starter_annual]:  { plan: 'starter', interval: 'annual' },
    [p.pro_monthly]:     { plan: 'pro',     interval: 'monthly' },
    [p.pro_annual]:      { plan: 'pro',     interval: 'annual' },
    [p.agency_monthly]:  { plan: 'agency',  interval: 'monthly' },
    [p.agency_annual]:   { plan: 'agency',  interval: 'annual' },
  }
  return map[priceId] ?? null
}

export const PLAN_LIMITS: Record<string, { leads_per_month: number; locations: number }> = {
  trial:   { leads_per_month: 25,       locations: 1 },
  starter: { leads_per_month: 100,      locations: 1 },
  pro:     { leads_per_month: Infinity, locations: 1 },
  agency:  { leads_per_month: Infinity, locations: 10 },
}
