<script setup lang="ts">
// Unauthenticated layout — login, register, forgot password
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-surface-950 via-surface-900 to-surface-800 flex items-center justify-center p-4">
    <div class="w-full max-w-md">
      <!-- Logo -->
      <div class="text-center mb-8">
        <div class="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-brand-500 mb-4 shadow-lg">
          <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <h1 class="text-xl font-bold text-white">Local Booking Engine</h1>
        <p class="text-surface-400 text-sm mt-1">Your website's booking and follow-up CRM</p>
      </div>
      <slot />
    </div>
  </div>
</template>
