<script setup lang="ts">
import type { Lead, LeadStatus, UpdateLeadDto } from '~/types/lead'

interface Props {
  open: boolean
  lead: Lead | null
}

const props = defineProps<Props>()
const emit = defineEmits<{ close: []; updated: [lead: Lead] }>()

const { fetchLead, updateLead, addNote } = useLeads()

// Full lead with activities loaded when drawer opens.
// Omits 'notes' from Lead (which is a string field) and replaces with joined array.
type FullLead = Omit<Lead, 'notes'> & {
  notes?: any[]
  activities?: any[]
}
const fullLead = ref<FullLead | null>(null)
const loadingLead = ref(false)
const savingStatus = ref(false)
const newNote = ref('')
const addingNote = ref(false)

watch(() => props.open, async (open) => {
  if (open && props.lead) {
    loadingLead.value = true
    try {
      fullLead.value = await fetchLead(props.lead.id) as unknown as FullLead
    } finally {
      loadingLead.value = false
    }
  } else {
    fullLead.value = null
  }
})

type StatusOption = { value: LeadStatus; label: string }

const statusOptions: StatusOption[] = [
  { value: 'new',                    label: 'New Lead' },
  { value: 'contacted',              label: 'Contacted' },
  { value: 'consultation_scheduled', label: 'Consultation Scheduled' },
  { value: 'booked',                 label: 'Booked' },
  { value: 'no_show',                label: 'No Show' },
  { value: 'won',                    label: 'Won' },
  { value: 'lost',                   label: 'Lost' },
]

async function handleStatusChange(newStatus: string) {
  if (!fullLead.value) return
  savingStatus.value = true
  try {
    const updated = await updateLead(fullLead.value.id, { status: newStatus as LeadStatus })
    fullLead.value = { ...fullLead.value, status: updated.status }
    emit('updated', updated)
  } finally {
    savingStatus.value = false
  }
}

async function handleAddNote() {
  if (!fullLead.value || !newNote.value.trim()) return
  addingNote.value = true
  try {
    const note = await addNote(fullLead.value.id, { content: newNote.value.trim() })
    // Prepend note to local list
    if (fullLead.value) {
      fullLead.value = {
        ...fullLead.value,
        notes: [note, ...(fullLead.value.notes ?? [])],
      }
    }
    newNote.value = ''
  } finally {
    addingNote.value = false
  }
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString('en-US', {
    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
  })
}

function getActivityIcon(type: string): string {
  const icons: Record<string, string> = {
    lead_created:             '✦',
    status_changed:           '⇄',
    note_added:               '✎',
    email_sent:               '✉',
    appointment_scheduled:    '📅',
    appointment_completed:    '✓',
    tag_added:                '⊕',
    tag_removed:              '⊖',
  }
  return icons[type] ?? '•'
}
</script>

