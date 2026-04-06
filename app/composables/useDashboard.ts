import type { DashboardData, DashboardFilters } from '~/types/analytics'

export function useDashboard() {
  const data = ref<DashboardData | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchDashboard(filters?: DashboardFilters): Promise<void> {
    loading.value = true
    error.value = null
    try {
      const params = new URLSearchParams()
      if (filters?.period) params.set('period', filters.period)
      if (filters?.date_from) params.set('date_from', filters.date_from)
      if (filters?.date_to) params.set('date_to', filters.date_to)
      data.value = await $fetch<DashboardData>(`/api/dashboard?${params.toString()}`)
    } catch (e: any) {
      error.value = e.message
    } finally {
      loading.value = false
    }
  }

  return { data, loading, error, fetchDashboard }
}
