<script setup lang="ts">
interface SelectOption {
  value: string | number
  label: string
  disabled?: boolean
}

interface Props {
  modelValue?: string | number | null
  options: SelectOption[]
  label?: string
  placeholder?: string
  error?: string
  required?: boolean
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {})
const emit = defineEmits<{ 'update:modelValue': [value: string] }>()
const id = useId()
</script>

<template>
  <div class="space-y-1">
    <label v-if="label" :for="id" class="block text-sm font-medium text-surface-700">
      {{ label }}
      <span v-if="required" class="text-danger-500 ml-0.5">*</span>
    </label>
    <select
      :id="id"
      :value="modelValue ?? ''"
      :disabled="disabled"
      :required="required"
      :class="[
        'block w-full px-3 py-2 text-sm rounded-xl border transition-colors duration-150',
        'focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent',
        'disabled:bg-surface-50 disabled:cursor-not-allowed',
        error ? 'border-danger-300' : 'border-surface-300',
      ]"
      @change="emit('update:modelValue', ($event.target as HTMLSelectElement).value)"
    >
      <option v-if="placeholder" value="" disabled>{{ placeholder }}</option>
      <option
        v-for="opt in options"
        :key="opt.value"
        :value="opt.value"
        :disabled="opt.disabled"
      >
        {{ opt.label }}
      </option>
    </select>
    <p v-if="error" class="text-xs text-danger-600">{{ error }}</p>
  </div>
</template>
