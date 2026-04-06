<script setup lang="ts">
// Global middleware applied to all routes
definePageMeta({
  middleware: ['auth'],
})
</script>

<template>
  <div>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>
