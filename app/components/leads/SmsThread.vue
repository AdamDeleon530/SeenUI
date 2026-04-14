<script setup lang="ts">
import { ref, onMounted } from '#imports'
import { useSms } from '~/composables/useSms'
import type { SmsMessage } from '~/types/sms'

const props = defineProps<{
  leadId: string
}>()

const { sendSms, fetchMessages } = useSms()

const messages = ref<SmsMessage[]>([])
const newMessage = ref('')
const sending = ref(false)
const loading = ref(false)
const error = ref<string | null>(null)

onMounted(async () => {
  await loadMessages()
})

async function loadMessages() {
  loading.value = true
  error.value = null
  try {
    messages.value = await fetchMessages(props.leadId)
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : 'Failed to load messages'
  } finally {
    loading.value = false
  }
}

async function handleSend() {
  const text = newMessage.value.trim()
  if (!text || sending.value) return

  sending.value = true
  error.value = null
  try {
    const sent = await sendSms(props.leadId, text)
    messages.value.push(sent)
    newMessage.value = ''
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : 'Failed to send message'
  } finally {
    sending.value = false
  }
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}
</script>

<template>
  <div class="flex flex-col h-full">
    <!-- Message thread -->
    <div class="flex-1 overflow-y-auto p-4 space-y-3">
      <div v-if="loading" class="text-center text-sm text-gray-400">Loading messages…</div>
      <div v-else-if="messages.length === 0" class="text-center text-sm text-gray-400">No messages yet.</div>

      <div
        v-for="msg in messages"
        :key="msg.id"
        class="flex"
        :class="msg.direction === 'outbound' ? 'justify-end' : 'justify-start'"
      >
        <div
          class="max-w-xs lg:max-w-md px-4 py-2 rounded-2xl text-sm"
          :class="msg.direction === 'outbound'
            ? 'bg-blue-600 text-white rounded-br-none'
            : 'bg-gray-100 text-gray-900 rounded-bl-none'"
        >
          <p class="whitespace-pre-wrap break-words">{{ msg.body }}</p>
          <p
            class="text-xs mt-1 opacity-70"
            :class="msg.direction === 'outbound' ? 'text-right' : 'text-left'"
          >
            {{ formatTime(msg.sent_at) }}
            <span v-if="msg.direction === 'outbound'" class="ml-1">
              · {{ msg.status }}
            </span>
          </p>
        </div>
      </div>
    </div>

    <!-- Error banner -->
    <div v-if="error" class="px-4 py-2 bg-red-50 text-red-700 text-sm border-t border-red-200">
      {{ error }}
    </div>

    <!-- Compose area -->
    <div class="border-t border-gray-200 p-3 flex gap-2">
      <textarea
        v-model="newMessage"
        rows="2"
        placeholder="Type a message…"
        class="flex-1 resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        @keydown.enter.exact.prevent="handleSend"
      />
      <button
        :disabled="!newMessage.trim() || sending"
        class="self-end px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        @click="handleSend"
      >
        {{ sending ? 'Sending…' : 'Send' }}
      </button>
    </div>
  </div>
</template>
