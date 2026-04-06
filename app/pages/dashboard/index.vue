<script setup lang="ts">
definePageMeta({ middleware: ['auth', 'tenant'] })

const tenantStore = useTenantStore()
const { data, loading, fetchDashboard } = useDashboard()

const period = ref<'7d' | '30d' | '90d'>('30d')

await fetchDashboard({ period: period.value })

watch(period, async (p) => {
  await fetchDashboard({ period: p })
})

const conversionRateColor = computed(() => {
  const rate = data.value?.stats.conversion_rate ?? 0
  if (rate >= 30) return 'success'
  if (rate >= 15) return 'warning'
  return 'brand'
})

// Source label formatting
function formatSource(source: string): string {
  return source.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}
</script>

<template>
  <div class="p-6 max-w-7xl mx-auto space-y-6">
    <!-- Page header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-xl font-bold text-surface-900">Dashboard</h1>
        <p class="text-sm text-surface-500 mt-0.5">{{ tenantStore.tenant?.name ?? 'Your Business' }}</p>
      </div>
      <div class="flex items-center gap-2">
        <button
          v-for="p in ['7d', '30d', '90d']"
          :key="p"
          :class="[
            'px-3 py-1.5 text-xs font-medium rounded-lg transition-colors',
            period === p ? 'bg-brand-500 text-white' : 'bg-white text-surface-600 border border-surface-200 hover:bg-surface-50',
          ]"
          @click="period = p as typeof period"
        >
          {{ p === '7d' ? '7 Days' : p === '30d' ? '30 Days' : '90 Days' }}
        </button>
      </div>
    </div>

    <!-- Loading skeleton -->
    <div v-if="loading" class="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <div v-for="i in 4" :key="i" class="h-24 bg-surface-100 rounded-2xl animate-pulse" />
    </div>

    <template v-else-if="data">
      <!-- Stat cards -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Leads"
          :value="data.stats.total_leads.toLocaleString()"
          subtext="All time"
          color="brand"
        >
          <template #icon>
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </template>
        </StatCard>

        <StatCard
          label="Leads This Month"
          :value="data.stats.leads_this_month.toLocaleString()"
          subtext="Calendar month"
          color="brand"
        >
          <template #icon>
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
          </template>
        </StatCard>

        <StatCard
          label="Booked This Month"
          :value="data.stats.booked_this_month.toLocaleString()"
          subtext="Appointments scheduled"
          color="success"
        >
          <template #icon>
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </template>
        </StatCard>

        <StatCard
          label="Conversion Rate"
          :value="`${data.stats.conversion_rate}%`"
          subtext="Leads → Booked"
          :color="conversionRateColor"
        >
          <template #icon>
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </template>
        </StatCard>
      </div>

      <!-- Charts row -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <!-- Lead volume -->
        <div class="lg:col-span-2">
          <LeadVolumeChart :data="data.lead_volume_by_day" />
        </div>

        <!-- Pipeline snapshot -->
        <AppCard>
          <h3 class="text-sm font-semibold text-surface-900 mb-4">Pipeline Status</h3>
          <div v-if="!data.leads_by_stage.length" class="text-sm text-surface-400">No leads yet</div>
          <div v-else class="space-y-3">
            <div
              v-for="stage in data.leads_by_stage"
              :key="stage.stage_name"
              class="flex items-center gap-3"
            >
              <div class="w-2.5 h-2.5 rounded-full flex-shrink-0" :style="{ backgroundColor: stage.stage_color }" />
              <div class="flex-1 min-w-0">
                <div class="flex items-center justify-between">
                  <span class="text-xs font-medium text-surface-700 truncate">{{ stage.stage_name }}</span>
                  <span class="text-xs font-semibold text-surface-900 ml-2">{{ stage.count }}</span>
                </div>
              </div>
            </div>
          </div>
        </AppCard>
      </div>

      <!-- Sources and Pages -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <!-- Lead sources -->
        <AppCard>
          <h3 class="text-sm font-semibold text-surface-900 mb-4">Top Lead Sources</h3>
          <div v-if="!data.leads_by_source.length" class="text-sm text-surface-400 py-4 text-center">
            No source data yet
          </div>
          <div v-else class="space-y-3">
            <div
              v-for="item in data.leads_by_source"
              :key="item.source"
              class="flex items-center gap-3"
            >
              <div class="flex-1 min-w-0">
                <div class="flex items-center justify-between mb-1">
                  <span class="text-xs font-medium text-surface-700">{{ formatSource(item.source) }}</span>
                  <span class="text-xs text-surface-500">{{ item.count }} ({{ item.percentage }}%)</span>
                </div>
                <div class="h-1.5 bg-surface-100 rounded-full overflow-hidden">
                  <div
                    class="h-full bg-brand-400 rounded-full transition-all duration-500"
                    :style="{ width: `${item.percentage}%` }"
                  />
                </div>
              </div>
            </div>
          </div>
        </AppCard>

        <!-- Top pages -->
        <AppCard>
          <h3 class="text-sm font-semibold text-surface-900 mb-4">Top Landing Pages</h3>
          <div v-if="!data.leads_by_page.length" class="text-sm text-surface-400 py-4 text-center">
            No page data yet
          </div>
          <div v-else class="divide-y divide-surface-50">
            <div
              v-for="item in data.leads_by_page"
              :key="item.source_page"
              class="py-2.5 flex items-center justify-between gap-2"
            >
              <p class="text-xs text-surface-600 truncate flex-1" :title="item.source_page">
                {{ item.source_page }}
              </p>
              <div class="flex items-center gap-3 flex-shrink-0">
                <span class="text-xs text-surface-500">{{ item.count }} leads</span>
                <AppBadge :variant="item.conversion_rate >= 20 ? 'success' : 'default'" size="sm">
                  {{ item.conversion_rate }}%
                </AppBadge>
              </div>
            </div>
          </div>
        </AppCard>
      </div>

      <!-- Empty state for brand new accounts -->
      <div v-if="data.stats.total_leads === 0" class="text-center py-16">
        <div class="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-brand-50 mb-4">
          <svg class="w-8 h-8 text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h3 class="text-base font-semibold text-surface-900 mb-1">No leads yet</h3>
        <p class="text-sm text-surface-500 mb-4 max-w-sm mx-auto">
          Install your booking widget or add leads manually to start tracking conversions.
        </p>
        <div class="flex justify-center gap-3">
          <NuxtLink to="/settings/embed">
            <AppButton variant="primary">Get embed code</AppButton>
          </NuxtLink>
          <NuxtLink to="/leads">
            <AppButton variant="secondary">Add lead manually</AppButton>
          </NuxtLink>
        </div>
      </div>
    </template>
  </div>
</template>
