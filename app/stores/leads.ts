import { defineStore } from 'pinia'
import type { Lead, LeadFilters } from '~/types/lead'

export const useLeadsStore = defineStore('leads', () => {
  const leads = ref<Lead[]>([])
  const selectedLead = ref<Lead | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const filters = ref<LeadFilters>({ is_archived: false })

  const totalCount = computed(() => leads.value.length)

  function setSelectedLead(lead: Lead | null) {
    selectedLead.value = lead
  }

  function updateLeadInList(updated: Lead) {
    const index = leads.value.findIndex(l => l.id === updated.id)
    if (index !== -1) {
      leads.value[index] = updated
    }
    if (selectedLead.value?.id === updated.id) {
      selectedLead.value = updated
    }
  }

  function removeLeadFromList(id: string) {
    leads.value = leads.value.filter(l => l.id !== id)
    if (selectedLead.value?.id === id) {
      selectedLead.value = null
    }
  }

  function setFilters(newFilters: Partial<LeadFilters>) {
    filters.value = { ...filters.value, ...newFilters }
  }

  return {
    leads,
    selectedLead,
    loading,
    error,
    filters,
    totalCount,
    setSelectedLead,
    updateLeadInList,
    removeLeadFromList,
    setFilters,
  }
})
