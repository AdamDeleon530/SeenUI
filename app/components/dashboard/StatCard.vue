<script setup lang="ts">
interface Props {
  label: string
  value: string | number
  subtext?: string
  trend?: { value: number; label: string }
  color?: 'brand' | 'success' | 'warning' | 'danger'
}

const props = withDefaults(defineProps<Props>(), { color: 'brand' })

const colorClasses = {
  brand:   'bg-brand-50 text-brand-600',
  success: 'bg-success-50 text-success-600',
  warning: 'bg-warning-50 text-warning-600',
  danger:  'bg-danger-50 text-danger-600',
}

const trendClass = computed(() => {
  if (!props.trend) return ''
  return props.trend.value >= 0 ? 'text-success-600' : 'text-danger-600'
})
</script>

<template>
  <AppCard>
    <div class="flex items-start justify-between">
      <div>
        <p class="text-sm font-medium text-surface-500">{{ label }}</p>
        <p class="text-2xl font-bold text-surface-900 mt-1 tracking-tight">{{ value }}</p>
        <p v-if="subtext" class="text-xs text-surface-400 mt-0.5">{{ subtext }}</p>
        <p v-if="trend" :class="['text-xs font-medium mt-1 flex items-center gap-1', trendClass]">
          <span>{{ trend.value >= 0 ? '↑' : '↓' }}</span>
          <span>{{ Math.abs(trend.value) }}% {{ trend.label }}</span>
        </p>
      </div>
      <div :class="['w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', colorClasses[color]]">
        <slot name="icon" />
      </div>
    </div>
  </AppCard>
</template>
