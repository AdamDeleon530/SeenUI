<script setup lang="ts">
import AppButton from '~/components/ui/AppButton.vue'
import AppCard from '~/components/ui/AppCard.vue'
import TemplateTextarea from '~/components/ui/TemplateTextarea.vue'

definePageMeta({ middleware: ['auth', 'tenant'] })

// ─── Types ────────────────────────────────────────────────────────────────────
interface EmailTemplate {
  id: string
  type: string
  subject: string
  body_html: string
  body_text: string
  is_enabled: boolean
  trigger_status: string | null
  updated_at: string
}

// ─── Template metadata ────────────────────────────────────────────────────────
const TEMPLATE_META: Record<string, { label: string; description: string; trigger: string }> = {
  lead_confirmation:       { label: 'Booking Confirmation', description: 'Sent to the customer immediately after they submit the booking form.', trigger: 'On form submit' },
  lead_notification:       { label: 'New Lead Alert', description: 'Sent to you (the business) when a new lead comes in.', trigger: 'On form submit' },
  follow_up:               { label: 'Follow-up', description: 'Sent to leads who haven\'t booked yet.', trigger: 'Manual / scheduled' },
  consultation_reminder:   { label: 'Consultation Reminder', description: 'Reminder sent before a scheduled consultation.', trigger: 'Before appointment' },
  appointment_reminder:    { label: 'Appointment Reminder', description: 'Reminder sent before a confirmed appointment.', trigger: 'Before appointment' },
  review_request:          { label: 'Review Request', description: 'Sent after a completed appointment asking for a review.', trigger: 'Status → Won' },
}

const VARIABLES = [
  { name: '{{first_name}}',        desc: 'Customer\'s first name' },
  { name: '{{lead_name}}',         desc: 'Customer\'s full name' },
  { name: '{{lead_email}}',        desc: 'Customer\'s email' },
  { name: '{{lead_phone}}',        desc: 'Customer\'s phone' },
  { name: '{{requested_service}}', desc: 'Service they requested' },
  { name: '{{preferred_date}}',    desc: 'Their preferred date' },
  { name: '{{business_name}}',     desc: 'Your business name' },
  { name: '{{lead_url}}',          desc: 'Link to the lead in the app' },
  { name: '{{review_url}}',        desc: 'Link to your review page' },
]

// ─── State ────────────────────────────────────────────────────────────────────
const loading   = ref(true)
const templates = ref<EmailTemplate[]>([])
const editing   = ref<EmailTemplate | null>(null)
const saving    = ref(false)
const deleting  = ref<string | null>(null)
const toggling  = ref<string | null>(null)
const previewHtml = ref(false)
const successMsg = ref('')

// Edit form
const form = reactive({ subject: '', body_html: '', body_text: '' })

// ─── Load ─────────────────────────────────────────────────────────────────────
async function load() {
  loading.value = true
  try {
    templates.value = await $fetch<EmailTemplate[]>('/api/email-templates')
  } finally {
    loading.value = false
  }
}
onMounted(load)

// ─── Edit ─────────────────────────────────────────────────────────────────────
function openEdit(t: EmailTemplate) {
  editing.value = t
  form.subject   = t.subject
  form.body_html = t.body_html
  form.body_text = t.body_text
  previewHtml.value = false
}

function closeEdit() {
  editing.value = null
}

async function saveTemplate() {
  if (!editing.value) return
  saving.value = true
  try {
    const updated = await $fetch<EmailTemplate>(`/api/email-templates/${editing.value.id}`, {
      method: 'PATCH',
      body: { subject: form.subject, body_html: form.body_html, body_text: form.body_text },
    })
    const idx = templates.value.findIndex(t => t.id === updated.id)
    if (idx !== -1) templates.value[idx] = updated
    successMsg.value = 'Template saved.'
    setTimeout(() => { successMsg.value = '' }, 2500)
    closeEdit()
  } finally {
    saving.value = false
  }
}

