<script setup lang="ts">
import AppButton from '~/components/ui/AppButton.vue'
import AppCard from '~/components/ui/AppCard.vue'

definePageMeta({ middleware: ['auth', 'tenant'] })

// ─── Types ────────────────────────────────────────────────────────────────────
interface BillingStatus {
  plan: string
  plan_interval: string | null
  subscription_status: string
  trial_ends_at: string | null
  current_period_ends_at: string | null
  has_subscription: boolean
  days_left_in_trial: number | null
  leads_this_month: number
  leads_limit: number | null
}

const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    monthly: 29,
    annual: 23,
    price_monthly: 'STRIPE_PRICE_STARTER_MONTHLY',
    price_annual: 'STRIPE_PRICE_STARTER_ANNUAL',
    features: ['1 location', '100 leads / month', 'All 3 embed modes', 'Automated emails', 'Email domain verification', 'Pipeline dashboard'],
  },
  {
    id: 'pro',
    name: 'Pro',
    monthly: 79,
    annual: 63,
    price_monthly: 'STRIPE_PRICE_PRO_MONTHLY',
    price_annual: 'STRIPE_PRICE_PRO_ANNUAL',
    highlight: true,
    features: ['1 location', 'Unlimited leads', 'Everything in Starter', 'Custom email templates', 'Follow-up automations', '3 team members'],
  },
  {
    id: 'agency',
    name: 'Agency',
    monthly: 199,
    annual: 159,
    price_monthly: 'STRIPE_PRICE_AGENCY_MONTHLY',
    price_annual: 'STRIPE_PRICE_AGENCY_ANNUAL',
    features: ['Up to 10 locations', 'Unlimited leads', 'Everything in Pro', 'White-label widget', 'Agency dashboard', 'Client management'],
  },
]

// ─── State ────────────────────────────────────────────────────────────────────
const loading       = ref(true)
const status        = ref<BillingStatus | null>(null)
const interval      = ref<'monthly' | 'annual'>('monthly')
const checkingOut   = ref<string | null>(null)
const openingPortal = ref(false)
const route         = useRoute()

const successMsg = computed(() => route.query.success ? 'Subscription activated! Welcome aboard.' : '')
const cancelMsg  = computed(() => route.query.canceled ? 'Checkout canceled — no charge was made.' : '')

// ─── Fetch status ─────────────────────────────────────────────────────────────
async function load() {
  loading.value = true
  try {
    status.value = await $fetch<BillingStatus>('/api/billing/status')
    if (status.value?.plan_interval) interval.value = status.value.plan_interval as 'monthly' | 'annual'
  } finally {
    loading.value = false
  }
}
onMounted(load)

// ─── Checkout ─────────────────────────────────────────────────────────────────
async function checkout(plan: typeof PLANS[0]) {
  const config = useRuntimeConfig()
  // We need to get the actual price ID from the env — since these are private,
  // the server resolves them. We pass the plan key and interval.
  checkingOut.value = plan.id
  try {
    // Send plan + interval; server maps to price ID
    const { url } = await $fetch<{ url: string }>('/api/billing/checkout', {
      method: 'POST',
      body: { plan: plan.id, interval: interval.value },
    })
    if (url) window.location.href = url
  } catch (err: any) {
    alert(err?.data?.message ?? 'Failed to start checkout')
  } finally {
    checkingOut.value = null
  }
}

