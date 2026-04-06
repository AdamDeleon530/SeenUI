<script setup lang="ts">
import AppButton from '~/components/ui/AppButton.vue'
import AppCard from '~/components/ui/AppCard.vue'

definePageMeta({ middleware: ['auth', 'tenant'] })

// ─── State ────────────────────────────────────────────────────────────────────
const loading       = ref(true)
const saving        = ref(false)
const verifying     = ref(false)
const settings      = ref<any>(null)
const dnsRecords    = ref<any[]>([])
const liveStatus    = ref<string | null>(null)
const successMsg    = ref('')
const errorMsg      = ref('')

// Form fields
const domain        = ref('')
const fromName      = ref('')
const fromAddress   = ref('')

// ─── Load ─────────────────────────────────────────────────────────────────────
async function load() {
  loading.value = true
  try {
    const res = await $fetch<any>('/api/settings/email-domain')
    settings.value  = res.settings
    dnsRecords.value = res.dns_records ?? []
    liveStatus.value = res.live_status

    if (res.settings?.email_from_address) {
      fromAddress.value = res.settings.email_from_address
      fromName.value    = res.settings.email_from_name ?? ''
      // Derive domain from stored address
      domain.value = res.settings.email_from_address.split('@')[1] ?? ''
    }
  } finally {
    loading.value = false
  }
}

onMounted(load)

// ─── Register domain ──────────────────────────────────────────────────────────
async function registerDomain() {
  errorMsg.value = ''
  successMsg.value = ''
  saving.value = true
  try {
    const res = await $fetch<any>('/api/settings/email-domain', {
      method: 'POST',
      body: {
        domain: domain.value.trim().toLowerCase(),
        from_name: fromName.value.trim(),
        from_address: fromAddress.value.trim().toLowerCase(),
      },
    })
    dnsRecords.value = res.dns_records ?? []
    liveStatus.value = res.status
    settings.value = { ...settings.value, resend_domain_id: res.domain_id, email_domain_status: 'pending' }
    successMsg.value = 'Domain registered. Add the DNS records below to your domain host, then click Verify.'
  } catch (err: any) {
    errorMsg.value = err?.data?.message ?? 'Failed to register domain'
  } finally {
    saving.value = false
  }
}

// ─── Verify ───────────────────────────────────────────────────────────────────
async function verifyDomain() {
  errorMsg.value = ''
  successMsg.value = ''
  verifying.value = true
  try {
    const res = await $fetch<any>('/api/settings/email-domain-verify', { method: 'POST' })
    liveStatus.value = res.status
    dnsRecords.value = res.dns_records ?? []
    settings.value = { ...settings.value, email_domain_status: res.verified ? 'verified' : 'pending' }
    if (res.verified) {
      successMsg.value = 'Domain verified! Emails will now be sent from your domain.'
    } else {
      errorMsg.value = 'DNS records not detected yet. It can take up to 48 hours for DNS to propagate. Try again shortly.'
    }
  } catch (err: any) {
    errorMsg.value = err?.data?.message ?? 'Verification failed'
  } finally {
    verifying.value = false
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text)
}

const statusColor: Record<string, string> = {
  verified: 'bg-green-100 text-green-700',
  pending:  'bg-yellow-100 text-yellow-700',
  failed:   'bg-red-100 text-red-700',
  unverified: 'bg-surface-100 text-surface-500',
}

const currentStatus = computed(() => liveStatus.value ?? settings.value?.email_domain_status ?? 'unverified')
const hasDomain = computed(() => !!settings.value?.resend_domain_id)
</script>

