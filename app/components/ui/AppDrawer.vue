<script setup lang="ts">
interface Props {
  open: boolean
  title?: string
  size?: 'sm' | 'md' | 'lg'
}

const props = withDefaults(defineProps<Props>(), { size: 'md' })
const emit = defineEmits<{ close: [] }>()

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-xl',
  lg: 'max-w-2xl',
}

onMounted(() => {
  const handler = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && props.open) emit('close')
  }
  window.addEventListener('keydown', handler)
  onUnmounted(() => window.removeEventListener('keydown', handler))
})
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div v-if="open" class="fixed inset-0 z-50 flex">
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-black/30 backdrop-blur-sm" @click="emit('close')" />

        <!-- Drawer panel slides from right -->
        <div class="relative ml-auto flex flex-col bg-white shadow-2xl w-full" :class="sizeClasses[size]">
          <!-- Header -->
          <div class="flex items-center justify-between px-6 py-4 border-b border-surface-100 flex-shrink-0">
            <slot name="header">
              <h2 class="text-base font-semibold text-surface-900">{{ title }}</h2>
            </slot>
            <button
              class="p-1.5 rounded-lg text-surface-400 hover:text-surface-600 hover:bg-surface-100 transition-colors"
              @click="emit('close')"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- Body (scrollable) -->
          <div class="flex-1 overflow-y-auto">
            <slot />
          </div>

          <!-- Footer -->
          <div v-if="$slots.footer" class="px-6 py-4 border-t border-surface-100 flex-shrink-0">
            <slot name="footer" />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
