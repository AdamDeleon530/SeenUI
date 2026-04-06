<script setup lang="ts">
interface Props {
  padding?: 'none' | 'sm' | 'md' | 'lg'
  border?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  padding: 'md',
  border: true,
})

const paddingClasses = {
  none: '',
  sm:   'p-4',
  md:   'p-5',
  lg:   'p-6',
}
</script>

<template>
  <div
    :class="[
      'bg-white rounded-2xl shadow-card',
      border ? 'border border-surface-100' : '',
      paddingClasses[padding],
    ]"
  >
    <slot />
  </div>
</template>
