<script setup lang="ts">
definePageMeta({ layout: 'auth' })

const router = useRouter()

const form = reactive({
  name: '',
  slug: '',
  notification_email: '',
  timezone: 'America/New_York',
})
const error = ref('')
const loading = ref(false)
const slugManuallyEdited = ref(false)

// Auto-generate slug from business name
watch(() => form.name, (name) => {
  if (!slugManuallyEdited.value) {
    form.slug = name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 40)
  }
})

const timezones = [
  { value: 'America/New_York',    label: 'Eastern (ET)' },
  { value: 'America/Chicago',     label: 'Central (CT)' },
  { value: 'America/Denver',      label: 'Mountain (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific (PT)' },
  { value: 'America/Phoenix',     label: 'Arizona (MST)' },
  { value: 'America/Anchorage',   label: 'Alaska (AKT)' },
  { value: 'Pacific/Honolulu',    label: 'Hawaii (HST)' },
]

async function handleSubmit() {
  error.value = ''
  if (!form.name.trim()) { error.value = 'Business name is required'; return }
  if (!form.slug.trim()) { error.value = 'URL slug is required'; return }

  loading.value = true
  try {
    await $fetch('/api/tenants', {
      method: 'POST',
      body: form,
    })
    await router.push('/dashboard')
  } catch (e: any) {
    error.value = e.data?.message ?? e.message ?? 'Failed to create account'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <AppCard padding="lg">
    <h2 class="text-lg font-semibold text-surface-900 mb-1">Set up your business</h2>
    <p class="text-sm text-surface-500 mb-6">Tell us about your business to get started</p>

    <form class="space-y-4" @submit.prevent="handleSubmit">
      <AppInput
        v-model="form.name"
        label="Business Name"
        placeholder="Glow Med Spa"
        required
        hint="Your business name as it appears to clients"
      />
      <AppInput
        v-model="form.slug"
        label="URL Slug"
        placeholder="glow-med-spa"
        required
        :hint="`Used in your embed URL: /embed/${form.slug || 'your-slug'}`"
        @input="slugManuallyEdited = true"
      />
      <AppInput
        v-model="form.notification_email"
        label="Notification Email"
        type="email"
        placeholder="owner@yourmedspa.com"
        hint="We'll send new lead alerts here"
      />
      <AppSelect
        v-model="form.timezone"
        label="Time Zone"
        :options="timezones"
      />

      <div v-if="error" class="p-3 rounded-xl bg-danger-50 border border-danger-200 text-sm text-danger-700">
        {{ error }}
      </div>

      <AppButton type="submit" :loading="loading" full-width size="lg">
        Launch my dashboard
      </AppButton>
    </form>
  </AppCard>
</template>
