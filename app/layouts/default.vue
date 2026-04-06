<script setup lang="ts">
// Authenticated app layout — wraps all dashboard pages.
// Auth and tenant middleware are defined globally in middleware/auth.ts and middleware/tenant.ts.
// Profile and tenant are loaded here on mount so they're available across the entire app.

const authStore = useAuthStore()
const tenantStore = useTenantStore()

onMounted(async () => {
  if (!authStore.profile) {
    await authStore.fetchProfile()
  }
  if (!tenantStore.tenant) {
    await tenantStore.fetchCurrentTenant()
  }
})
</script>

<template>
  <div class="flex min-h-screen bg-surface-50">
    <AppSidebar />
    <div class="flex-1 flex flex-col min-w-0">
      <main class="flex-1">
        <slot />
      </main>
    </div>
  </div>
</template>
