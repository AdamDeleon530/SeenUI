<script setup lang="ts">
definePageMeta({ layout: false })

useHead({
  title: 'Pricing — Local Booking Engine',
  meta: [
    { name: 'description', content: 'Simple, transparent pricing for local businesses and agencies. Start free for 14 days, no credit card required.' },
    { property: 'og:title', content: 'Pricing — Local Booking Engine' },
    { name: 'robots', content: 'index, follow' },
  ],
  link: [
    { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
    { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
    { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap' },
  ],
})

const interval = ref<'monthly' | 'annual'>('monthly')

const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    tagline: 'Perfect for solopreneurs',
    monthly: 29,
    annual: 23,
    cta: 'Start free trial',
    features: [
      '1 location',
      '100 leads per month',
      'All 3 embed modes (inline, float, modal)',
      'Custom branded widget',
      'Automated confirmation emails',
      'Visual pipeline dashboard',
      'Email domain verification',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    tagline: 'For growing businesses',
    monthly: 79,
    annual: 63,
    cta: 'Start free trial',
    highlight: true,
    features: [
      '1 location',
      'Unlimited leads',
      'Everything in Starter',
      'Custom email templates',
      'Follow-up automations',
      '3 team members',
      'Priority support',
    ],
  },
  {
    id: 'agency',
    name: 'Agency',
    tagline: 'For agencies & multi-location',
    monthly: 199,
    annual: 159,
    cta: 'Start free trial',
    features: [
      'Up to 10 client locations',
      'Unlimited leads across all locations',
      'Everything in Pro',
      'White-label widget (no "Powered by")',
      'Agency management dashboard',
      'Per-client branding & pipeline',
      'Dedicated support',
    ],
  },
]

const COMPARE = [
  { feature: 'Locations',              starter: '1',      pro: '1',         agency: 'Up to 10' },
  { feature: 'Leads per month',        starter: '100',    pro: 'Unlimited', agency: 'Unlimited' },
  { feature: 'Embed modes',            starter: true,     pro: true,        agency: true },
  { feature: 'Custom branding',        starter: true,     pro: true,        agency: true },
  { feature: 'Pipeline dashboard',     starter: true,     pro: true,        agency: true },
  { feature: 'Automated emails',       starter: true,     pro: true,        agency: true },
  { feature: 'Custom email templates', starter: false,    pro: true,        agency: true },
  { feature: 'Follow-up automations',  starter: false,    pro: true,        agency: true },
  { feature: 'Team members',           starter: '1',      pro: '3',         agency: 'Unlimited' },
  { feature: 'White-label widget',     starter: false,    pro: false,       agency: true },
  { feature: 'Agency dashboard',       starter: false,    pro: false,       agency: true },
]

const faqs = [
  { q: 'Is there a free trial?',                   a: 'Yes — every plan starts with a 14-day free trial. No credit card required.' },
  { q: 'Can I cancel anytime?',                    a: 'Yes. Cancel from the billing portal anytime. You keep access until the end of your billing period.' },
  { q: 'What happens when I hit my lead limit?',   a: 'The widget stops accepting new submissions and shows a friendly message. You\'ll receive an email warning at 85%.' },
  { q: 'Can I switch plans?',                      a: 'Yes — upgrade or downgrade anytime. Stripe prorates the difference automatically.' },
  { q: 'What counts as a "location"?',             a: 'Each business or client with its own widget, pipeline, and settings counts as one location.' },
  { q: 'Do you offer refunds?',                    a: 'If you\'re not satisfied within the first 30 days, contact us and we\'ll make it right.' },
]

const openFaq = ref<number | null>(null)
</script>

<template>
  <div style="font-family:'Inter',system-ui,sans-serif;background:#fff;color:#111827;">

    <!-- Nav -->
    <nav class="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-surface-100">
      <div class="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <NuxtLink to="/" class="flex items-center gap-2.5 cursor-pointer">
          <div class="w-8 h-8 rounded-xl bg-brand-500 flex items-center justify-center shadow-md shadow-brand-500/30">
            <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
            </svg>
          </div>
          <span class="font-bold text-surface-900 text-[15px]">Local Booking Engine</span>
        </NuxtLink>
        <div class="flex items-center gap-3">
          <NuxtLink to="/login"    class="text-sm font-semibold text-surface-600 hover:text-surface-900 transition-colors cursor-pointer">Sign in</NuxtLink>
          <NuxtLink to="/register" class="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-500 text-white text-sm font-bold hover:bg-brand-600 transition-colors shadow-md shadow-brand-500/25 cursor-pointer">
            Get started free
          </NuxtLink>
        </div>
      </div>
    </nav>

    <!-- Header -->
    <section class="pt-20 pb-12 text-center px-6">
      <p class="text-xs font-bold text-brand-500 uppercase tracking-widest mb-3">Pricing</p>
      <h1 class="text-4xl md:text-5xl font-black text-surface-900 tracking-tight mb-4">
        Simple, transparent pricing
      </h1>
      <p class="text-lg text-surface-500 max-w-xl mx-auto mb-8">
        Start with a 14-day free trial. No credit card required. Cancel anytime.
      </p>

      <!-- Interval toggle -->
      <div class="inline-flex items-center gap-3 bg-surface-100 rounded-2xl p-1.5">
        <button
          class="px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer"
          :class="interval === 'monthly' ? 'bg-white text-surface-900 shadow-sm' : 'text-surface-500'"
          @click="interval = 'monthly'"
        >
          Monthly
        </button>
        <button
          class="px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer flex items-center gap-1.5"
          :class="interval === 'annual' ? 'bg-white text-surface-900 shadow-sm' : 'text-surface-500'"
          @click="interval = 'annual'"
        >
          Annual
          <span class="text-xs font-bold text-green-600 bg-green-100 px-1.5 py-0.5 rounded-md">-20%</span>
        </button>
      </div>
    </section>

    <!-- Plan cards -->
    <section class="max-w-5xl mx-auto px-6 pb-16">
      <div class="grid md:grid-cols-3 gap-5">
        <div
          v-for="plan in PLANS"
          :key="plan.id"
          :class="[
            'relative rounded-2xl border p-7 flex flex-col',
            plan.highlight
              ? 'border-brand-400 bg-gradient-to-b from-brand-50 to-white ring-2 ring-brand-400 shadow-xl shadow-brand-500/10'
              : 'border-surface-200 bg-white',
          ]"
        >
          <div v-if="plan.highlight" class="absolute -top-3.5 left-1/2 -translate-x-1/2">
            <span class="bg-brand-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg shadow-brand-500/30">Most Popular</span>
          </div>

          <p class="text-base font-bold text-surface-900">{{ plan.name }}</p>
          <p class="text-xs text-surface-400 mt-0.5 mb-5">{{ plan.tagline }}</p>

          <div class="mb-6">
            <div class="flex items-end gap-1">
              <span class="text-4xl font-black text-surface-900">${{ interval === 'annual' ? plan.annual : plan.monthly }}</span>
              <span class="text-surface-400 text-sm mb-1">/mo</span>
            </div>
            <p v-if="interval === 'annual'" class="text-xs text-surface-400 mt-0.5">
              ${{ (plan.annual * 12).toFixed(0) }} billed annually
            </p>
          </div>

          <NuxtLink
            to="/register"
            :class="[
              'block text-center py-3 rounded-xl font-bold text-sm transition-colors cursor-pointer mb-6',
              plan.highlight
                ? 'bg-brand-500 text-white hover:bg-brand-600 shadow-md shadow-brand-500/25'
                : 'border border-surface-200 text-surface-700 hover:bg-surface-50',
            ]"
          >
            {{ plan.cta }}
          </NuxtLink>

          <ul class="space-y-2.5 flex-1">
            <li v-for="f in plan.features" :key="f" class="flex items-start gap-2.5 text-sm text-surface-600">
              <svg class="w-4 h-4 text-brand-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/>
              </svg>
              {{ f }}
            </li>
          </ul>
        </div>
      </div>
    </section>

    <!-- Comparison table -->
    <section class="max-w-4xl mx-auto px-6 pb-20">
      <h2 class="text-2xl font-black text-surface-900 text-center mb-8">Compare plans</h2>
      <div class="rounded-2xl border border-surface-200 overflow-hidden">
        <table class="w-full text-sm">
          <thead>
            <tr class="bg-surface-50 border-b border-surface-200">
              <th class="text-left px-5 py-3.5 font-semibold text-surface-600 w-1/2">Feature</th>
              <th class="text-center px-4 py-3.5 font-bold text-surface-700">Starter</th>
              <th class="text-center px-4 py-3.5 font-bold text-brand-600 bg-brand-50">Pro</th>
              <th class="text-center px-4 py-3.5 font-bold text-surface-700">Agency</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, i) in COMPARE" :key="row.feature" :class="i % 2 === 0 ? 'bg-white' : 'bg-surface-50/50'">
              <td class="px-5 py-3 text-surface-600">{{ row.feature }}</td>
              <td class="px-4 py-3 text-center">
                <template v-if="typeof row.starter === 'boolean'">
                  <svg v-if="row.starter" class="w-4 h-4 text-brand-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>
                  <span v-else class="text-surface-300">—</span>
                </template>
                <span v-else class="text-surface-700 font-medium">{{ row.starter }}</span>
              </td>
              <td class="px-4 py-3 text-center bg-brand-50/50">
                <template v-if="typeof row.pro === 'boolean'">
                  <svg v-if="row.pro" class="w-4 h-4 text-brand-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>
                  <span v-else class="text-surface-300">—</span>
                </template>
                <span v-else class="text-surface-700 font-medium">{{ row.pro }}</span>
              </td>
              <td class="px-4 py-3 text-center">
                <template v-if="typeof row.agency === 'boolean'">
                  <svg v-if="row.agency" class="w-4 h-4 text-brand-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>
                  <span v-else class="text-surface-300">—</span>
                </template>
                <span v-else class="text-surface-700 font-medium">{{ row.agency }}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- FAQ -->
    <section class="max-w-2xl mx-auto px-6 pb-24">
      <h2 class="text-2xl font-black text-surface-900 text-center mb-8">Pricing FAQ</h2>
      <div class="space-y-2">
        <div v-for="(faq, i) in faqs" :key="i" class="border border-surface-100 rounded-2xl overflow-hidden bg-white">
          <button
            class="w-full flex items-center justify-between px-5 py-4 text-left cursor-pointer hover:bg-surface-50 transition-colors"
            @click="openFaq = openFaq === i ? null : i"
          >
            <span class="text-sm font-semibold text-surface-900 pr-4">{{ faq.q }}</span>
            <svg class="w-4 h-4 text-surface-400 flex-shrink-0 transition-transform duration-200"
              :class="openFaq === i ? 'rotate-180' : ''"
              fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
            </svg>
          </button>
          <Transition enter-active-class="transition-all duration-200" enter-from-class="opacity-0" enter-to-class="opacity-100" leave-active-class="transition-all duration-150" leave-from-class="opacity-100" leave-to-class="opacity-0">
            <div v-if="openFaq === i">
              <p class="px-5 pb-5 text-sm text-surface-500 leading-relaxed">{{ faq.a }}</p>
            </div>
          </Transition>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer class="border-t border-surface-100 py-8">
      <div class="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div class="flex items-center gap-2">
          <div class="w-6 h-6 rounded-lg bg-brand-500 flex items-center justify-center">
            <svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
            </svg>
          </div>
          <span class="text-sm font-semibold text-surface-700">Local Booking Engine</span>
        </div>
        <p class="text-xs text-surface-400">&copy; {{ new Date().getFullYear() }} Local Booking Engine.</p>
        <div class="flex gap-5">
          <NuxtLink to="/"         class="text-xs text-surface-400 hover:text-surface-600 cursor-pointer">Home</NuxtLink>
          <NuxtLink to="/login"    class="text-xs text-surface-400 hover:text-surface-600 cursor-pointer">Sign in</NuxtLink>
          <NuxtLink to="/register" class="text-xs text-surface-400 hover:text-surface-600 cursor-pointer">Get started</NuxtLink>
        </div>
      </div>
    </footer>
  </div>
</template>