<template>
  <AppDrawer :open="open" size="md" @close="emit('close')">
    <template #header>
      <div class="flex items-center gap-3">
        <div class="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0">
          <span class="text-sm font-semibold text-brand-600">
            {{ (lead?.full_name ?? '?')[0]?.toUpperCase() }}
          </span>
        </div>
        <div class="min-w-0">
          <h2 class="text-sm font-semibold text-surface-900 truncate">{{ lead?.full_name }}</h2>
          <p class="text-xs text-surface-500 truncate">{{ lead?.email }}</p>
        </div>
      </div>
    </template>

    <!-- Loading state -->
    <div v-if="loadingLead" class="p-6 space-y-4">
      <div v-for="i in 4" :key="i" class="h-4 bg-surface-100 rounded animate-pulse" />
    </div>

    <div v-else-if="fullLead" class="divide-y divide-surface-50">
      <!-- Status + actions -->
      <div class="px-6 py-4">
        <div class="flex items-center gap-3">
          <div class="flex-1">
            <label class="block text-xs font-medium text-surface-500 mb-1.5">Status</label>
            <select
              :value="fullLead.status"
              :disabled="savingStatus"
              class="w-full px-3 py-2 text-sm rounded-xl border border-surface-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
              @change="handleStatusChange(($event.target as HTMLSelectElement).value)"
            >
              <option v-for="opt in statusOptions" :key="opt.value" :value="opt.value">
                {{ opt.label }}
              </option>
            </select>
          </div>
          <div class="flex-shrink-0 pt-5">
            <LeadStatusBadge :status="fullLead.status" />
          </div>
        </div>
      </div>

      <!-- Contact info -->
      <div class="px-6 py-4">
        <h3 class="text-xs font-semibold text-surface-500 uppercase tracking-wider mb-3">Contact</h3>
        <div class="space-y-2">
          <div class="flex items-center gap-2 text-sm">
            <svg class="w-4 h-4 text-surface-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <a :href="`mailto:${fullLead.email}`" class="text-brand-600 hover:underline truncate">{{ fullLead.email }}</a>
          </div>
          <div v-if="fullLead.phone" class="flex items-center gap-2 text-sm">
            <svg class="w-4 h-4 text-surface-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            <a :href="`tel:${fullLead.phone}`" class="text-surface-700 hover:text-brand-600">{{ fullLead.phone }}</a>
          </div>
        </div>
      </div>

      <!-- Request details -->
      <div class="px-6 py-4">
        <h3 class="text-xs font-semibold text-surface-500 uppercase tracking-wider mb-3">Request</h3>
        <div class="space-y-2 text-sm text-surface-700">
          <div v-if="fullLead.requested_service" class="flex gap-2">
            <span class="text-surface-400 w-24 flex-shrink-0">Service</span>
            <span>{{ fullLead.requested_service }}</span>
          </div>
          <div v-if="fullLead.preferred_date" class="flex gap-2">
            <span class="text-surface-400 w-24 flex-shrink-0">Preferred</span>
            <span>{{ fullLead.preferred_date }}{{ fullLead.preferred_time ? ` at ${fullLead.preferred_time}` : '' }}</span>
          </div>
          <div v-if="fullLead.notes" class="flex gap-2">
            <span class="text-surface-400 w-24 flex-shrink-0">Notes</span>
            <span class="text-surface-600">{{ fullLead.notes }}</span>
          </div>
        </div>
      </div>

      <!-- Attribution -->
      <div class="px-6 py-4">
        <h3 class="text-xs font-semibold text-surface-500 uppercase tracking-wider mb-3">Source</h3>
        <div class="space-y-1 text-xs text-surface-600">
          <div class="flex gap-2">
            <span class="text-surface-400 w-24">Source</span>
            <span class="capitalize">{{ fullLead.source.replace(/_/g, ' ') }}</span>
          </div>
          <div v-if="fullLead.source_page" class="flex gap-2">
            <span class="text-surface-400 w-24">Page</span>
            <span class="truncate text-brand-600">{{ fullLead.source_page }}</span>
          </div>
          <div v-if="fullLead.utm_campaign" class="flex gap-2">
            <span class="text-surface-400 w-24">Campaign</span>
            <span>{{ fullLead.utm_campaign }}</span>
          </div>
        </div>
      </div>

      <!-- Tags -->
      <div v-if="fullLead.tags?.length" class="px-6 py-4">
        <h3 class="text-xs font-semibold text-surface-500 uppercase tracking-wider mb-3">Tags</h3>
        <div class="flex flex-wrap gap-1.5">
          <span
            v-for="lt in fullLead.tags"
            :key="(lt as any).tag?.id ?? (lt as any).tag_id"
            class="inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium text-white"
            :style="{ backgroundColor: (lt as any).tag?.color ?? '#6172f3' }"
          >
            {{ (lt as any).tag?.name }}
          </span>
        </div>
      </div>

      <!-- Add note -->
      <div class="px-6 py-4">
        <h3 class="text-xs font-semibold text-surface-500 uppercase tracking-wider mb-3">Add Note</h3>
        <div class="flex gap-2">
          <textarea
            v-model="newNote"
            rows="2"
            placeholder="Add an internal note..."
            class="flex-1 px-3 py-2 text-sm rounded-xl border border-surface-300 resize-none focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          <AppButton
            size="sm"
            :loading="addingNote"
            :disabled="!newNote.trim()"
            class="self-end"
            @click="handleAddNote"
          >
            Add
          </AppButton>
        </div>
      </div>

      <!-- Notes -->
      <div v-if="fullLead.notes?.length" class="px-6 py-4">
        <h3 class="text-xs font-semibold text-surface-500 uppercase tracking-wider mb-3">Notes</h3>
        <div class="space-y-3">
          <div
            v-for="note in fullLead.notes"
            :key="note.id"
            class="bg-surface-50 rounded-xl p-3"
          >
            <p class="text-sm text-surface-700">{{ note.content }}</p>
            <p class="text-xs text-surface-400 mt-1.5">
              {{ note.user?.full_name ?? 'Staff' }} · {{ formatDate(note.created_at) }}
            </p>
          </div>
        </div>
      </div>

      <!-- Activity timeline -->
      <div v-if="fullLead.activities?.length" class="px-6 py-4">
        <h3 class="text-xs font-semibold text-surface-500 uppercase tracking-wider mb-3">Activity</h3>
        <div class="space-y-3">
          <div
            v-for="activity in fullLead.activities"
            :key="activity.id"
            class="flex items-start gap-3"
          >
            <div class="w-6 h-6 rounded-full bg-surface-100 flex items-center justify-center flex-shrink-0 text-xs text-surface-500 mt-0.5">
              {{ getActivityIcon(activity.type) }}
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm text-surface-700">{{ activity.description }}</p>
              <p class="text-xs text-surface-400 mt-0.5">
                {{ activity.user?.full_name ?? 'System' }} · {{ formatDate(activity.created_at) }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </AppDrawer>
</template>
