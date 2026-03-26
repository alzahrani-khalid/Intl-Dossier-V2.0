/**
 * Shared API Client
 * @module lib/api-client
 *
 * Centralizes auth headers, base URL resolution, error handling, and JSON parsing
 * for all frontend API calls. All domain repositories should use these functions
 * instead of raw fetch().
 */

import { supabase } from '@/lib/supabase'

/** Options for API client functions */
export interface ApiClientOptions {
  /** Which backend to target (default: 'edge') */
  baseUrl?: 'edge' | 'express'
}

/**
 * Retrieves auth headers from the current Supabase session
 */
async function getAuthHeaders(): Promise<Record<string, string>> {
  const {
    data: { session },
  } = await supabase.auth.getSession()

  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${session?.access_token}`,
  }
}

/**
 * Resolves the full URL for an API request.
 * Reads env vars at call time to support test stubbing.
 */
function resolveUrl(path: string, options?: ApiClientOptions): string {
  if (options?.baseUrl === 'express') {
    const expressBase = import.meta.env.VITE_API_URL || ''
    return `${expressBase}${path}`
  }
  const edgeBase = import.meta.env.VITE_SUPABASE_URL + '/functions/v1'
  return `${edgeBase}${path}`
}

/**
 * Handles response checking and JSON parsing
 */
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    throw new Error(`API error ${response.status}: ${response.statusText}`)
  }
  return response.json() as Promise<T>
}

/**
 * Sends a GET request to the API
 */
export async function apiGet<T>(path: string, options?: ApiClientOptions): Promise<T> {
  const headers = await getAuthHeaders()
  const response = await fetch(resolveUrl(path, options), {
    method: 'GET',
    headers,
  })
  return handleResponse<T>(response)
}

/**
 * Sends a POST request to the API with a JSON body
 */
export async function apiPost<T>(
  path: string,
  body: unknown,
  options?: ApiClientOptions,
): Promise<T> {
  const headers = await getAuthHeaders()
  const response = await fetch(resolveUrl(path, options), {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  })
  return handleResponse<T>(response)
}

/**
 * Sends a PUT request to the API with a JSON body
 */
export async function apiPut<T>(
  path: string,
  body: unknown,
  options?: ApiClientOptions,
): Promise<T> {
  const headers = await getAuthHeaders()
  const response = await fetch(resolveUrl(path, options), {
    method: 'PUT',
    headers,
    body: JSON.stringify(body),
  })
  return handleResponse<T>(response)
}

/**
 * Sends a PATCH request to the API with a JSON body
 */
export async function apiPatch<T>(
  path: string,
  body: unknown,
  options?: ApiClientOptions,
): Promise<T> {
  const headers = await getAuthHeaders()
  const response = await fetch(resolveUrl(path, options), {
    method: 'PATCH',
    headers,
    body: JSON.stringify(body),
  })
  return handleResponse<T>(response)
}

/**
 * Sends a DELETE request to the API
 */
export async function apiDelete<T>(path: string, options?: ApiClientOptions): Promise<T> {
  const headers = await getAuthHeaders()
  const response = await fetch(resolveUrl(path, options), {
    method: 'DELETE',
    headers,
  })
  return handleResponse<T>(response)
}
