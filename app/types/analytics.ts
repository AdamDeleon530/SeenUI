export interface DashboardStats {
  total_leads: number
  leads_this_month: number
  booked_this_month: number
  won_this_month: number
  conversion_rate: number          // booked / total leads (%)
  avg_response_hours: number | null // avg time from lead created → first status change
}

export interface LeadsBySource {
  source: string
  count: number
  percentage: number
}

export interface LeadsByPage {
  source_page: string
  count: number
  booked_count: number
  conversion_rate: number
}

export interface LeadsByStage {
  stage_name: string
  stage_color: string
  count: number
}

export interface LeadVolumeByDay {
  date: string   // YYYY-MM-DD
  count: number
}

export interface DashboardData {
  stats: DashboardStats
  leads_by_source: LeadsBySource[]
  leads_by_page: LeadsByPage[]
  leads_by_stage: LeadsByStage[]
  lead_volume_by_day: LeadVolumeByDay[]
}

export interface DashboardFilters {
  date_from?: string   // YYYY-MM-DD
  date_to?: string     // YYYY-MM-DD
  period?: '7d' | '30d' | '90d' | 'all'
}
