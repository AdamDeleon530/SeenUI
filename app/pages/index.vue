<script setup lang="ts">
definePageMeta({ layout: false })

const user = useSupabaseUser()
if (user.value) {
  await navigateTo('/dashboard', { replace: true })
}

const SITE_URL = 'https://localbookingengine.com'
const PRODUCT  = 'Local Booking Engine'
const TAGLINE  = 'Turn Website Visitors Into Booked Clients — Automatically'
const DESC     = 'The embeddable booking widget built for local businesses. Add a beautifully branded booking form to any website in minutes. Capture leads, track your pipeline, and send automated follow-ups — no booking platform required.'

useHead({
  title: `${PRODUCT} — ${TAGLINE}`,
  meta: [
    { name: 'description', content: DESC },
    { name: 'keywords', content: 'booking widget, local business booking, embeddable booking form, lead capture, appointment booking software, med spa booking, beauty salon booking, booking pipeline' },
    { property: 'og:title', content: `${PRODUCT} — ${TAGLINE}` },
    { property: 'og:description', content: DESC },
    { property: 'og:type', content: 'website' },
    { property: 'og:url', content: SITE_URL },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'robots', content: 'index, follow' },
    { charset: 'utf-8' },
    { name: 'viewport', content: 'width=device-width, initial-scale=1' },
  ],
  link: [
    { rel: 'canonical', href: SITE_URL },
    { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
    { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
    { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap' },
  ],
  script: [{
    type: 'application/ld+json',
    innerHTML: JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: PRODUCT,
      description: DESC,
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web',
      url: SITE_URL,
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    }),
  }],
})

const steps = [
  { n: '01', title: 'Create your account', body: 'Sign up free. Set up your business profile in two minutes.' },
  { n: '02', title: 'Design your widget',  body: 'Customize colors, fonts, and copy. See changes live.' },
  { n: '03', title: 'Paste one line',       body: 'Copy the snippet. Works on any website platform.' },
  { n: '04', title: 'Watch leads come in',  body: 'Every submission lands in your pipeline instantly.' },
]

const features = [
  { icon: 'code',    title: 'Embed Anywhere',      body: 'One snippet. Works on WordPress, Webflow, Squarespace, Wix, Shopify, or raw HTML. Three modes: inline form, floating button, or modal trigger.', wide: true },
  { icon: 'palette', title: 'Pixel-Perfect Branding', body: 'Full control over colors, fonts, border radius, and copy — with a live preview before you publish.' },
  { icon: 'kanban',  title: 'Visual Pipeline',     body: 'Drag-and-drop Kanban board. See every lead\'s stage at a glance. Never lose track of a prospect again.' },
  { icon: 'mail',    title: 'Automated Emails',    body: 'Instant confirmations, new lead alerts, follow-ups, and review requests — all automatic, all customizable.' },
  { icon: 'shield',  title: 'Inbox Delivery',      body: 'Verify your own domain (SPF + DKIM) so emails land in the inbox — not spam. Guided setup, no tech skills needed.' },
  { icon: 'building', title: 'Agency Ready',       body: 'Manage multiple locations under one account. Each with its own widget, pipeline, and email templates.', wide: true },
]

const stats = [
  { value: '< 5 min', label: 'To go live' },
  { value: '3',       label: 'Embed modes' },
  { value: '100%',    label: 'Your branding' },
  { value: '0',       label: 'Booking platform fees' },
]

const faqs = [
  { q: 'Does this work with my website?',          a: 'Yes — it\'s a JavaScript snippet that works on any website including WordPress, Webflow, Squarespace, Wix, Shopify, or hand-coded HTML.' },
  { q: 'Will the widget match my brand?',           a: 'Absolutely. You control the primary color, background, text color, button text, fonts, and border radius. There\'s a live preview so you see exactly how it looks before embedding.' },
  { q: 'What happens when someone submits?',        a: 'Three things instantly: (1) the lead appears in your pipeline dashboard, (2) the customer gets a confirmation email, (3) you get a new lead notification.' },
  { q: 'Do I need technical skills?',               a: 'No. If you can paste a YouTube embed on your site, you can add this widget. Setup is one copy-paste.' },
  { q: 'Can I use my own email address?',           a: 'Yes. Verify your domain (e.g. bookings@yourbusiness.com) so emails come from your address. Dramatically improves deliverability.' },
  { q: 'Does it work for agencies?',                a: 'Yes. Manage multiple businesses under one account, each with their own styling, pipeline, and email templates.' },
]

