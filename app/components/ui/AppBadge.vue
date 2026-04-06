<script setup lang="ts">
interface Props {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple'
  size?: 'sm' | 'md'
  dot?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default',
  size: 'md',
  dot: false,
})

const variantClasses = {
  default: 'bg-surface-100 text-surface-700',
  success: 'bg-success-50 text-success-700',
  warning: 'bg-warning-50 text-warning-600',
  danger:  'bg-danger-50 text-danger-600',
  info:    'bg-brand-50 text-brand-700',
  purple:  'bg-purple-50 text-purple-700',
}

const dotColors = {
  default: 'bg-surface-400',
  success: 'bg-success-500',
  warning: 'bg-warning-500',
  danger:  'bg-danger-500',
  info:    'bg-brand-500',
  purple:  'bg-purple-500',
}

const sizeClasses = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-xs',
}
</script>

<template>
  <span
    :class="[
      'inline-flex items-center gap-1.5 font-medium rounded-full',
      variantClasses[variant],
      sizeClasses[size],
    ]"
  >
    <span v-if="dot" :class="['w-1.5 h-1.5 rounded-full flex-shrink-0', dotColors[variant]]" />
    <slot />
  </span>
</template>
