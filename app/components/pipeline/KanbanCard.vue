<script setup lang="ts">
import type { Lead } from '~/types/lead'

interface Props {
  lead: Lead
  dragging?: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{ click: [lead: Lead] }>()

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function getSourceIcon(source: string): string {
  const icons: Record<string, string> = {
    google:       'G',
    instagram:    'IG',
    facebook:     'FB',
    embed_widget: 'W',
    website_form: 'WF',
    manual:       'M',
    referral:     'R',
  }
  return icons[source] ?? '?'
}
</script>

<template>
  <div
    :class="[
      'bg-white rounded-xl border border-surface-100 shadow-card p-3 cursor-pointer',
      'hover:border-brand-200 hover:shadow-card-md transition-all duration-150',
      dragging ? 'opacity-50 shadow-card-lg rotate-1' : '',
    ]"
    @click="emit('click', lead)"
  >
    <!-- Name + source badge -->
    <div class="flex items-start justify-between gap-2 mb-2">
      <p class="text-sm font-medium text-surface-900 leading-snug">{{ lead.full_name }}</p>
      <span class="flex-shrink-0 text-xs bg-surface-100 text-surface-500 rounded-md px-1.5 py-0.5 font-mono">
        {{ getSourceIcon(lead.source) }}
      </span>
    </div>

    <!-- Service request -->
    <p v-if="lead.requested_service" class="text-xs text-surface-500 mb-2 truncate">
      {{ lead.requested_service }}
    </p>

    <!-- Tags -->
    <div v-if="lead.tags?.length" class="flex flex-wrap gap-1 mb-2">
      <span
        v-for="lt in (lead.tags as any[])"
        :key="lt.tag?.id"
        class="inline-flex items-center px-1.5 py-0.5 rounded-md text-xs font-medium text-white"
        :style="{ backgroundColor: lt.tag?.color ?? '#6172f3' }"
      >
        {{ lt.tag?.name }}
      </span>
    </div>

    <!-- Footer: date + preferred date -->
    <div class="flex items-center justify-between text-xs text-surface-400 mt-2">
      <span>{{ formatDate(lead.created_at) }}</span>
      <span v-if="lead.preferred_date" class="text-brand-500 font-medium">
        {{ formatDate(lead.preferred_date) }}
      </span>
    </div>
  </div>
</template>
