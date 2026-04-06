import { requireTenantContext } from '../../utils/tenant'
import { useSupabaseAdmin } from '../../lib/supabase'
import { PLAN_LIMITS } from '../../lib/stripe'

// GET /api/billing/status
export default defineEventHandler(async (event) => {
  const { tenantId } = await requireTenantContext(event)
  const db = useSupabaseAdmin()

  const { data } = await db
    .from('tenants')
    .select('plan, plan_interval, subscription_status, trial_ends_at, current_period_ends_at, stripe_subscription_id')
    .eq('id', tenantId)
    .single()

  // Count leads this month
  const monthStart = new Date()
  monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0)

  const { count: leadsThisMonth } = await db
    .from('leads')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)
    .gte('created_at', monthStart.toISOString())

  const plan = data?.plan ?? 'trial'
  const limits = PLAN_LIMITS[plan]
  const trialActive = plan === 'trial' && data?.trial_ends_at && new Date(data.trial_ends_at) > new Date()
  const daysLeftInTrial = trialActive
    ? Math.ceil((new Date(data!.trial_ends_at).getTime() - Date.now()) / 86400000)
    : null

  return {
    plan,
    plan_interval:          data?.plan_interval ?? null,
    subscription_status:    data?.subscription_status ?? 'trialing',
    trial_ends_at:          data?.trial_ends_at ?? null,
    current_period_ends_at: data?.current_period_ends_at ?? null,
    has_subscription:       !!data?.stripe_subscription_id,
    days_left_in_trial:     daysLeftInTrial,
    leads_this_month:       leadsThisMonth ?? 0,
    leads_limit:            limits.leads_per_month === Infinity ? null : limits.leads_per_month,
  }
})
