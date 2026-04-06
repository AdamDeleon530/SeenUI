export type LeadSource =
  | 'website_form'
  | 'embed_widget'
  | 'manual'
  | 'referral'
  | 'google'
  | 'instagram'
  | 'facebook'
  | 'other'

export type LeadStatus =
  | 'new'
  | 'contacted'
  | 'consultation_scheduled'
  | 'booked'
  | 'no_show'
  | 'won'
  | 'lost'

export type ActivityType =
  | 'lead_created'
  | 'status_changed'
  | 'note_added'
  | 'email_sent'
  | 'appointment_scheduled'
  | 'appointment_completed'
  | 'tag_added'
  | 'tag_removed'
  | 'field_updated'

export interface Lead {
  id: string
  tenant_id: string

  // Contact info
  full_name: string
  email: string
  phone: string | null

  // Request details
  requested_service: string | null
  preferred_date: string | null    // ISO date string
  preferred_time: string | null    // HH:MM
  notes: string | null

  // Pipeline state
  status: LeadStatus
  stage_id: string | null  // FK to pipeline_stages

  // Attribution / tracking
  source: LeadSource
  source_page: string | null      // landing page URL
  referring_url: string | null
  utm_source: string | null
  utm_medium: string | null
  utm_campaign: string | null
  utm_content: string | null
  utm_term: string | null

  // Appointment tracking
  consultation_scheduled_at: string | null
  booked_appointment_at: string | null
  appointment_completed_at: string | null

  // Meta
  assigned_to: string | null  // user_id
  is_archived: boolean
  created_at: string
  updated_at: string

  // Joined fields (not in DB column, populated via join)
  tags?: LeadTag[]
  assigned_user?: { id: string; full_name: string | null; email: string } | null
}

export interface LeadActivity {
  id: string
  tenant_id: string
  lead_id: string
  user_id: string | null  // null = system event
  type: ActivityType
  description: string
  metadata: Record<string, unknown> | null
  created_at: string

  // Joined
  user?: { id: string; full_name: string | null; email: string } | null
}

export interface LeadNote {
  id: string
  tenant_id: string
  lead_id: string
  user_id: string
  content: string
  created_at: string
  updated_at: string

  // Joined
  user?: { id: string; full_name: string | null; email: string } | null
}

export interface Tag {
  id: string
  tenant_id: string
  name: string
  color: string  // hex color
  created_at: string
}

export interface LeadTag {
  lead_id: string
  tag_id: string
  created_at: string
  tag?: Tag
}

// DTOs

export interface CreateLeadDto {
  full_name: string
  email: string
  phone?: string
  requested_service?: string
  preferred_date?: string
  preferred_time?: string
  notes?: string
  source?: LeadSource
  source_page?: string
  referring_url?: string
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
  utm_content?: string
  utm_term?: string
}

export interface UpdateLeadDto {
  full_name?: string
  email?: string
  phone?: string
  requested_service?: string
  preferred_date?: string
  preferred_time?: string
  notes?: string
  status?: LeadStatus
  stage_id?: string
  assigned_to?: string
  consultation_scheduled_at?: string
  booked_appointment_at?: string
  appointment_completed_at?: string
  is_archived?: boolean
}

export interface CreateNoteDto {
  content: string
}

export interface LeadFilters {
  status?: LeadStatus[]
  source?: LeadSource[]
  stage_id?: string
  assigned_to?: string
  search?: string
  date_from?: string
  date_to?: string
  is_archived?: boolean
}
