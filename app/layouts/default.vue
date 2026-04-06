<script setup lang="ts">
import AppSidebar from '~/components/layout/AppSidebar.vue'

const authStore = useAuthStore()
const tenantStore = useTenantStore()
const route = useRoute()

const sidebarOpen = ref(false)

onMounted(async () => {
  if (!authStore.profile) await authStore.fetchProfile()
  if (!tenantStore.tenant) await tenantStore.fetchCurrentTenant()
})

const pageTitle = computed(() => {
  if (route.path.startsWith('/dashboard')) return 'Dashboard'
  if (route.path.startsWith('/leads')) return 'Pipeline'
  if (route.path.startsWith('/settings')) return 'Settings'
  if (route.path.startsWith('/agency')) return 'Agency'
  return ''
})
</script>

<template>
  <div class="flex min-h-screen bg-surface-50">
    <AppSidebar :open="sidebarOpen" @close="sidebarOpen = false" />

    <div class="flex min-w-0 flex-1 flex-col">
      <!-- Mobile top bar -->
      <header class="flex h-16 flex-shrink-0 items-center gap-3 border-b border-surface-200 bg-white px-4 lg:hidden">
        <button
          class="flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl text-surface-500 transition-colors duration-150 hover:bg-surface-100 hover:text-surface-700 focus:outline-none focus:ring-2 focus:ring-brand-500/50"
          aria-label="Open navigation"
          @click="sidebarOpen = true"
        >
          <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <div class="flex items-center gap-2">
          <div class="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-brand-500">
            <svg class="h-3.5 w-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <span class="text-sm font-semibold text-surface-900">{{ pageTitle }}</span>
        </div>

        <div class="ml-auto flex h-8 w-8 items-center justify-center rounded-full bg-brand-500/10 ring-1 ring-brand-500/20">
          <span class="text-xs font-semibold text-brand-600">
            {{ (authStore.profile?.full_name ?? authStore.profile?.email ?? '?')[0]?.toUpperCase() }}
          </span>
        </div>
      </header>

      <main class="flex-1 min-w-0">
        <slot />
      </main>
    </div>
  </div>
</template>