// ─── Billing portal ───────────────────────────────────────────────────────────
async function openPortal() {
  openingPortal.value = true
  try {
    const { url } = await $fetch<{ url: string }>('/api/billing/portal', { method: 'POST' })
    if (url) window.location.href = url
  } catch (err: any) {
    alert(err?.data?.message ?? 'Failed to open billing portal')
  } finally {
    openingPortal.value = false
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatDate(d: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

const statusColor: Record<string, string> = {
  active:     'bg-green-100 text-green-700',
  trialing:   'bg-blue-100 text-blue-700',
  past_due:   'bg-red-100 text-red-700',
  canceled:   'bg-surface-100 text-surface-500',
  incomplete: 'bg-yellow-100 text-yellow-700',
}

const planLabel: Record<string, string> = {
  trial: 'Free Trial', starter: 'Starter', pro: 'Pro', agency: 'Agency',
}
</script>

<template>
  <div class="p-6 max-w-4xl mx-auto space-y-6">
    <!-- Settings tabs -->
    <div class="flex gap-1 border-b border-surface-200 -mx-6 px-6 overflow-x-auto">
      <NuxtLink
        v-for="tab in [
          { label: 'General',   href: '/settings' },
          { label: 'Embed',     href: '/settings/embed' },
          { label: 'Services',  href: '/settings/services' },
          { label: 'Email',     href: '/settings/email' },
          { label: 'Templates', href: '/settings/templates' },
          { label: 'Billing',   href: '/settings/billing' },
          { label: 'Team',      href: '/settings/team' },
        ]"
        :key="tab.href"
        :to="tab.href"
        class="px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap"
        :class="$route.path === tab.href
          ? 'border-brand-500 text-brand-600'
          : 'border-transparent text-surface-500 hover:text-surface-700'"
      >
        {{ tab.label }}
      </NuxtLink>
    </div>

    <div>
      <h1 class="text-xl font-bold text-surface-900">Billing</h1>
      <p class="text-sm text-surface-500 mt-1">Manage your subscription and plan.</p>
    </div>

    <!-- Alerts -->
    <div v-if="successMsg" class="text-sm text-green-700 bg-green-50 border border-green-200 rounded-xl px-4 py-3">{{ successMsg }}</div>
    <div v-if="cancelMsg"  class="text-sm text-surface-600 bg-surface-50 border border-surface-200 rounded-xl px-4 py-3">{{ cancelMsg }}</div>

    <!-- Loading -->
    <div v-if="loading" class="space-y-3">
      <div v-for="i in 2" :key="i" class="h-24 bg-surface-100 rounded-2xl animate-pulse" />
    </div>

    <template v-else-if="status">

      <!-- Current plan card -->
      <AppCard class="!p-5">
        <div class="flex items-center justify-between flex-wrap gap-4">
          <div>
            <p class="text-xs font-semibold text-surface-500 uppercase tracking-wider mb-1">Current Plan</p>
            <div class="flex items-center gap-3">
              <p class="text-2xl font-black text-surface-900">{{ planLabel[status.plan] }}</p>
              <span
                class="text-xs font-semibold px-2.5 py-1 rounded-full capitalize"
                :class="statusColor[status.subscription_status] ?? 'bg-surface-100 text-surface-500'"
              >
                {{ status.subscription_status }}
              </span>
            </div>

            <!-- Trial countdown -->
            <p v-if="status.days_left_in_trial !== null" class="text-sm text-amber-600 mt-1 font-medium">
              {{ status.days_left_in_trial }} days left in your free trial
            </p>

            <!-- Renewal date -->
            <p v-else-if="status.current_period_ends_at" class="text-sm text-surface-500 mt-1">
              {{ status.subscription_status === 'canceled' ? 'Access until' : 'Renews' }}
              {{ formatDate(status.current_period_ends_at) }}
            </p>
          </div>

          <!-- Manage button -->
          <div v-if="status.has_subscription">
            <AppButton variant="secondary" :loading="openingPortal" @click="openPortal">
              Manage Subscription
            </AppButton>
          </div>
        </div>

        <!-- Lead usage meter -->
        <div v-if="status.leads_limit" class="mt-5 pt-5 border-t border-surface-100">
          <div class="flex items-center justify-between mb-2">
            <p class="text-xs font-medium text-surface-600">Leads this month</p>
            <p class="text-xs text-surface-500">{{ status.leads_this_month }} / {{ status.leads_limit }}</p>
          </div>
          <div class="h-2 bg-surface-100 rounded-full overflow-hidden">
            <div
              class="h-full rounded-full transition-all duration-500"
              :class="(status.leads_this_month / status.leads_limit) > 0.85 ? 'bg-red-500' : 'bg-brand-500'"
              :style="{ width: Math.min(100, (status.leads_this_month / status.leads_limit) * 100) + '%' }"
            />
          </div>
          <p v-if="(status.leads_this_month / status.leads_limit) > 0.85" class="text-xs text-red-600 mt-1.5">
            Approaching your limit — upgrade to Pro for unlimited leads.
          </p>
        </div>
      </AppCard>

      <!-- Billing interval toggle -->
      <div class="flex items-center justify-center gap-3">
        <span class="text-sm font-medium" :class="interval === 'monthly' ? 'text-surface-900' : 'text-surface-400'">Monthly</span>
        <button
          class="w-12 h-6 rounded-full relative transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer"
          :class="interval === 'annual' ? 'bg-brand-500' : 'bg-surface-200'"
          @click="interval = interval === 'monthly' ? 'annual' : 'monthly'"
        >
          <span class="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200"
            :class="interval === 'annual' ? 'translate-x-6' : 'translate-x-0'" />
        </button>
        <span class="text-sm font-medium" :class="interval === 'annual' ? 'text-surface-900' : 'text-surface-400'">
          Annual <span class="text-green-600 font-bold">save 20%</span>
        </span>
      </div>

      <!-- Plan cards -->
      <div class="grid md:grid-cols-3 gap-4">
        <div
          v-for="plan in PLANS"
          :key="plan.id"
          :class="[
            'relative rounded-2xl border p-6 flex flex-col',
            plan.highlight
              ? 'border-brand-400 bg-brand-50 ring-2 ring-brand-400'
              : 'border-surface-200 bg-white',
          ]"
        >
          <!-- Popular badge -->
          <div v-if="plan.highlight" class="absolute -top-3 left-1/2 -translate-x-1/2">
            <span class="bg-brand-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow">Most Popular</span>
          </div>

          <p class="text-base font-bold text-surface-900 mb-1">{{ plan.name }}</p>
          <div class="mb-4">
            <span class="text-3xl font-black text-surface-900">${{ interval === 'annual' ? plan.annual : plan.monthly }}</span>
            <span class="text-sm text-surface-400">/mo</span>
            <p v-if="interval === 'annual'" class="text-xs text-surface-400 mt-0.5">billed annually</p>
          </div>

          <ul class="space-y-2 mb-6 flex-1">
            <li v-for="f in plan.features" :key="f" class="flex items-start gap-2 text-sm text-surface-600">
              <svg class="w-4 h-4 text-brand-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/>
              </svg>
              {{ f }}
            </li>
          </ul>

          <!-- CTA -->
          <div>
            <span
              v-if="status.plan === plan.id"
              class="block text-center text-sm font-semibold text-brand-600 py-2.5 rounded-xl bg-brand-100"
            >
              Current plan
            </span>
            <AppButton
              v-else
              class="w-full"
              :variant="plan.highlight ? 'primary' : 'secondary'"
              :loading="checkingOut === plan.id"
              @click="checkout(plan)"
            >
              {{ status.plan === 'trial' ? 'Start ' + plan.name : 'Switch to ' + plan.name }}
            </AppButton>
          </div>
        </div>
      </div>

      <p class="text-center text-xs text-surface-400">
        All plans include a 14-day free trial. Cancel anytime. Prices in USD.
      </p>
    </template>
  </div>
</template>