<template>
  <div class="max-w-2xl mx-auto px-6 py-8 space-y-8">
    <!-- Settings nav tabs -->
    <div class="flex gap-1 border-b border-surface-200">
      <NuxtLink
        v-for="tab in [
          { label: 'General',  href: '/settings' },
          { label: 'Embed',    href: '/settings/embed' },
          { label: 'Services', href: '/settings/services' },
          { label: 'Email',    href: '/settings/email' },
          { label: 'Templates', href: '/settings/templates' },
          { label: 'Team',     href: '/settings/team' },
        ]"
        :key="tab.href"
        :to="tab.href"
        class="px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors"
        :class="$route.path === tab.href
          ? 'border-brand-500 text-brand-600'
          : 'border-transparent text-surface-500 hover:text-surface-700'"
      >
        {{ tab.label }}
      </NuxtLink>
    </div>

    <!-- Header -->
    <div>
      <h1 class="text-xl font-bold text-surface-900">Email Sending Domain</h1>
      <p class="text-sm text-surface-500 mt-1">
        Verify your domain so emails (booking confirmations, notifications) are sent from
        <strong>your</strong> address instead of a generic one — this prevents them from going to spam.
      </p>
    </div>

    <div v-if="loading" class="space-y-3">
      <div v-for="i in 3" :key="i" class="h-10 bg-surface-100 rounded-xl animate-pulse" />
    </div>

    <template v-else>
      <!-- How it works -->
      <AppCard class="!p-5 bg-brand-50 border-brand-100">
        <h2 class="text-sm font-semibold text-brand-800 mb-3">How it works</h2>
        <ol class="space-y-2 text-sm text-brand-700 list-decimal list-inside">
          <li>Enter your domain and the email address you want to send from.</li>
          <li>Add the DNS records (SPF + DKIM) we give you to your domain registrar (GoDaddy, Namecheap, Cloudflare, etc.).</li>
          <li>Click <strong>Check Verification</strong> — DNS usually propagates within a few minutes, sometimes up to 48 hrs.</li>
          <li>Once verified, all booking emails will be sent from your address and Gmail/Outlook will trust them.</li>
        </ol>
      </AppCard>

      <!-- Status badge (if domain registered) -->
      <div v-if="hasDomain" class="flex items-center gap-3">
        <span class="text-sm text-surface-600">Domain status:</span>
        <span
          class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold capitalize"
          :class="statusColor[currentStatus]"
        >
          {{ currentStatus }}
        </span>
        <span class="text-sm text-surface-500">{{ settings?.email_from_address }}</span>
      </div>

      <!-- Success / error messages -->
      <div v-if="successMsg" class="text-sm text-green-700 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
        {{ successMsg }}
      </div>
      <div v-if="errorMsg" class="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
        {{ errorMsg }}
      </div>

      <!-- Domain setup form -->
      <AppCard class="!p-6 space-y-4">
        <h2 class="text-sm font-semibold text-surface-800">
          {{ hasDomain ? 'Update sending address' : 'Set up your sending domain' }}
        </h2>

        <div class="space-y-3">
          <div>
            <label class="block text-xs font-medium text-surface-600 mb-1.5">
              Sending domain <span class="text-red-400">*</span>
            </label>
            <input
              v-model="domain"
              type="text"
              placeholder="thenordicnerd.com"
              class="w-full px-3 py-2 text-sm rounded-xl border border-surface-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <p class="text-xs text-surface-400 mt-1">The domain part of your email (no @ or subdomain needed)</p>
          </div>

          <div>
            <label class="block text-xs font-medium text-surface-600 mb-1.5">
              From address <span class="text-red-400">*</span>
            </label>
            <input
              v-model="fromAddress"
              type="email"
              placeholder="bookings@thenordicnerd.com"
              class="w-full px-3 py-2 text-sm rounded-xl border border-surface-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <p class="text-xs text-surface-400 mt-1">Must match the domain above. This is what recipients will see.</p>
          </div>

          <div>
            <label class="block text-xs font-medium text-surface-600 mb-1.5">From name</label>
            <input
              v-model="fromName"
              type="text"
              placeholder="The Nordic Nerd"
              class="w-full px-3 py-2 text-sm rounded-xl border border-surface-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <p class="text-xs text-surface-400 mt-1">The display name in the inbox (e.g. "The Nordic Nerd")</p>
          </div>
        </div>

        <div class="flex gap-3 pt-1">
          <AppButton
            :loading="saving"
            :disabled="!domain || !fromAddress"
            @click="registerDomain"
          >
            {{ hasDomain ? 'Update Domain' : 'Register Domain' }}
          </AppButton>
          <AppButton
            v-if="hasDomain && currentStatus !== 'verified'"
            variant="secondary"
            :loading="verifying"
            @click="verifyDomain"
          >
            Check Verification
          </AppButton>
          <AppButton
            v-if="currentStatus === 'verified'"
            variant="secondary"
            :loading="verifying"
            @click="verifyDomain"
          >
            Re-check Status
          </AppButton>
        </div>
      </AppCard>

      <!-- DNS records table (shown once domain is registered) -->
      <AppCard v-if="dnsRecords.length" class="!p-6 space-y-4">
        <div>
          <h2 class="text-sm font-semibold text-surface-800">DNS Records to Add</h2>
          <p class="text-xs text-surface-500 mt-1">
            Add these records in your domain registrar's DNS settings. Both records are required.
          </p>
        </div>

        <div class="space-y-3">
          <div
            v-for="record in dnsRecords"
            :key="record.name"
            class="bg-surface-50 rounded-xl p-4 space-y-2"
          >
            <div class="flex items-center gap-2">
              <span class="text-xs font-bold text-surface-700 uppercase bg-surface-200 px-2 py-0.5 rounded">
                {{ record.type }}
              </span>
              <span
                v-if="record.status"
                class="text-xs font-medium capitalize px-2 py-0.5 rounded-full"
                :class="record.status === 'verified' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'"
              >
                {{ record.status }}
              </span>
            </div>

            <div class="grid grid-cols-[80px_1fr] gap-y-1.5 text-xs">
              <span class="text-surface-400 font-medium">Name</span>
              <div class="flex items-center gap-2">
                <code class="font-mono text-surface-700 truncate">{{ record.name }}</code>
                <button class="text-brand-500 hover:text-brand-700 flex-shrink-0" @click="copyToClipboard(record.name)">
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
              </div>

              <span class="text-surface-400 font-medium">Value</span>
              <div class="flex items-start gap-2">
                <code class="font-mono text-surface-700 break-all text-[11px]">{{ record.value }}</code>
                <button class="text-brand-500 hover:text-brand-700 flex-shrink-0 mt-0.5" @click="copyToClipboard(record.value)">
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
              </div>

              <span v-if="record.ttl" class="text-surface-400 font-medium">TTL</span>
              <span v-if="record.ttl" class="text-surface-700 font-mono">{{ record.ttl }}</span>
            </div>
          </div>
        </div>

        <div class="text-xs text-surface-500 bg-surface-50 rounded-xl p-3">
          <strong class="text-surface-700">Where to add these:</strong> Log into your domain registrar
          (GoDaddy, Namecheap, Cloudflare, Google Domains, etc.) → DNS Management → Add Record.
          DNS changes can take a few minutes to 48 hours to propagate globally.
        </div>
      </AppCard>
    </template>
  </div>
</template>
