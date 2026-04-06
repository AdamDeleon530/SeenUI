<script setup lang="ts">
import AppCard from '~/components/ui/AppCard.vue'
import AppInput from '~/components/ui/AppInput.vue'
import AppSelect from '~/components/ui/AppSelect.vue'
import AppButton from '~/components/ui/AppButton.vue'

definePageMeta({ middleware: ['auth', 'tenant'] })

const tenantStore = useTenantStore()
const { updateTenant, uploadLogo } = useTenant()

const form = reactive({
  name: tenantStore.tenant?.name ?? '',
  notification_email: tenantStore.tenant?.notification_email ?? '',
  website_domain: tenantStore.tenant?.website_domain ?? '',
  timezone: tenantStore.tenant?.timezone ?? 'America/New_York',
})

const saving = ref(false)
const saved = ref(false)
const error = ref('')

watch(() => tenantStore.tenant, (t) => {
  if (t) {
    form.name = t.name
    form.notification_email = t.notification_email ?? ''
    form.website_domain = t.website_domain ?? ''
    form.timezone = t.timezone
  }
}, { immediate: true })

async function handleSave() {
  error.value = ''
  saving.value = true
  try {
    await updateTenant(form)
    saved.value = true
    setTimeout(() => { saved.value = false }, 2500)
  } catch (e: any) {
    error.value = e.message
  } finally {
    saving.value = false
  }
}

const timezones = [
  { value: 'America/New_York',    label: 'Eastern (ET)' },
  { value: 'America/Chicago',     label: 'Central (CT)' },
  { value: 'America/Denver',      label: 'Mountain (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific (PT)' },
]
</script>

<template>
  <div class="p-6 max-w-2xl mx-auto space-y-6">
    <div>
      <h1 class="text-xl font-bold text-surface-900">Settings</h1>
      <p class="text-sm text-surface-500 mt-0.5">Manage your business profile and preferences</p>
    </div>

    <!-- Settings nav tabs -->
    <div class="flex gap-1 border-b border-surface-200">
      <NuxtLink
        v-for="tab in [
          { label: 'General',  href: '/settings' },
          { label: 'Embed',    href: '/settings/embed' },
          { label: 'Services', href: '/settings/services' },
          { label: 'Email',    href: '/settings/email' },
          { label: 'Templates', href: '/settings/templates' },
          { label: 'Billing',   href: '/settings/billing' },
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

    <AppCard>
      <h2 class="text-sm font-semibold text-surface-900 mb-4">Business Profile</h2>
      <form class="space-y-4" @submit.prevent="handleSave">
        <AppInput
          v-model="form.name"
          label="Business Name"
          placeholder="Glow Med Spa"
          required
        />
        <AppInput
          v-model="form.notification_email"
          label="Notification Email"
          type="email"
          placeholder="owner@yourmedspa.com"
          hint="New lead alerts are sent here"
        />
        <AppInput
          v-model="form.website_domain"
          label="Website Domain"
          placeholder="https://glowmedspa.com"
          hint="Used to validate embed widget origin"
        />
        <AppSelect
          v-model="form.timezone"
          label="Time Zone"
          :options="timezones"
        />

        <div v-if="error" class="text-sm text-danger-600">{{ error }}</div>

        <div class="flex items-center gap-3 pt-2">
          <AppButton type="submit" :loading="saving">Save Changes</AppButton>
          <Transition
            enter-active-class="transition-opacity duration-200"
            leave-active-class="transition-opacity duration-200"
            enter-from-class="opacity-0"
            leave-to-class="opacity-0"
          >
            <span v-if="saved" class="text-sm text-success-600 font-medium">Saved!</span>
          </Transition>
        </div>
      </form>
    </AppCard>
  </div>
</template>