const openFaq = ref<number | null>(null)
function toggleFaq(i: number) {
  openFaq.value = openFaq.value === i ? null : i
}

const iconMap: Record<string, string> = {
  code:     `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"/></svg>`,
  palette:  `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"/></svg>`,
  kanban:   `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"/></svg>`,
  mail:     `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>`,
  shield:   `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>`,
  building: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>`,
}
</script>

<template>
  <div class="lbe-site">

    <!-- ── Navbar ─────────────────────────────────────────────────────────── -->
    <nav class="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-surface-100/80">
      <div class="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <a href="/" class="flex items-center gap-2.5 cursor-pointer">
          <div class="w-8 h-8 rounded-xl bg-brand-500 flex items-center justify-center shadow-lg shadow-brand-500/30 flex-shrink-0">
            <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
            </svg>
          </div>
          <span class="font-bold text-surface-900 text-[15px]">Local Booking Engine</span>
        </a>
        <div class="hidden md:flex items-center gap-7">
          <a href="#features"  class="text-sm text-surface-500 hover:text-surface-900 transition-colors cursor-pointer font-medium">Features</a>
          <a href="#how"       class="text-sm text-surface-500 hover:text-surface-900 transition-colors cursor-pointer font-medium">How It Works</a>
          <a href="#faq"       class="text-sm text-surface-500 hover:text-surface-900 transition-colors cursor-pointer font-medium">FAQ</a>
        </div>
        <div class="flex items-center gap-3">
          <NuxtLink to="/login" class="text-sm font-semibold text-surface-600 hover:text-surface-900 transition-colors cursor-pointer">Sign in</NuxtLink>
          <NuxtLink to="/register" class="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-500 text-white text-sm font-bold hover:bg-brand-600 transition-colors shadow-md shadow-brand-500/25 cursor-pointer">
            Get started free
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7"/>
            </svg>
          </NuxtLink>
        </div>
      </div>
    </nav>

    <!-- ── Hero ──────────────────────────────────────────────────────────── -->
    <section class="hero-bg pt-32 pb-24 md:pt-40 md:pb-32">
      <div class="aurora-1" aria-hidden="true" />
      <div class="aurora-2" aria-hidden="true" />
      <div class="aurora-3" aria-hidden="true" />

      <div class="relative max-w-6xl mx-auto px-6">
        <div class="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">

          <!-- Left: copy -->
          <div>
            <div class="pill-badge bg-white/10 text-indigo-300 border border-white/15 mb-6">
              <span class="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              Embed on any website in minutes
            </div>

            <h1 class="text-4xl md:text-5xl xl:text-6xl font-black text-white leading-tight tracking-tight mb-6">
              Stop Missing Leads.<br />
              <span class="gradient-text">Start Booking Clients.</span>
            </h1>

            <p class="text-lg text-white/60 leading-relaxed mb-8 max-w-lg">
              A branded booking widget that lives on your website, captures leads automatically, manages your pipeline, and sends follow-up emails — all without a booking platform.
            </p>

            <div class="flex flex-col sm:flex-row gap-3 mb-8">
              <NuxtLink to="/register" class="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-2xl bg-brand-500 text-white font-bold text-base hover:bg-brand-600 transition-colors shadow-xl shadow-brand-500/30 cursor-pointer">
                Start for free
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7"/>
                </svg>
              </NuxtLink>
              <a href="#how" class="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-2xl glass-card text-white/80 font-semibold text-base hover:bg-white/10 transition-colors cursor-pointer">
                See how it works
              </a>
            </div>

            <p class="text-xs text-white/30 font-medium">No credit card required · 5 minute setup</p>

            <!-- Platform badges -->
            <div class="mt-8 flex flex-wrap gap-2">
              <span v-for="p in ['WordPress','Webflow','Squarespace','Wix','Shopify']" :key="p"
                class="text-xs text-white/40 border border-white/10 rounded-lg px-2.5 py-1 font-medium">
                {{ p }}
              </span>
            </div>
          </div>

          <!-- Right: widget preview -->
          <div class="relative flex justify-center lg:justify-end">
            <!-- Glow behind card -->
            <div class="absolute inset-0 flex items-center justify-center pointer-events-none" aria-hidden="true">
              <div class="w-72 h-72 rounded-full bg-brand-500/20 blur-3xl" />
            </div>

            <div class="hero-widget relative p-6 w-full max-w-sm">
              <!-- Mock browser bar -->
              <div class="flex items-center gap-2 mb-5">
                <div class="flex gap-1.5">
                  <div class="w-2.5 h-2.5 rounded-full bg-white/15" />
                  <div class="w-2.5 h-2.5 rounded-full bg-white/15" />
                  <div class="w-2.5 h-2.5 rounded-full bg-white/15" />
                </div>
                <div class="flex-1 h-5 bg-white/10 rounded-md flex items-center px-2">
                  <span class="text-[10px] text-white/30">yourwebsite.com</span>
                </div>
              </div>

              <!-- New lead alert toast -->
              <div class="flex items-center gap-2.5 bg-green-500/15 border border-green-500/20 rounded-xl px-3 py-2.5 mb-4">
                <div class="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                  <svg class="w-3 h-3 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/>
                  </svg>
                </div>
                <div>
                  <p class="text-xs font-semibold text-green-300">New booking request</p>
                  <p class="text-[10px] text-green-400/70">Sarah M. — Botox consultation</p>
                </div>
              </div>

              <!-- Form fields -->
              <p class="text-sm font-bold text-white mb-1">Request an Appointment</p>
              <p class="text-xs text-white/40 mb-4">We'll be in touch within 24 hours.</p>

              <div class="space-y-2.5">
                <div class="h-9 bg-white/8 rounded-xl border border-white/10 flex items-center px-3">
                  <span class="text-xs text-white/30">Full Name</span>
                </div>
                <div class="h-9 bg-white/8 rounded-xl border border-white/10 flex items-center px-3">
                  <span class="text-xs text-white/30">Email Address</span>
                </div>
                <div class="h-9 bg-white/8 rounded-xl border border-white/10 flex items-center justify-between px-3">
                  <span class="text-xs text-white/30">Preferred date...</span>
                  <svg class="w-3.5 h-3.5 text-white/25" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                  </svg>
                </div>
                <div class="h-10 bg-brand-500 rounded-xl flex items-center justify-center">
                  <span class="text-xs font-bold text-white">Book a Consultation</span>
                </div>
              </div>

              <!-- "Powered by" subtle badge -->
              <p class="text-center text-[10px] text-white/20 mt-3">Powered by Local Booking Engine</p>
            </div>
          </div>

        </div>
      </div>
    </section>

    <!-- ── Stats bar ─────────────────────────────────────────────────────── -->
    <section class="bg-surface-950 border-y border-white/5 py-10">
      <div class="max-w-4xl mx-auto px-6">
        <div class="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div v-for="s in stats" :key="s.label">
            <div class="stat-value mb-1">{{ s.value }}</div>
            <p class="text-xs text-white/40 font-medium uppercase tracking-wider">{{ s.label }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- ── Problem ───────────────────────────────────────────────────────── -->
    <section class="bg-surface-950 py-24 md:py-32">
      <div class="max-w-5xl mx-auto px-6">
        <div class="text-center mb-16">
          <p class="text-xs font-bold text-brand-400 uppercase tracking-widest mb-3">The Problem</p>
          <h2 class="text-3xl md:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
            Every missed inquiry is a<br class="hidden md:block" /> missed appointment.
          </h2>
          <p class="text-white/50 mt-4 max-w-xl mx-auto text-lg leading-relaxed">
            A buried contact form, a generic booking platform, or a missed DM — they're all costing you clients you worked hard to attract.
          </p>
        </div>

        <div class="grid md:grid-cols-2 gap-5">
          <div class="glass-card rounded-2xl p-6">
            <p class="text-sm font-bold text-red-400 mb-4 flex items-center gap-2">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
              Without this
            </p>
            <ul class="space-y-3">
              <li v-for="item in ['Leads slip through contact forms you forget to check','No follow-up system — you forget to call back','Booking platforms feel generic and off-brand','Spreadsheets break across multiple locations','Confirmation emails from @gmail land in spam']" :key="item"
                class="flex items-start gap-3 text-sm text-white/60">
                <span class="mt-1.5 w-1.5 h-1.5 rounded-full bg-red-500/60 flex-shrink-0" />
                {{ item }}
              </li>
            </ul>
          </div>

          <div class="glass-card rounded-2xl p-6 border-brand-500/20" style="border-color: rgba(97,114,243,0.25);">
            <p class="text-sm font-bold text-green-400 mb-4 flex items-center gap-2">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
              With Local Booking Engine
            </p>
            <ul class="space-y-3">
              <li v-for="item in ['Branded widget captures leads the moment interest strikes','Automatic confirmations and follow-ups, zero effort','Widget matches your site colors, fonts, and style exactly','One dashboard for every location and every lead','Emails sent from your verified domain — inbox guaranteed']" :key="item"
                class="flex items-start gap-3 text-sm text-white/70">
                <span class="mt-1.5 w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0" />
                {{ item }}
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>

    <!-- ── How it works ───────────────────────────────────────────────────── -->
    <section id="how" class="py-24 md:py-32 bg-white">
      <div class="max-w-6xl mx-auto px-6">
        <div class="text-center mb-16">
          <p class="text-xs font-bold text-brand-500 uppercase tracking-widest mb-3">Simple Setup</p>
          <h2 class="text-3xl md:text-4xl font-black text-surface-900 tracking-tight">Live in four steps.</h2>
          <p class="text-surface-500 mt-3 max-w-lg mx-auto">From sign-up to capturing leads on your website in under 10 minutes.</p>
        </div>

        <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
          <div v-for="step in steps" :key="step.n" class="bento-card card-glow cursor-default">
            <div class="step-num mb-4">{{ step.n }}</div>
            <h3 class="text-base font-bold text-surface-900 mb-2">{{ step.title }}</h3>
            <p class="text-sm text-surface-500 leading-relaxed">{{ step.body }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- ── Features bento ────────────────────────────────────────────────── -->
    <section id="features" class="py-24 md:py-32 bg-surface-50">
      <div class="max-w-6xl mx-auto px-6">
        <div class="text-center mb-16">
          <p class="text-xs font-bold text-brand-500 uppercase tracking-widest mb-3">Everything You Need</p>
          <h2 class="text-3xl md:text-4xl font-black text-surface-900 tracking-tight">
            Built for local businesses that<br class="hidden md:block" /> hate missing leads.
          </h2>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <article
            v-for="f in features"
            :key="f.title"
            :class="['bento-card card-glow cursor-default', f.wide ? 'lg:col-span-2' : '']"
          >
            <div class="w-10 h-10 rounded-xl bg-brand-500/10 text-brand-500 flex items-center justify-center mb-4" v-html="iconMap[f.icon]" />
            <h3 class="text-base font-bold text-surface-900 mb-2">{{ f.title }}</h3>
            <p class="text-sm text-surface-500 leading-relaxed">{{ f.body }}</p>
          </article>
        </div>
      </div>
    </section>

    <!-- ── FAQ ────────────────────────────────────────────────────────────── -->
    <section id="faq" class="py-24 md:py-32 bg-white">
      <div class="max-w-2xl mx-auto px-6">
        <div class="text-center mb-12">
          <p class="text-xs font-bold text-brand-500 uppercase tracking-widest mb-3">FAQ</p>
          <h2 class="text-3xl md:text-4xl font-black text-surface-900 tracking-tight">Common questions.</h2>
        </div>

        <div class="space-y-2">
          <div v-for="(faq, i) in faqs" :key="i" class="border border-surface-100 rounded-2xl overflow-hidden bg-white">
            <button
              class="w-full flex items-center justify-between px-5 py-4 text-left cursor-pointer hover:bg-surface-50 transition-colors"
              :aria-expanded="openFaq === i"
              @click="toggleFaq(i)"
            >
              <span class="text-sm font-semibold text-surface-900 pr-4">{{ faq.q }}</span>
              <svg
                class="w-4 h-4 text-surface-400 flex-shrink-0 transition-transform duration-200"
                :class="openFaq === i ? 'rotate-180' : ''"
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
              </svg>
            </button>
            <Transition
              enter-active-class="transition-all duration-200 ease-out"
              enter-from-class="opacity-0"
              enter-to-class="opacity-100"
              leave-active-class="transition-all duration-150 ease-in"
              leave-from-class="opacity-100"
              leave-to-class="opacity-0"
            >
              <div v-if="openFaq === i">
                <p class="px-5 pb-5 text-sm text-surface-500 leading-relaxed">{{ faq.a }}</p>
              </div>
            </Transition>
          </div>
        </div>
      </div>
    </section>

    <!-- ── Final CTA ──────────────────────────────────────────────────────── -->
    <section class="hero-bg py-24 md:py-32 relative overflow-hidden">
      <div class="aurora-1" style="width:600px;height:600px;" aria-hidden="true" />
      <div class="aurora-2" style="width:400px;height:400px;" aria-hidden="true" />

      <div class="relative max-w-3xl mx-auto px-6 text-center">
        <div class="pill-badge bg-white/10 text-indigo-300 border border-white/15 mb-6 mx-auto w-fit">
          <span class="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          Free to start — no card needed
        </div>
        <h2 class="text-3xl md:text-5xl font-black text-white tracking-tight leading-tight mb-5">
          Ready to capture every lead<br class="hidden md:block" />
          <span class="gradient-text">your website attracts?</span>
        </h2>
        <p class="text-white/50 text-lg mb-10 leading-relaxed max-w-xl mx-auto">
          Set up your booking widget in under 5 minutes. Works on any website. No credit card required.
        </p>
        <NuxtLink
          to="/register"
          class="inline-flex items-center gap-2 px-9 py-4 rounded-2xl bg-brand-500 text-white font-bold text-lg hover:bg-brand-600 transition-colors cta-glow cursor-pointer"
        >
          Create your free account
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7"/>
          </svg>
        </NuxtLink>
      </div>
    </section>

    <!-- ── Footer ─────────────────────────────────────────────────────────── -->
    <footer class="bg-surface-950 border-t border-white/5 py-10">
      <div class="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
        <div class="flex items-center gap-2.5">
          <div class="w-7 h-7 rounded-lg bg-brand-500 flex items-center justify-center flex-shrink-0">
            <svg class="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
            </svg>
          </div>
          <span class="text-sm font-bold text-white">Local Booking Engine</span>
        </div>
        <p class="text-xs text-white/25">&copy; {{ new Date().getFullYear() }} Local Booking Engine. All rights reserved.</p>
        <div class="flex items-center gap-5">
          <NuxtLink to="/login"    class="text-xs text-white/35 hover:text-white/70 transition-colors cursor-pointer">Sign in</NuxtLink>
          <NuxtLink to="/register" class="text-xs text-white/35 hover:text-white/70 transition-colors cursor-pointer">Get started</NuxtLink>
        </div>
      </div>
    </footer>

  </div>
</template>

<style>
.lbe-site { font-family: 'Inter', system-ui, sans-serif; background: #ffffff; color: #111827; }
.hero-bg {
  background: linear-gradient(135deg, #0a0514 0%, #1a0a2e 25%, #16123f 50%, #0d1a3a 75%, #050d1a 100%);
  position: relative;
  overflow: hidden;
}
.aurora-1 {
  position: absolute; width: 800px; height: 800px; border-radius: 50%;
  background: radial-gradient(circle, #6172f355 0%, transparent 70%);
  top: -200px; left: -100px;
  animation: aurora-drift 12s ease-in-out infinite alternate;
}
.aurora-2 {
  position: absolute; width: 600px; height: 600px; border-radius: 50%;
  background: radial-gradient(circle, #8b5cf640 0%, transparent 70%);
  top: 100px; right: -150px;
  animation: aurora-drift 15s ease-in-out infinite alternate-reverse;
}
.aurora-3 {
  position: absolute; width: 500px; height: 500px; border-radius: 50%;
  background: radial-gradient(circle, #06b6d425 0%, transparent 70%);
  bottom: -100px; left: 40%;
  animation: aurora-drift 10s ease-in-out infinite alternate;
}
@keyframes aurora-drift {
  0%   { transform: translate(0, 0) scale(1); }
  100% { transform: translate(40px, 30px) scale(1.15); }
}
.gradient-text {
  background: linear-gradient(135deg, #818cf8 0%, #a78bfa 50%, #67e8f9 100%);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  background-clip: text;
}
.glass-card {
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.1);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}
.card-glow:hover {
  box-shadow: 0 0 0 1px #6172f360, 0 20px 60px -10px #6172f320;
}
.bento-card { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 20px; padding: 28px; transition: all 0.2s; }
.bento-card:hover { border-color: #a4bcfd; box-shadow: 0 8px 40px -8px #6172f315; transform: translateY(-2px); }
.step-num { font-size: 56px; font-weight: 900; line-height: 1; background: linear-gradient(135deg, #6172f3, #a78bfa); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
.pill-badge { display: inline-flex; align-items: center; gap: 6px; padding: 5px 12px; border-radius: 999px; font-size: 11px; font-weight: 600; letter-spacing: 0.03em; }
.hero-widget { background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.12); border-radius: 24px; backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); }
.cta-glow { box-shadow: 0 0 80px 20px #6172f340, inset 0 1px 0 rgba(255,255,255,0.1); }
.stat-value { font-size: 42px; font-weight: 900; background: linear-gradient(135deg, #6172f3, #a78bfa); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; line-height: 1.1; }
@media (prefers-reduced-motion: reduce) { .aurora-1, .aurora-2, .aurora-3 { animation: none; } }
</style>
