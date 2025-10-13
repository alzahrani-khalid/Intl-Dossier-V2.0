// JWT validation helper for Edge Functions
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

export interface AuthUser {
  id: string
  email: string
  role: string
  aud: string
  exp: number
}

/**
 * Validates JWT token and returns user data using Supabase client
 */
export async function validateJWT(authHeader: string | null): Promise<AuthUser> {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Missing or invalid authorization header')
  }

  const token = authHeader.replace('Bearer ', '')

  try {
    // Use Supabase client to verify the JWT
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Missing Supabase configuration')
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    // Get user from token
    const { data: { user }, error } = await supabase.auth.getUser(token)

    if (error || !user) {
      throw new Error('Invalid token or user not found')
    }

    return {
      id: user.id,
      email: user.email || '',
      role: user.role || 'authenticated',
      aud: user.aud || 'authenticated',
      exp: 0  // Supabase handles expiration automatically
    }
  } catch (error) {
    throw new Error(`JWT validation failed: ${error.message}`)
  }
}

/**
 * Creates a Supabase client with service role key
 */
export function createServiceClient() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase configuration')
  }

  return createClient(supabaseUrl, supabaseServiceKey)
}

/**
 * Creates a Supabase client with user's JWT token
 */
export function createUserClient(token: string) {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase configuration')
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  })
}