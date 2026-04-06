import type { Lead } from './lead'

export interface PipelineStage {
  id: string
  tenant_id: string
  name: string
  color: string        // hex color for visual distinction
  order: number        // display order in kanban
  is_default: boolean  // one default stage per tenant (new leads land here)
  is_terminal: boolean // won/lost stages — leads here don't progress further
  created_at: string
  updated_at: string

  // Virtual: populated client-side
  leads?: Lead[]
  lead_count?: number
}

// Default stages seeded per tenant on creation
export const DEFAULT_PIPELINE_STAGES: Omit<PipelineStage, 'id' | 'tenant_id' | 'created_at' | 'updated_at'>[] = [
  { name: 'New Lead',                color: '#6172f3', order: 0, is_default: true,  is_terminal: false },
  { name: 'Contacted',               color: '#f59e0b', order: 1, is_default: false, is_terminal: false },
  { name: 'Consultation Scheduled',  color: '#3b82f6', order: 2, is_default: false, is_terminal: false },
  { name: 'Booked',                  color: '#8b5cf6', order: 3, is_default: false, is_terminal: false },
  { name: 'Won',                     color: '#22c55e', order: 4, is_default: false, is_terminal: true  },
  { name: 'Lost',                    color: '#f43f5e', order: 5, is_default: false, is_terminal: true  },
]

export interface UpdateStageOrderDto {
  stages: Array<{ id: string; order: number }>
}
