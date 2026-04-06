import type { Lead, CreateLeadDto, UpdateLeadDto, CreateNoteDto, LeadFilters } from '~/types/lead'

export function useLeads() {
  const tenantStore = useTenantStore()

  async function fetchLeads(filters?: LeadFilters): Promise<Lead[]> {
    const params = new URLSearchParams()
    if (filters?.status?.length) params.set('status', filters.status.join(','))
    if (filters?.search) params.set('search', filters.search)
    if (filters?.stage_id) params.set('stage_id', filters.stage_id)
    if (filters?.is_archived !== undefined) params.set('is_archived', String(filters.is_archived))

    const data = await $fetch<Lead[]>(`/api/leads?${params.toString()}`)
    return data
  }

  async function fetchLead(id: string): Promise<Lead> {
    return await $fetch<Lead>(`/api/leads/${id}`)
  }

  async function createLead(dto: CreateLeadDto): Promise<Lead> {
    return await $fetch<Lead>('/api/leads', { method: 'POST', body: dto })
  }

  async function updateLead(id: string, dto: UpdateLeadDto): Promise<Lead> {
    return await $fetch<Lead>(`/api/leads/${id}`, { method: 'PATCH', body: dto })
  }

  async function deleteLead(id: string): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await ($fetch as any)(`/api/leads/${id}`, { method: 'DELETE' })
  }

  async function addNote(leadId: string, dto: CreateNoteDto) {
    return await $fetch(`/api/leads/${leadId}/notes`, { method: 'POST', body: dto })
  }

  async function addTag(leadId: string, tagId: string) {
    return await $fetch(`/api/leads/${leadId}/tags`, { method: 'POST', body: { tag_id: tagId } })
  }

  async function removeTag(leadId: string, tagId: string) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return await ($fetch as any)(`/api/leads/${leadId}/tags/${tagId}`, { method: 'DELETE' })
  }

  return {
    fetchLeads,
    fetchLead,
    createLead,
    updateLead,
    deleteLead,
    addNote,
    addTag,
    removeTag,
  }
}
