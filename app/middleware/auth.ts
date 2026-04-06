// Protects all routes except auth pages and embed routes.
// Redirects unauthenticated users to /login.
export default defineNuxtRouteMiddleware((to) => {
  const publicRoutes = ['/login', '/register', '/forgot-password']
  const isPublicRoute = publicRoutes.includes(to.path)
  const isEmbedRoute = to.path.startsWith('/embed')

  if (isPublicRoute || isEmbedRoute) return

  const user = useSupabaseUser()
  if (!user.value) {
    return navigateTo('/login')
  }
})
