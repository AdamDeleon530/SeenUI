// Ensures tenant context is loaded before rendering protected pages.
// Redirects to /setup if authenticated user has no tenant assigned.
export default defineNuxtRouteMiddleware(async (to) => {
  const skipRoutes = ['/login', '/register', '/setup', '/forgot-password']
  if (skipRoutes.includes(to.path) || to.path.startsWith('/embed')) return

  const user = useSupabaseUser()
  if (!user.value) return // auth middleware handles this

  const tenantStore = useTenantStore()
  if (!tenantStore.tenant) {
    await tenantStore.fetchCurrentTenant()
  }

  // If still no tenant after fetch, redirect to setup
  if (!tenantStore.tenant && to.path !== '/setup') {
    return navigateTo('/setup')
  }
})
