<script setup lang="ts">
interface Props {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  disabled?: boolean
  type?: 'button' | 'submit' | 'reset'
  fullWidth?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'md',
  loading: false,
  disabled: false,
  type: 'button',
  fullWidth: false,
})

const variantClasses = {
  primary:   'bg-brand-500 text-white hover:bg-brand-600 focus:ring-brand-500 shadow-sm',
  secondary: 'bg-white text-surface-700 border border-surface-300 hover:bg-surface-50 focus:ring-brand-500 shadow-sm',
  ghost:     'bg-transparent text-surface-600 hover:bg-surface-100 focus:ring-brand-500',
  danger:    'bg-danger-600 text-white hover:bg-danger-700 focus:ring-danger-500 shadow-sm',
}

const sizeClasses = {
  sm: 'px-3 py-1.5 text-xs font-medium rounded-lg gap-1.5',
  md: 'px-4 py-2 text-sm font-medium rounded-xl gap-2',
  lg: 'px-5 py-2.5 text-base font-medium rounded-xl gap-2',
}

const classes = computed(() => [
  'inline-flex items-center justify-center transition-colors duration-150',
  'focus:outline-none focus:ring-2 focus:ring-offset-1',
  'disabled:opacity-50 disabled:cursor-not-allowed',
  variantClasses[props.variant],
  sizeClasses[props.size],
  props.fullWidth ? 'w-full' : '',
])
</script>

<template>
  <button
    :type="type"
    :disabled="disabled || loading"
    :class="classes"
  >
    <svg
      v-if="loading"
      class="animate-spin -ml-0.5 h-4 w-4"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
    <slot />
  </button>
</template>
