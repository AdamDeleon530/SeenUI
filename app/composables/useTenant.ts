import type { Tenant, TenantSettings } from '~/types/tenant'

export function useTenant() {
  const supabase = useSupabaseClient()
  const tenantStore = useTenantStore()

  async function updateTenant(updates: Partial<Tenant>) {
    if (!tenantStore.tenant) throw new Error('No tenant loaded')
    const { data, error } = await (supabase as any)
      .from('tenants')
      .update(updates)
      .eq('id', tenantStore.tenant.id)
      .select()
      .single()
    if (error) throw error
    tenantStore.tenant = data as Tenant
    return data
  }

  async function updateSettings(updates: Partial<TenantSettings>) {
    if (!tenantStore.tenant) throw new Error('No tenant loaded')
    const { data, error } = await (supabase as any)
      .from('tenant_settings')
      .update(updates)
      .eq('tenant_id', tenantStore.tenant.id)
      .select()
      .single()
    if (error) throw error
    tenantStore.settings = data as TenantSettings
    return data
  }

  async function uploadLogo(file: File): Promise<string> {
    if (!tenantStore.tenant) throw new Error('No tenant loaded')
    const ext = file.name.split('.').pop()
    const path = `tenants/${tenantStore.tenant.id}/logo.${ext}`
    const { error } = await supabase.storage.from('assets').upload(path, file, { upsert: true })
    if (error) throw error
    const { data } = supabase.storage.from('assets').getPublicUrl(path)
    await updateTenant({ logo_url: data.publicUrl })
    return data.publicUrl
  }

  return {
    tenant: computed(() => tenantStore.tenant),
    settings: computed(() => tenantStore.settings),
    updateTenant,
    updateSettings,
    uploadLogo,
  }
}
