import type { PipelineStage } from '~/types/pipeline'
import type { Lead, UpdateLeadDto } from '~/types/lead'

export function usePipeline() {
  const stages = ref<PipelineStage[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchStages(): Promise<void> {
    loading.value = true
    try {
      stages.value = await $fetch<PipelineStage[]>('/api/pipeline/stages')
    } catch (e: any) {
      error.value = e.message
    } finally {
      loading.value = false
    }
  }

  async function fetchStagesWithLeads(): Promise<void> {
    loading.value = true
    try {
      const data = await $fetch<PipelineStage[]>('/api/pipeline/board')
      stages.value = data
    } catch (e: any) {
      error.value = e.message
    } finally {
      loading.value = false
    }
  }

  async function moveLeadToStage(leadId: string, stageId: string, newStatus?: string): Promise<Lead> {
    const body: UpdateLeadDto = { stage_id: stageId }
    if (newStatus) body.status = newStatus as Lead['status']
    return await $fetch<Lead>(`/api/leads/${leadId}`, { method: 'PATCH', body })
  }

  // Optimistically move a lead between stage columns in local state
  function moveLeadOptimistic(leadId: string, fromStageId: string, toStageId: string): void {
    const fromStage = stages.value.find(s => s.id === fromStageId)
    const toStage = stages.value.find(s => s.id === toStageId)
    if (!fromStage?.leads || !toStage) return

    const leadIndex = fromStage.leads.findIndex(l => l.id === leadId)
    if (leadIndex === -1) return

    const [lead] = fromStage.leads.splice(leadIndex, 1)
    if (!lead) return
    lead.stage_id = toStageId
    if (!toStage.leads) toStage.leads = []
    toStage.leads.unshift(lead)

    // Update counts
    if (fromStage.lead_count !== undefined) fromStage.lead_count--
    if (toStage.lead_count !== undefined) toStage.lead_count++
  }

  return {
    stages,
    loading,
    error,
    fetchStages,
    fetchStagesWithLeads,
    moveLeadToStage,
    moveLeadOptimistic,
  }
}
