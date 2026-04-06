<script setup lang="ts">
definePageMeta({ middleware: ['auth', 'tenant'] })

const authStore = useAuthStore()
const tenantStore = useTenantStore()

// Redirect non-agency users
if (!authStore.isAgencyAdmin) {
  await navigateTo('/dashboard')
}

interface TenantSummary {
  id: string
  name: string
  slug: string
  logo_url: string | null
  status: string
  plan: string
  lead_count: number
  created_at: string
}

const { data: tenants, pending } = await useFetch<TenantSummary[]>('/api/agency/tenants')

async function switchToTenant(tenantId: string) {
  await tenantStore.switchTenant(tenantId)
  await navigateTo('/dashboard')
}

function statusVariant(status: string): 'success' | 'warning' | 'danger' | 'default' {
  if (status === 'active') return 'success'
  if (status === 'suspended') return 'warning'
  if (status === 'cancelled') return 'danger'
  return 'default'
}
</script>

<template>
  <div class="p-6 max-w-5xl mx-auto space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-xl font-bold text-surface-900">Agency Overview</h1>
        <p class="text-sm text-surface-500 mt-0.5">Manage all client accounts from one place</p>
      </div>
    </div>

    <!-- Summary stats -->
    <div class="grid grid-cols-3 gap-4">
      <AppCard>
        <p class="text-xs font-medium text-surface-500">Total Clients</p>
        <p class="text-2xl font-bold text-surface-900 mt-1">{{ tenants?.length ?? 0 }}</p>
      </AppCard>
      <AppCard>
        <p class="text-xs font-medium text-surface-500">Active Clients</p>
        <p class="text-2xl font-bold text-surface-900 mt-1">
          {{ tenants?.filter(t => t.status === 'active').length ?? 0 }}
        </p>
      </AppCard>
      <AppCard>
        <p class="text-xs font-medium text-surface-500">Total Leads (all clients)</p>
        <p class="text-2xl font-bold text-surface-900 mt-1">
          {{ tenants?.reduce((sum, t) => sum + t.lead_count, 0).toLocaleString() ?? 0 }}
        </p>
      </AppCard>
    </div>

    <!-- Client list -->
    <AppCard padding="none">
      <div class="px-5 py-4 border-b border-surface-100">
        <h2 class="text-sm font-semibold text-surface-900">Client Accounts</h2>
      </div>

      <div v-if="pending" class="p-6 space-y-3">
        <div v-for="i in 3" :key="i" class="h-12 bg-surface-100 rounded-xl animate-pulse" />
      </div>

      <div v-else-if="!tenants?.length" class="p-12 text-center">
        <p class="text-sm text-surface-400">No client accounts yet</p>
      </div>

      <div v-else class="divide-y divide-surface-50">
        <div
          v-for="tenant in tenants"
          :key="tenant.id"
          class="flex items-center gap-4 px-5 py-4 hover:bg-surface-50 transition-colors"
        >
          <!-- Avatar -->
          <div class="w-9 h-9 rounded-xl bg-brand-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
            <img v-if="tenant.logo_url" :src="tenant.logo_url" :alt="tenant.name" class="w-full h-full object-cover" />
            <span v-else class="text-sm font-bold text-brand-600">{{ tenant.name[0]?.toUpperCase() }}</span>
          </div>

          <!-- Info -->
          <div class="flex-1 min-w-0">
            <p class="text-sm font-semibold text-surface-900">{{ tenant.name }}</p>
            <p class="text-xs text-surface-500">{{ tenant.slug }}</p>
          </div>

          <!-- Stats -->
          <div class="text-right flex-shrink-0">
            <p class="text-sm font-semibold text-surface-900">{{ tenant.lead_count.toLocaleString() }}</p>
            <p class="text-xs text-surface-400">leads</p>
          </div>

          <!-- Status + plan -->
          <div class="flex items-center gap-2 flex-shrink-0">
            <AppBadge :variant="statusVariant(tenant.status)" size="sm" dot>
              {{ tenant.status }}
            </AppBadge>
            <AppBadge variant="default" size="sm">{{ tenant.plan }}</AppBadge>
          </div>

          <!-- Switch button -->
          <AppButton size="sm" variant="secondary" @click="switchToTenant(tenant.id)">
            View Dashboard
          </AppButton>
        </div>
      </div>
    </AppCard>
  </div>
</template>
