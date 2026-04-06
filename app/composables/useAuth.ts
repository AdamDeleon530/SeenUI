import type { AppUser } from '~/types/user'

export function useAuth() {
  const supabase = useSupabaseClient()
  const user = useSupabaseUser()

  async function signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
  }

  async function signUp(email: string, password: string, fullName: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
      },
    })
    if (error) throw error
    return data
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    await navigateTo('/login')
  }

  async function resetPassword(email: string) {
    const config = useRuntimeConfig()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${config.public.appUrl}/reset-password`,
    })
    if (error) throw error
  }

  async function fetchProfile(): Promise<AppUser | null> {
    if (!user.value) return null
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.value.id)
      .single()
    if (error) return null
    return data as AppUser
  }

  return {
    user,
    signIn,
    signUp,
    signOut,
    resetPassword,
    fetchProfile,
  }
}
