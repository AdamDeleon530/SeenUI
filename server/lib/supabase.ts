import { createClient } from '@supabase/supabase-js'

/**
 * Server-side Supabase client.
 * For use in trusted server routes only.
 */
export function useSupabaseAdmin() {
  const config = useRuntimeConfig()
  const url = config.public.supabaseUrl
  const key = config.public.supabaseKey

  if (!url || !key) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_KEY in environment')
  }

  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

/**
 * Extracts the authenticated user from an H3 event via the Authorization header.
 * Returns null if no valid session.
 * For use in API routes that need the current user identity.
 */
export async function getAuthenticatedUser(event: any) {
  const config = useRuntimeConfig()
  const authHeader = getHeader(event, 'authorization')
  if (!authHeader?.startsWith('Bearer ')) return null

  const token = authHeader.slice(7)
  const supabase = createClient(
    config.public.supabaseUrl!,
    config.public.supabaseKey!,
  )

  const { data: { user }, error } = await supabase.auth.getUser(token)
  if (error || !user) return null
  return user
}
