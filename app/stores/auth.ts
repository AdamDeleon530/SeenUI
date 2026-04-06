import { defineStore } from 'pinia'
import type { AppUser } from '~/types/user'

export const useAuthStore = defineStore('auth', () => {
  const profile = ref<AppUser | null>(null)
  const profileLoading = ref(false)

  const isAgencyAdmin = computed(() => profile.value?.role === 'agency_admin')
  const isBusinessOwner = computed(() => profile.value?.role === 'business_owner')
  const isStaff = computed(() => profile.value?.role === 'staff')

  async function fetchProfile() {
    const supabase = useSupabaseClient()
    const user = useSupabaseUser()
    if (!user.value) return

    profileLoading.value = true
    try {
      const { data } = await (supabase as any)
        .from('user_profiles')
        .select('*')
        .eq('id', user.value.id)
        .single()
      profile.value = data as AppUser | null
    } finally {
      profileLoading.value = false
    }
  }

  function clearProfile() {
    profile.value = null
  }

  return {
    profile,
    profileLoading,
    isAgencyAdmin,
    isBusinessOwner,
    isStaff,
    fetchProfile,
    clearProfile,
  }
})
