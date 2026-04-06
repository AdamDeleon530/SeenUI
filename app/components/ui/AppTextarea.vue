<script setup lang="ts">
interface Props {
  modelValue?: string | null
  label?: string
  placeholder?: string
  error?: string
  hint?: string
  required?: boolean
  disabled?: boolean
  rows?: number
}

const props = withDefaults(defineProps<Props>(), { rows: 3 })
const emit = defineEmits<{ 'update:modelValue': [value: string] }>()
const id = useId()
</script>

<template>
  <div class="space-y-1">
    <label v-if="label" :for="id" class="block text-sm font-medium text-surface-700">
      {{ label }}
      <span v-if="required" class="text-danger-500 ml-0.5">*</span>
    </label>
    <textarea
      :id="id"
      :value="modelValue ?? ''"
      :placeholder="placeholder"
      :disabled="disabled"
      :required="required"
      :rows="rows"
      :class="[
        'block w-full px-3 py-2 text-sm rounded-xl border transition-colors duration-150 resize-none',
        'focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent',
        'disabled:bg-surface-50 disabled:cursor-not-allowed',
        error ? 'border-danger-300 bg-danger-50' : 'border-surface-300 bg-white',
      ]"
      @input="emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
    />
    <p v-if="error" class="text-xs text-danger-600">{{ error }}</p>
    <p v-else-if="hint" class="text-xs text-surface-500">{{ hint }}</p>
  </div>
</template>
