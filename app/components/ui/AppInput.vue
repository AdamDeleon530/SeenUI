<script setup lang="ts">
interface Props {
  modelValue?: string | number | null
  label?: string
  placeholder?: string
  type?: string
  error?: string
  hint?: string
  required?: boolean
  disabled?: boolean
  size?: 'sm' | 'md'
}

const props = withDefaults(defineProps<Props>(), {
  type: 'text',
  size: 'md',
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const id = useId()

const sizeClasses = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-3 py-2 text-sm',
}
</script>

<template>
  <div class="space-y-1">
    <label v-if="label" :for="id" class="block text-sm font-medium text-surface-700">
      {{ label }}
      <span v-if="required" class="text-danger-500 ml-0.5">*</span>
    </label>
    <input
      :id="id"
      :type="type"
      :value="modelValue ?? ''"
      :placeholder="placeholder"
      :disabled="disabled"
      :required="required"
      :class="[
        'block w-full rounded-xl border transition-colors duration-150',
        'focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent',
        'disabled:bg-surface-50 disabled:cursor-not-allowed disabled:text-surface-400',
        error
          ? 'border-danger-300 bg-danger-50 text-danger-900 placeholder-danger-300'
          : 'border-surface-300 bg-white text-surface-900 placeholder-surface-400',
        sizeClasses[size],
      ]"
      @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
    />
    <p v-if="error" class="text-xs text-danger-600 flex items-center gap-1">
      <svg class="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
      </svg>
      {{ error }}
    </p>
    <p v-else-if="hint" class="text-xs text-surface-500">{{ hint }}</p>
  </div>
</template>
