import { createClient } from '@supabase/supabase-js'

export const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  // During build, just throw a clear error; at runtime, envs must be set.
  throw new Error(
    'Missing Supabase environment variables (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)',
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Tradeoff: the SPA persists Supabase sessions in browser storage so tabs can
    // survive refreshes. A future BFF/HttpOnly-cookie boundary would reduce XSS
    // impact, but that is an architecture change outside this frontend fix lane.
    persistSession: true,
    autoRefreshToken: true,
  },
})
