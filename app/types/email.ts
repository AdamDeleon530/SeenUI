export type EmailTemplateType =
  | 'lead_confirmation'       // sent to lead after form submission
  | 'lead_notification'       // sent to business on new lead
  | 'follow_up'               // sent to lead after status change
  | 'consultation_reminder'   // sent before scheduled consultation
  | 'appointment_reminder'    // sent before booked appointment
  | 'review_request'          // sent after appointment completed / won

export type EmailSendStatus = 'queued' | 'sent' | 'failed' | 'skipped'

export interface EmailTemplate {
  id: string
  tenant_id: string
  type: EmailTemplateType
  subject: string
  body_html: string
  body_text: string
  is_enabled: boolean
  trigger_status: string | null  // which lead status triggers this, if any
  created_at: string
  updated_at: string
}

export interface EmailSend {
  id: string
  tenant_id: string
  lead_id: string | null
  template_type: EmailTemplateType
  to_email: string
  to_name: string | null
  subject: string
  status: EmailSendStatus
  error_message: string | null
  sent_at: string | null
  created_at: string
}

// Internal abstraction — not stored in DB
export interface EmailPayload {
  to: string
  toName?: string
  subject: string
  html: string
  text?: string
  replyTo?: string
}

// DTO
export interface UpdateEmailTemplateDto {
  subject?: string
  body_html?: string
  body_text?: string
  is_enabled?: boolean
}
