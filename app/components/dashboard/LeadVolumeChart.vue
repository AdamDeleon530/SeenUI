<script setup lang="ts">
import type { LeadVolumeByDay } from '~/types/analytics'

interface Props {
  data: LeadVolumeByDay[]
}

const props = defineProps<Props>()

// Build a simple SVG bar chart — no external dep needed for MVP
const chartWidth = 600
const chartHeight = 120
const barGap = 2

const bars = computed(() => {
  if (!props.data.length) return []
  const max = Math.max(...props.data.map(d => d.count), 1)
  const barWidth = (chartWidth / props.data.length) - barGap

  return props.data.map((d, i) => ({
    x: i * (barWidth + barGap),
    y: chartHeight - (d.count / max) * chartHeight,
    width: barWidth,
    height: (d.count / max) * chartHeight,
    count: d.count,
    date: d.date,
  }))
})

const totalLeads = computed(() => props.data.reduce((sum, d) => sum + d.count, 0))
</script>

<template>
  <AppCard>
    <div class="flex items-center justify-between mb-4">
      <div>
        <h3 class="text-sm font-semibold text-surface-900">Lead Volume</h3>
        <p class="text-xs text-surface-500 mt-0.5">{{ totalLeads }} total in period</p>
      </div>
    </div>

    <div v-if="!data.length" class="h-24 flex items-center justify-center">
      <p class="text-sm text-surface-400">No data for this period</p>
    </div>

    <div v-else class="overflow-hidden">
      <svg
        :viewBox="`0 0 ${chartWidth} ${chartHeight}`"
        class="w-full h-24"
        preserveAspectRatio="none"
      >
        <g>
          <rect
            v-for="bar in bars"
            :key="bar.date"
            :x="bar.x"
            :y="bar.y"
            :width="bar.width"
            :height="bar.height"
            class="fill-brand-400 hover:fill-brand-500 transition-colors cursor-pointer"
            rx="2"
          >
            <title>{{ bar.date }}: {{ bar.count }} leads</title>
          </rect>
        </g>
      </svg>

      <!-- Date labels (first and last) -->
      <div class="flex justify-between mt-1">
        <span class="text-xs text-surface-400">{{ data[0]?.date }}</span>
        <span class="text-xs text-surface-400">{{ data[data.length - 1]?.date }}</span>
      </div>
    </div>
  </AppCard>
</template>
