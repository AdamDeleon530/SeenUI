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
  review_request_sms_enabled: boolean
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

// ── Niche-specific form field definitions ────────────────────────────────────

export const NICHE_FIELDS: Record<string, FormFieldConfig[]> = {
  construction: [
    { key: 'job_type', label: 'Job Type', type: 'select', required: true, enabled: true, order: 4,
      options: ['Roofing', 'Remodeling', 'Painting', 'Flooring', 'HVAC', 'Plumbing', 'Electrical', 'Landscaping', 'Other'] },
    { key: 'property_address', label: 'Property Address', type: 'text', required: true, enabled: true, order: 5, placeholder: '123 Main St, City, State' },
    { key: 'project_description', label: 'Project Description', type: 'textarea', required: true, enabled: true, order: 6, placeholder: 'Describe the work needed...' },
    { key: 'estimated_budget', label: 'Estimated Budget', type: 'select', required: false, enabled: true, order: 7,
      options: ['Under $2,000', '$2,000 – $10,000', '$10,000 – $50,000', '$50,000+', 'Not sure'] },
    { key: 'timeline', label: 'Timeline', type: 'select', required: false, enabled: true, order: 8,
      options: ['ASAP', 'Within 1 month', '1–3 months', 'Just exploring'] },
    { key: 'referral_source', label: 'How did you hear about us?', type: 'select', required: false, enabled: true, order: 9,
      options: ['Google', 'Nextdoor', 'Facebook', 'Referral', 'Truck/Sign', 'Other'] },
  ],
  med_spa: [
    { key: 'treatment_interest', label: 'Treatment of Interest', type: 'select', required: true, enabled: true, order: 4,
      options: ['Botox', 'Dermal Fillers', 'Laser Hair Removal', 'HydraFacial', 'Microneedling', 'Chemical Peel', 'Body Contouring', 'Other'] },
    { key: 'primary_concern', label: 'Primary Concern / Goal', type: 'select', required: false, enabled: true, order: 5,
      options: ['Anti-aging', 'Skin texture', 'Volume loss', 'Hyperpigmentation', 'Acne/Scarring', 'Hair removal', 'Other'] },
    { key: 'is_first_visit', label: 'First time visiting us?', type: 'select', required: false, enabled: true, order: 6,
      options: ['Yes, first time', 'No, returning client'] },
    { key: 'consultation_type', label: 'Preferred Consultation', type: 'select', required: false, enabled: true, order: 7,
      options: ['In-person', 'Virtual'] },
    { key: 'referral_source', label: 'How did you hear about us?', type: 'select', required: false, enabled: true, order: 8,
      options: ['Instagram', 'TikTok', 'Google', 'Friend/Referral', 'Other'] },
  ],
  barbershop: [
    { key: 'service', label: 'Service', type: 'select', required: true, enabled: true, order: 4,
      options: ['Haircut', 'Fade', 'Beard Trim', 'Shape-Up', 'Hair + Beard', "Kid's Cut", 'Hair Color', 'Other'] },
    { key: 'preferred_barber', label: 'Preferred Barber', type: 'select', required: false, enabled: true, order: 5,
      options: ['No preference'] },
    { key: 'is_first_visit', label: 'First time visiting us?', type: 'select', required: false, enabled: true, order: 6,
      options: ['Yes, first time', 'No, returning client'] },
    { key: 'referral_source', label: 'How did you hear about us?', type: 'select', required: false, enabled: true, order: 7,
      options: ['Instagram', 'TikTok', 'Google', 'Walk-by', 'Friend', 'Other'] },
  ],
  general: [],
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
