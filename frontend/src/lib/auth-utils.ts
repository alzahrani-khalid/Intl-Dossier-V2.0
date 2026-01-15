/**
 * Auth utilities for Edge Function calls
 * Provides token management with automatic refresh
 */

import { supabase } from './supabase'

/**
 * Get a valid access token, refreshing if needed.
 * Use this for all Edge Function calls to ensure the token is valid.
 *
 * @throws Error if not authenticated or refresh fails
 */
export async function getAccessToken(): Promise<string> {
  // First try to get the current session
  let {
    data: { session },
  } = await supabase.auth.getSession()

  // Check if session is missing, expired, or about to expire (within 60 seconds)
  const needsRefresh =
    !session?.access_token || (session.expires_at && session.expires_at * 1000 < Date.now() + 60000)

  if (needsRefresh) {
    const { data, error } = await supabase.auth.refreshSession()
    if (error || !data.session?.access_token) {
      throw new Error('Not authenticated')
    }
    session = data.session
  }

  return session!.access_token
}

/**
 * Create headers for Edge Function calls with authorization
 */
export async function getAuthHeaders(): Promise<HeadersInit> {
  const accessToken = await getAccessToken()
  return {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  }
}

/**
 * Make an authenticated fetch request to an Edge Function
 * Handles token refresh automatically
 */
export async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const headers = await getAuthHeaders()
  return fetch(url, {
    ...options,
    headers: {
      ...headers,
      ...options.headers,
    },
  })
}
