<script setup lang="ts">
import AppCard from '~/components/ui/AppCard.vue'
import AppInput from '~/components/ui/AppInput.vue'
import AppButton from '~/components/ui/AppButton.vue'

definePageMeta({ middleware: ['auth', 'tenant'] })

const { data: embedData, refresh } = await useFetch('/api/settings/embed')
const { data: services, refresh: refreshServices } = await useFetch<{ id: string; name: string }[]>('/api/services')

const s = embedData.value?.settings

const form = reactive({
  // Content
  embed_heading:                  s?.embed_heading                  ?? 'Request an Appointment',
  embed_subheading:               s?.embed_subheading               ?? '',
  embed_button_text:              s?.embed_button_text              ?? 'Book a Consultation',
  requested_service_placeholder:  s?.requested_service_placeholder  ?? 'e.g. Botox, Facial...',
  // Style
  embed_primary_color:            s?.embed_primary_color            ?? '#6172f3',
  embed_background_color:         s?.embed_background_color         ?? '#ffffff',
  embed_text_color:               s?.embed_text_color               ?? '#111827',
  embed_label_color:              s?.embed_label_color              ?? '#374151',
  embed_input_border_color:       s?.embed_input_border_color       ?? '#d1d5db',
  embed_border_radius:            s?.embed_border_radius            ?? 10,
  embed_font_family:              s?.embed_font_family              ?? 'Inter',
})

const FONTS = [
  'Inter', 'Roboto', 'Open Sans', 'Lato', 'Poppins', 'Nunito', 'Raleway',
  'Montserrat', 'Playfair Display', 'Merriweather', 'DM Sans', 'Plus Jakarta Sans',
  'Work Sans', 'IBM Plex Sans', 'Outfit',
]

// Services
const newServiceName = ref('')
const addingService = ref(false)
async function addService() {
  if (!newServiceName.value.trim()) return
  addingService.value = true
  try {
    await $fetch('/api/services', { method: 'POST', body: { name: newServiceName.value.trim() } })
    newServiceName.value = ''
    await refreshServices()
  } finally {
    addingService.value = false
  }
}
async function removeService(id: string) {
  await $fetch(`/api/services/${id}`, { method: 'DELETE' })
  await refreshServices()
}

// Live preview — debounced
const previewParams = reactive({ ...form })
let debounceTimer: ReturnType<typeof setTimeout>
watch(() => ({ ...form }), (val) => {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => Object.assign(previewParams, val), 350)
})

const saving = ref(false)
const saved  = ref(false)
async function handleSave() {
  saving.value = true
  try {
    await $fetch('/api/settings/embed', { method: 'PATCH', body: form })
    await refresh()
    saved.value = true
    setTimeout(() => { saved.value = false }, 2500)
  } finally {
    saving.value = false
  }
}

// Embed code
const copiedKey = ref<string | null>(null)
const activeTab = ref<'inline' | 'floating' | 'modal'>('inline')
const tabs = [
  { key: 'inline'   as const, label: 'Inline Form',    description: 'Embed a full booking form directly on any page.' },
  { key: 'floating' as const, label: 'Floating Button', description: 'A sticky CTA button that opens a modal form.' },
  { key: 'modal'    as const, label: 'Modal Trigger',   description: 'Add data-lbe-trigger to any button to open the booking form.' },
]
async function copySnippet(key: string, text: string) {
  await navigator.clipboard.writeText(text)
  copiedKey.value = key
  setTimeout(() => { copiedKey.value = null }, 2000)
}

const iframeSrc = computed(() => {
  if (!embedData.value?.tenant_id) return ''
  const p = new URLSearchParams({
    tenant:  embedData.value.tenant_id,
    mode:    activeTab.value,
    color:   previewParams.embed_primary_color,
    text:    previewParams.embed_button_text,
    heading: previewParams.embed_heading,
    sub:     previewParams.embed_subheading ?? '',
    ph:      previewParams.requested_service_placeholder,
    radius:  String(previewParams.embed_border_radius),
    font:    previewParams.embed_font_family,
    bg:      previewParams.embed_background_color,
    tc:      previewParams.embed_text_color,
    lc:      previewParams.embed_label_color,
    bc:      previewParams.embed_input_border_color,
  })
  return `/embed/preview?${p.toString()}`
})

const iframeHeight = computed(() => activeTab.value === 'inline' ? '540px' : '300px')

// Collapsible sections
const openSection = ref<'content' | 'style' | 'services'>('content')
</script>

