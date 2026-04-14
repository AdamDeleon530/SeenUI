import type { SmsMessage } from '~/types/sms'

export function useSms() {
  async function sendSms(leadId: string, body: string): Promise<SmsMessage> {
    return await $fetch<SmsMessage>('/api/sms/send', {
      method: 'POST',
      body: { lead_id: leadId, body },
    })
  }

  async function fetchMessages(leadId: string): Promise<SmsMessage[]> {
    return await $fetch<SmsMessage[]>(`/api/sms/${leadId}/messages`)
  }

  return { sendSms, fetchMessages }
}