// ─── Toggle enable ────────────────────────────────────────────────────────────
async function toggleEnabled(t: EmailTemplate) {
  toggling.value = t.id
  try {
    const updated = await $fetch<EmailTemplate>(`/api/email-templates/${t.id}`, {
      method: 'PATCH',
      body: { is_enabled: !t.is_enabled },
    })
    const idx = templates.value.findIndex(x => x.id === updated.id)
    if (idx !== -1) templates.value[idx] = updated
  } finally {
    toggling.value = null
  }
}

// ─── Delete ───────────────────────────────────────────────────────────────────
async function deleteTemplate(t: EmailTemplate) {
  if (!confirm(`Delete the "${TEMPLATE_META[t.type]?.label ?? t.type}" template? It can be restored by re-running the seed.`)) return
  deleting.value = t.id
  try {
    await $fetch(`/api/email-templates/${t.id}`, { method: 'DELETE' })
    templates.value = templates.value.filter(x => x.id !== t.id)
  } finally {
    deleting.value = null
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function insertVar(varName: string) {
  form.body_html += varName
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
</script>

<template>
  <div class="p-6 max-w-4xl mx-auto space-y-6">
    <!-- Settings nav tabs -->
    <div class="flex gap-1 border-b border-surface-200 -mx-6 px-6">
      <NuxtLink
        v-for="tab in [
          { label: 'General',   href: '/settings' },
          { label: 'Embed',     href: '/settings/embed' },
          { label: 'Services',  href: '/settings/services' },
          { label: 'Email',     href: '/settings/email' },
          { label: 'Templates', href: '/settings/templates' },
          { label: 'Team',      href: '/settings/team' },
        ]"
        :key="tab.href"
        :to="tab.href"
        class="px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors"
        :class="$route.path === tab.href
          ? 'border-brand-500 text-brand-600'
          : 'border-transparent text-surface-500 hover:text-surface-700'"
      >
        {{ tab.label }}
      </NuxtLink>
    </div>

    <div>
      <h1 class="text-xl font-bold text-surface-900">Email Templates</h1>
      <p class="text-sm text-surface-500 mt-1">Customize the emails sent to your leads and yourself. Variables like <code class="text-xs bg-surface-100 px-1.5 py-0.5 rounded font-mono">{{first_name}}</code> are replaced with real values when sent.</p>
    </div>

    <div v-if="successMsg" class="text-sm text-green-700 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
      {{ successMsg }}
    </div>

    <!-- Loading skeleton -->
    <div v-if="loading" class="space-y-3">
      <div v-for="i in 3" :key="i" class="h-20 bg-surface-100 rounded-2xl animate-pulse" />
    </div>

    <!-- Template list -->
    <div v-else class="space-y-3">
      <AppCard
        v-for="t in templates"
        :key="t.id"
        class="!p-5"
      >
        <div class="flex items-start gap-4">
          <!-- Enable toggle -->
          <button
            class="mt-0.5 flex-shrink-0 w-10 h-6 rounded-full relative transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
            :class="t.is_enabled ? 'bg-brand-500' : 'bg-surface-200'"
            :disabled="toggling === t.id"
            @click="toggleEnabled(t)"
          >
            <span
              class="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200"
              :class="t.is_enabled ? 'translate-x-4' : 'translate-x-0'"
            />
          </button>

          <!-- Info -->
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 flex-wrap">
              <p class="text-sm font-semibold text-surface-900">
                {{ TEMPLATE_META[t.type]?.label ?? t.type }}
              </p>
              <span class="text-xs bg-surface-100 text-surface-500 px-2 py-0.5 rounded-full font-mono">
                {{ TEMPLATE_META[t.type]?.trigger ?? t.type }}
              </span>
              <span
                class="text-xs px-2 py-0.5 rounded-full font-medium"
                :class="t.is_enabled ? 'bg-green-100 text-green-700' : 'bg-surface-100 text-surface-400'"
              >
                {{ t.is_enabled ? 'Enabled' : 'Disabled' }}
              </span>
            </div>
            <p class="text-xs text-surface-500 mt-0.5">{{ TEMPLATE_META[t.type]?.description }}</p>
            <p class="text-xs text-surface-400 mt-1">Subject: <span class="text-surface-600">{{ t.subject }}</span></p>
          </div>

          <!-- Actions -->
          <div class="flex items-center gap-1.5 flex-shrink-0">
            <button
              class="px-3 py-1.5 text-xs font-medium text-brand-600 hover:bg-brand-50 rounded-lg transition-colors cursor-pointer"
              @click="openEdit(t)"
            >
              Edit
            </button>
            <button
              class="px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
              :disabled="deleting === t.id"
              @click="deleteTemplate(t)"
            >
              {{ deleting === t.id ? '...' : 'Delete' }}
            </button>
          </div>
        </div>
      </AppCard>

      <div v-if="!templates.length" class="text-center py-12 text-surface-400 text-sm">
        No templates found. They are seeded automatically when a new tenant is created.
      </div>
    </div>

    <!-- Edit modal -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition duration-150 ease-in"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div v-if="editing" class="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 bg-black/40 backdrop-blur-sm">
          <div class="bg-white rounded-2xl shadow-2xl w-full max-w-3xl my-8">
            <!-- Modal header -->
            <div class="flex items-center justify-between px-6 py-4 border-b border-surface-100">
              <div>
                <h2 class="text-base font-semibold text-surface-900">
                  Edit: {{ TEMPLATE_META[editing.type]?.label ?? editing.type }}
                </h2>
                <p class="text-xs text-surface-400 mt-0.5">Last updated {{ formatDate(editing.updated_at) }}</p>
              </div>
              <button class="p-1.5 rounded-lg text-surface-400 hover:bg-surface-100 cursor-pointer" @click="closeEdit">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div class="p-6 space-y-5">
              <!-- Subject -->
              <div>
                <label class="block text-xs font-medium text-surface-600 mb-1.5">Subject line</label>
                <input
                  v-model="form.subject"
                  type="text"
                  class="w-full px-3 py-2 text-sm rounded-xl border border-surface-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <!-- Variable reference -->
              <div class="bg-surface-50 rounded-xl p-3">
                <p class="text-xs font-semibold text-surface-600 mb-2">Available variables — click to insert into HTML body</p>
                <div class="flex flex-wrap gap-1.5">
                  <button
                    v-for="v in VARIABLES"
                    :key="v.name"
                    class="text-xs font-mono bg-white border border-surface-200 text-brand-600 px-2 py-1 rounded-lg hover:bg-brand-50 hover:border-brand-200 transition-colors cursor-pointer"
                    :title="v.desc"
                    @click="insertVar(v.name)"
                  >
                    {{ v.name }}
                  </button>
                </div>
              </div>

              <!-- HTML body -->
              <div>
                <div class="flex items-center justify-between mb-1.5">
                  <label class="text-xs font-medium text-surface-600">HTML body</label>
                  <button
                    class="text-xs text-brand-600 hover:text-brand-800 font-medium cursor-pointer"
                    @click="previewHtml = !previewHtml"
                  >
                    {{ previewHtml ? 'Edit' : 'Preview' }}
                  </button>
                </div>

                <!-- Preview pane -->
                <div
                  v-if="previewHtml"
                  class="w-full min-h-40 p-4 text-sm border border-surface-200 rounded-xl bg-white prose prose-sm max-w-none"
                  v-html="form.body_html"
                />
                <TemplateTextarea
                  v-else
                  v-model="form.body_html"
                  :rows="10"
                  placeholder="<p>Hi {{first_name}},</p>... (type {{ to see variables)"
                  :mono="true"
                />
              </div>

              <!-- Plain text fallback -->
              <div>
                <label class="block text-xs font-medium text-surface-600 mb-1.5">
                  Plain text fallback
                  <span class="text-surface-400 font-normal ml-1">(shown in email clients that don't render HTML)</span>
                </label>
                <TemplateTextarea
                  v-model="form.body_text"
                  :rows="4"
                  placeholder="Hi {{first_name}}, ... (type {{ to see variables)"
                />
              </div>
            </div>

            <!-- Modal footer -->
            <div class="flex items-center justify-end gap-3 px-6 py-4 border-t border-surface-100">
              <AppButton variant="secondary" @click="closeEdit">Cancel</AppButton>
              <AppButton :loading="saving" @click="saveTemplate">Save Template</AppButton>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>