<template>
  <div class="p-6 max-w-6xl mx-auto space-y-6">
    <div>
      <h1 class="text-xl font-bold text-surface-900">Settings</h1>
      <p class="text-sm text-surface-500 mt-0.5">Configure your booking embed</p>
    </div>

    <!-- Nav tabs -->
    <div class="flex gap-1 border-b border-surface-200">
      <NuxtLink
        v-for="tab in [
          { label: 'General',  href: '/settings' },
          { label: 'Embed',    href: '/settings/embed' },
          { label: 'Services', href: '/settings/services' },
          { label: 'Email',    href: '/settings/email' },
          { label: 'Templates', href: '/settings/templates' },
          { label: 'Team',     href: '/settings/team' },
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

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">

      <!-- LEFT: accordion editor -->
      <div class="lg:col-span-1 space-y-3">

        <!-- ── Content ── -->
        <AppCard padding="none">
          <button
            class="flex w-full items-center justify-between px-4 py-3.5 cursor-pointer"
            @click="openSection = openSection === 'content' ? 'style' : 'content'"
          >
            <span class="text-sm font-semibold text-surface-900">Content</span>
            <svg
              class="w-4 h-4 text-surface-400 transition-transform duration-200"
              :class="openSection === 'content' ? 'rotate-180' : ''"
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          <div v-if="openSection === 'content'" class="px-4 pb-4 space-y-3 border-t border-surface-100 pt-3">
            <AppInput v-model="form.embed_heading" label="Form Heading" placeholder="Request an Appointment" />
            <AppInput v-model="form.embed_subheading" label="Subheading" placeholder="Optional tagline" />
            <AppInput v-model="form.embed_button_text" label="Button Text" placeholder="Book a Consultation" />
            <AppInput v-model="form.requested_service_placeholder" label="Service Placeholder" placeholder="e.g. Botox, Facial..." hint="Used when no services are configured" />
          </div>
        </AppCard>

        <!-- ── Style ── -->
        <AppCard padding="none">
          <button
            class="flex w-full items-center justify-between px-4 py-3.5 cursor-pointer"
            @click="openSection = openSection === 'style' ? 'content' : 'style'"
          >
            <span class="text-sm font-semibold text-surface-900">Style</span>
            <svg
              class="w-4 h-4 text-surface-400 transition-transform duration-200"
              :class="openSection === 'style' ? 'rotate-180' : ''"
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          <div v-if="openSection === 'style'" class="px-4 pb-4 border-t border-surface-100 pt-3 space-y-4">

            <!-- Colors -->
            <div>
              <p class="text-xs font-semibold text-surface-500 uppercase tracking-wider mb-2">Colors</p>
              <div class="space-y-2">
                <div v-for="field in [
                  { key: 'embed_primary_color',      label: 'Button / Accent' },
                  { key: 'embed_background_color',   label: 'Form Background' },
                  { key: 'embed_text_color',         label: 'Text' },
                  { key: 'embed_label_color',        label: 'Labels' },
                  { key: 'embed_input_border_color', label: 'Input Border' },
                ]" :key="field.key" class="flex items-center gap-2">
                  <div
                    class="relative w-8 h-8 rounded-lg border border-surface-200 overflow-hidden flex-shrink-0 cursor-pointer"
                    :style="{ background: (form as any)[field.key] }"
                  >
                    <input
                      type="color"
                      :value="(form as any)[field.key]"
                      class="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                      @input="(form as any)[field.key] = ($event.target as HTMLInputElement).value"
                    />
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="text-xs text-surface-600 leading-none mb-1">{{ field.label }}</p>
                    <input
                      type="text"
                      :value="(form as any)[field.key]"
                      maxlength="7"
                      class="w-full text-xs font-mono px-2 py-1 border border-surface-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                      @input="(form as any)[field.key] = ($event.target as HTMLInputElement).value"
                    />
                  </div>
                </div>
              </div>
            </div>

            <!-- Border radius -->
            <div>
              <div class="flex items-center justify-between mb-1.5">
                <p class="text-xs font-semibold text-surface-500 uppercase tracking-wider">Corner Radius</p>
                <span class="text-xs font-mono text-surface-600">{{ form.embed_border_radius }}px</span>
              </div>
              <input
                v-model.number="form.embed_border_radius"
                type="range" min="0" max="24" step="1"
                class="w-full accent-brand-500"
              />
              <div class="flex justify-between text-[10px] text-surface-400 mt-0.5">
                <span>Square</span><span>Rounded</span><span>Pill</span>
              </div>
            </div>

            <!-- Font -->
            <div>
              <p class="text-xs font-semibold text-surface-500 uppercase tracking-wider mb-1.5">Font Family</p>
              <select
                v-model="form.embed_font_family"
                class="w-full text-sm px-3 py-2 border border-surface-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400 bg-white"
              >
                <option v-for="f in FONTS" :key="f" :value="f" :style="{ fontFamily: f }">{{ f }}</option>
              </select>
              <p class="text-[11px] text-surface-400 mt-1">Preview updates automatically</p>
            </div>
          </div>
        </AppCard>

        <!-- ── Services ── -->
        <AppCard padding="none">
          <button
            class="flex w-full items-center justify-between px-4 py-3.5 cursor-pointer"
            @click="openSection = openSection === 'services' ? 'content' : 'services'"
          >
            <div class="flex items-center gap-2">
              <span class="text-sm font-semibold text-surface-900">Services</span>
              <span v-if="services?.length" class="text-xs bg-brand-100 text-brand-600 font-medium px-1.5 py-0.5 rounded-full">{{ services.length }}</span>
            </div>
            <svg
              class="w-4 h-4 text-surface-400 transition-transform duration-200"
              :class="openSection === 'services' ? 'rotate-180' : ''"
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          <div v-if="openSection === 'services'" class="px-4 pb-4 border-t border-surface-100 pt-3">
            <p class="text-xs text-surface-500 mb-3">When services are added, the form shows a dropdown instead of the placeholder text.</p>
            <div class="flex gap-2 mb-3">
              <input
                v-model="newServiceName"
                type="text"
                placeholder="Service name..."
                class="flex-1 text-sm px-3 py-2 border border-surface-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400"
                @keydown.enter.prevent="addService"
              />
              <AppButton size="sm" :loading="addingService" @click="addService">Add</AppButton>
            </div>
            <div v-if="services?.length" class="space-y-1.5">
              <div
                v-for="svc in services" :key="svc.id"
                class="flex items-center justify-between px-3 py-2 bg-surface-50 rounded-lg border border-surface-100"
              >
                <span class="text-sm text-surface-800">{{ svc.name }}</span>
                <button
                  class="p-1 rounded text-surface-400 hover:text-danger-500 hover:bg-danger-50 transition-colors cursor-pointer"
                  @click="removeService(svc.id)"
                >
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <p v-else class="text-xs text-surface-400 italic">No services yet</p>
          </div>
        </AppCard>

        <!-- Save -->
        <div class="flex items-center gap-3 px-1">
          <AppButton :loading="saving" @click="handleSave">Save Changes</AppButton>
          <Transition enter-active-class="transition-opacity duration-200" leave-active-class="transition-opacity duration-200" enter-from-class="opacity-0" leave-to-class="opacity-0">
            <span v-if="saved" class="text-xs text-success-600 font-medium">Saved!</span>
          </Transition>
        </div>

        <!-- Tenant ID -->
        <AppCard>
          <p class="text-xs font-semibold text-surface-500 mb-1.5">Tenant ID</p>
          <code class="block text-xs font-mono bg-surface-50 border border-surface-200 rounded-lg px-3 py-2 text-surface-600 select-all break-all">{{ embedData?.tenant_id }}</code>
          <p class="text-xs text-surface-400 mt-2">Submit API: <code class="font-mono">{{ embedData?.api_url }}/submit</code></p>
        </AppCard>
      </div>

      <!-- RIGHT: preview + embed code -->
      <div class="lg:col-span-2 space-y-4">

        <!-- Embed type tabs -->
        <div class="flex gap-1 p-1 bg-surface-100 rounded-xl">
          <button
            v-for="tab in tabs" :key="tab.key"
            :class="['flex-1 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer', activeTab === tab.key ? 'bg-white shadow-sm text-surface-900' : 'text-surface-500 hover:text-surface-700']"
            @click="activeTab = tab.key"
          >{{ tab.label }}</button>
        </div>

        <!-- Live preview -->
        <div class="rounded-xl overflow-hidden border border-surface-200 bg-surface-50">
          <div class="flex items-center gap-1.5 px-3 py-2 bg-surface-100 border-b border-surface-200">
            <div class="w-2.5 h-2.5 rounded-full bg-red-300" />
            <div class="w-2.5 h-2.5 rounded-full bg-yellow-300" />
            <div class="w-2.5 h-2.5 rounded-full bg-green-300" />
            <span class="ml-2 text-xs text-surface-400">Live Preview</span>
            <span class="ml-auto text-[10px] text-surface-400">Updates as you type</span>
          </div>
          <iframe
            v-if="embedData?.tenant_id"
            :key="iframeSrc"
            :src="iframeSrc"
            class="w-full border-0"
            :style="{ height: iframeHeight }"
            sandbox="allow-scripts allow-same-origin"
          />
        </div>

        <!-- Embed code -->
        <AppCard>
          <div class="mb-3">
            <h2 class="text-sm font-semibold text-surface-900">Embed Code</h2>
            <p class="text-xs text-surface-500 mt-0.5">{{ tabs.find(t => t.key === activeTab)?.description }}</p>
          </div>
          <div class="relative">
            <pre class="text-xs font-mono bg-surface-950 text-surface-100 rounded-xl p-4 overflow-x-auto leading-relaxed whitespace-pre-wrap">{{ embedData?.snippets?.[activeTab] }}</pre>
            <button
              :class="['absolute top-3 right-3 px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer', copiedKey === activeTab ? 'bg-success-500 text-white' : 'bg-surface-700 text-surface-200 hover:bg-surface-600']"
              @click="copySnippet(activeTab, embedData?.snippets?.[activeTab] ?? '')"
            >{{ copiedKey === activeTab ? 'Copied!' : 'Copy' }}</button>
          </div>
        </AppCard>
      </div>
    </div>
  </div>
</template>
