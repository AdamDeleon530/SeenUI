<script setup lang="ts">
/**
 * TemplateTextarea — a textarea that shows a {{variable}} autocomplete popup
 * when the user types "{{". Clicking a variable inserts it at the cursor.
 */

interface Variable {
  name: string
  desc: string
}

const VARIABLES: Variable[] = [
  { name: '{{first_name}}',        desc: 'Customer\'s first name' },
  { name: '{{lead_name}}',         desc: 'Customer\'s full name' },
  { name: '{{lead_email}}',        desc: 'Customer\'s email address' },
  { name: '{{lead_phone}}',        desc: 'Customer\'s phone number' },
  { name: '{{requested_service}}', desc: 'Service they requested' },
  { name: '{{preferred_date}}',    desc: 'Their preferred date' },
  { name: '{{preferred_time}}',    desc: 'Their preferred time' },
  { name: '{{business_name}}',     desc: 'Your business name' },
  { name: '{{lead_url}}',          desc: 'Link to lead in the app' },
  { name: '{{review_url}}',        desc: 'Link to your review page' },
]

const props = withDefaults(defineProps<{
  modelValue: string
  placeholder?: string
  rows?: number
  class?: string
  mono?: boolean
}>(), {
  placeholder: '',
  rows: 4,
  mono: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const textareaRef  = ref<HTMLTextAreaElement | null>(null)
const listRef      = ref<HTMLUListElement | null>(null)
const showPopup    = ref(false)
const popupTop     = ref(0)
const popupLeft    = ref(0)
const filterQuery  = ref('')
const highlightIdx = ref(0)

// Position of the opening "{{" in the textarea value
let triggerPos = -1

const filteredVars = computed(() => {
  const q = filterQuery.value.toLowerCase()
  return q
    ? VARIABLES.filter(v => v.name.includes(q) || v.desc.toLowerCase().includes(q))
    : VARIABLES
})

function onInput(e: Event) {
  const ta = e.target as HTMLTextAreaElement
  emit('update:modelValue', ta.value)

  const cursor = ta.selectionStart ?? 0
  const text   = ta.value

  // Look for "{{" ending at or before the cursor (no space between)
  const before = text.slice(0, cursor)
  const match  = before.match(/\{\{(\w*)$/)

  if (match) {
    triggerPos       = before.length - match[0].length
    filterQuery.value = match[1]  // what they've typed after {{
    highlightIdx.value = 0
    showPopup.value   = true
    positionPopup()
  } else {
    showPopup.value = false
    triggerPos = -1
  }
}

function onKeydown(e: KeyboardEvent) {
  if (!showPopup.value) return

  if (e.key === 'ArrowDown') {
    e.preventDefault()
    highlightIdx.value = (highlightIdx.value + 1) % filteredVars.value.length
    scrollHighlighted()
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    highlightIdx.value = (highlightIdx.value - 1 + filteredVars.value.length) % filteredVars.value.length
    scrollHighlighted()
  } else if (e.key === 'Enter' || e.key === 'Tab') {
    if (filteredVars.value.length) {
      e.preventDefault()
      insertVariable(filteredVars.value[highlightIdx.value])
    }
  } else if (e.key === 'Escape') {
    showPopup.value = false
  }
}

function insertVariable(variable: Variable) {
  const ta = textareaRef.value
  if (!ta || triggerPos < 0) return

  const cursor = ta.selectionStart ?? 0
  const text   = ta.value

  // Replace from triggerPos (the "{{") to cursor with the full variable
  const before = text.slice(0, triggerPos)
  const after  = text.slice(cursor)
  const newVal = before + variable.name + after

  emit('update:modelValue', newVal)

  // Restore cursor after the inserted variable
  nextTick(() => {
    if (!ta) return
    const newCursor = triggerPos + variable.name.length
    ta.setSelectionRange(newCursor, newCursor)
    ta.focus()
  })

  showPopup.value = false
  triggerPos = -1
}

function positionPopup() {
  const ta = textareaRef.value
  if (!ta) return

  // Position below the textarea — simple and reliable for multi-line editors
  const rect = ta.getBoundingClientRect()
  const container = ta.closest('.template-textarea-wrap') as HTMLElement
  if (!container) return

  // Relative to the wrapper div
  popupTop.value  = ta.offsetTop + ta.offsetHeight + 4
  popupLeft.value = ta.offsetLeft
}

function scrollHighlighted() {
  nextTick(() => {
    const list = listRef.value
    if (!list) return
    const item = list.children[highlightIdx.value] as HTMLElement | undefined
    item?.scrollIntoView({ block: 'nearest' })
  })
}

function onBlur() {
  // Delay so click on popup item fires first
  setTimeout(() => { showPopup.value = false }, 150)
}
</script>

<template>
  <div class="template-textarea-wrap relative">
    <textarea
      ref="textareaRef"
      :value="modelValue"
      :placeholder="placeholder"
      :rows="rows"
      :class="[
        'w-full px-3 py-2 text-sm rounded-xl border border-surface-300 resize-none focus:outline-none focus:ring-2 focus:ring-brand-500',
        mono ? 'font-mono text-xs' : '',
        $props.class ?? '',
      ]"
      @input="onInput"
      @keydown="onKeydown"
      @blur="onBlur"
    />

    <!-- Variable autocomplete popup -->
    <Transition
      enter-active-class="transition duration-100"
      enter-from-class="opacity-0 scale-95 -translate-y-1"
      leave-active-class="transition duration-75"
      leave-to-class="opacity-0 scale-95 -translate-y-1"
    >
      <div
        v-if="showPopup && filteredVars.length"
        class="absolute z-50 w-72 bg-white border border-surface-200 rounded-xl shadow-lg overflow-hidden"
        :style="{ top: popupTop + 'px', left: popupLeft + 'px' }"
      >
        <!-- Header -->
        <div class="px-3 py-2 border-b border-surface-100 bg-surface-50 flex items-center gap-2">
          <svg class="w-3 h-3 text-brand-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14"/>
          </svg>
          <span class="text-[11px] font-semibold text-surface-500 uppercase tracking-wider">
            Template Variables
          </span>
          <span class="ml-auto text-[10px] text-surface-400">↑↓ navigate · Enter insert</span>
        </div>

        <!-- Variable list -->
        <ul ref="listRef" class="h-52 overflow-y-auto py-1">
          <li
            v-for="(v, idx) in filteredVars"
            :key="v.name"
            class="flex items-center gap-3 px-3 py-2 cursor-pointer transition-colors"
            :class="idx === highlightIdx ? 'bg-brand-50' : 'hover:bg-surface-50'"
            @mousedown.prevent="insertVariable(v)"
            @mouseover="highlightIdx = idx"
          >
            <code
              class="flex-shrink-0 text-[11px] font-mono px-1.5 py-0.5 rounded-md"
              :class="idx === highlightIdx ? 'bg-brand-100 text-brand-700' : 'bg-surface-100 text-surface-600'"
            >{{ v.name }}</code>
            <span class="text-xs text-surface-500 truncate">{{ v.desc }}</span>
          </li>
        </ul>
      </div>
    </Transition>
  </div>
</template>
