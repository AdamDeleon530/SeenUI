<script setup lang="ts">
import AppCard from '~/components/ui/AppCard.vue'
import AppButton from '~/components/ui/AppButton.vue'

definePageMeta({ middleware: ['auth', 'tenant'] })

const { data: services, refresh } = await useFetch<{ id: string; name: string; duration_minutes: number | null }[]>('/api/services')

const newServiceName = ref('')
const adding = ref(false)
const error = ref('')

async function addService() {
  const name = newServiceName.value.trim()
  if (!name) return
  error.value = ''
  adding.value = true
  try {
    await $fetch('/api/services', { method: 'POST', body: { name } })
    newServiceName.value = ''
    await refresh()
  } catch (e: any) {
    error.value = e.data?.message ?? 'Failed to add service'
  } finally {
    adding.value = false
  }
}

async function removeService(id: string) {
  await $fetch(`/api/services/${id}`, { method: 'DELETE' })
  await refresh()
}
</script>

<template>
  <div class="p-6 max-w-2xl mx-auto space-y-6">
    <div>
      <h1 class="text-xl font-bold text-surface-900">Settings</h1>
      <p class="text-sm text-surface-500 mt-0.5">Manage your services</p>
    </div>

    <!-- Settings nav tabs -->
    <div class="flex gap-1 border-b border-surface-200">
      <NuxtLink
        v-for="tab in [
          { label: 'General',  href: '/settings' },
          { label: 'Embed',    href: '/settings/embed' },
          { label: 'Services', href: '/settings/services' },
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
      <h2 class="text-sm font-semibold text-surface-900 mb-1">Services</h2>
      <p class="text-sm text-surface-500 mb-4">
        Services appear as a dropdown in your booking form. When none are added, the form shows a free-text field instead.
      </p>

      <!-- Add service -->
      <div class="flex gap-2 mb-2">
        <input
          v-model="newServiceName"
          type="text"
          placeholder="e.g. Consultation, IV Therapy, Laser Treatment..."
          class="flex-1 text-sm px-3 py-2 border border-surface-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400"
          @keydown.enter.prevent="addService"
        />
        <AppButton :loading="adding" @click="addService">Add</AppButton>
      </div>
      <p v-if="error" class="text-xs text-danger-600 mb-3">{{ error }}</p>

      <!-- Service list -->
      <div v-if="services?.length" class="mt-4 divide-y divide-surface-100 border border-surface-200 rounded-xl overflow-hidden">
        <div
          v-for="service in services"
          :key="service.id"
          class="flex items-center justify-between px-4 py-3 bg-white hover:bg-surface-50 transition-colors"
        >
          <span class="text-sm text-surface-800 font-medium">{{ service.name }}</span>
          <button
            class="flex items-center gap-1.5 px-2.5 py-1 text-xs text-surface-400 hover:text-danger-600 hover:bg-danger-50 rounded-lg transition-colors cursor-pointer"
            @click="removeService(service.id)"
          >
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Remove
          </button>
        </div>
      </div>

      <div v-else class="mt-4 py-10 text-center border border-dashed border-surface-200 rounded-xl">
        <p class="text-sm text-surface-400">No services yet</p>
        <p class="text-xs text-surface-400 mt-1">Add your first service above</p>
      </div>
    </AppCard>
  </div>
</template>
