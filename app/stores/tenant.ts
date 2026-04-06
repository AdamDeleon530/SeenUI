import { defineStore } from 'pinia'
import type { Tenant, TenantSettings } from '~/types/tenant'

export const useTenantStore = defineStore('tenant', () => {
  const tenant = ref<Tenant | null>(null)
  const settings = ref<TenantSettings | null>(null)
  const loading = ref(false)

  // For agency admins switching between client tenants
  const activeTenantId = ref<string | null>(null)

  async function fetchCurrentTenant() {
    const supabase = useSupabaseClient()
    const user = useSupabaseUser()
    if (!user.value) return

    loading.value = true
    try {
      // Get tenant_id from user profile
      const { data: profile } = await (supabase as any)
        .from('user_profiles')
        .select('tenant_id')
        .eq('id', user.value.id)
        .single()

      if (!profile?.tenant_id) return

      const tenantId = activeTenantId.value ?? profile.tenant_id

      // Fetch tenant + settings in parallel
      const [tenantRes, settingsRes] = await Promise.all([
        (supabase as any).from('tenants').select('*').eq('id', tenantId).single(),
        (supabase as any).from('tenant_settings').select('*').eq('tenant_id', tenantId).single(),
      ])

      if (tenantRes.data) tenant.value = tenantRes.data as Tenant
      if (settingsRes.data) settings.value = settingsRes.data as TenantSettings
    } finally {
      loading.value = false
    }
  }

  async function switchTenant(tenantId: string) {
    activeTenantId.value = tenantId
    tenant.value = null
    settings.value = null
    await fetchCurrentTenant()
  }

  function clearTenant() {
    tenant.value = null
    settings.value = null
    activeTenantId.value = null
  }

  return {
    tenant,
    settings,
    loading,
    activeTenantId,
    fetchCurrentTenant,
    switchTenant,
    clearTenant,
  }
})
