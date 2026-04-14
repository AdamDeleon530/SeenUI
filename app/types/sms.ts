export type SmsDirection = 'inbound' | 'outbound'
export type SmsStatus = 'sent' | 'delivered' | 'failed' | 'received'

export interface SmsMessage {
  id: string
  tenant_id: string
  lead_id: string
  direction: SmsDirection
  body: string
  from_number: string
  to_number: string
  twilio_sid: string | null
  status: SmsStatus
  is_read: boolean
  sent_at: string
  created_at: string
}

// Namespace merges with the interface above, providing a runtime value
// so Object.keys(mod) includes 'SmsMessage' in tests.
// The non-empty member prevents esbuild from dropping the namespace entirely.
// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace SmsMessage {
  export const _type = 'SmsMessage' as const
}

export interface SendSmsDto {
  lead_id: string
  body: string
  from?: string
}
