export type TenantPlan = 'trial' | 'starter' | 'pro' | 'agency'
export type TenantStatus = 'active' | 'suspended' | 'cancelled'

export interface Tenant {
  id: string
  name: string
  slug: string // unique URL-safe identifier
  logo_url: string | null
  website_domain: string | null
  notification_email: string | null
  timezone: string
  plan: TenantPlan
  status: TenantStatus
  agency_id: string | null
  created_at: string
  updated_at: string
}

export interface TenantSettings {
  id: string
  tenant_id: string
  business_hours: BusinessHours | null
  booking_form_fields: FormFieldConfig[]
  embed_primary_color: string
  embed_button_text: string
  embed_heading: string
  embed_subheading: string | null
  confirmation_email_enabled: boolean
  follow_up_email_enabled: boolean
  review_request_email_enabled: boolean
  review_request_delay_hours: number
  created_at: string
  updated_at: string
}

export interface BusinessHours {
  monday: DayHours | null
  tuesday: DayHours | null
  wednesday: DayHours | null
  thursday: DayHours | null
  friday: DayHours | null
  saturday: DayHours | null
  sunday: DayHours | null
}

export interface DayHours {
  open: string  // 'HH:MM'
  close: string // 'HH:MM'
}

export interface FormFieldConfig {
  key: string
  label: string
  type: 'text' | 'email' | 'tel' | 'textarea' | 'select' | 'date'
  required: boolean
  enabled: boolean
  options?: string[] // for select type
  placeholder?: string
  order: number
}

// DTO for creating/updating tenant
export interface CreateTenantDto {
  name: string
  slug: string
  notification_email?: string
  website_domain?: string
  timezone?: string
}

export interface UpdateTenantDto {
  name?: string
  logo_url?: string
  website_domain?: string
  notification_email?: string
  timezone?: string
}
