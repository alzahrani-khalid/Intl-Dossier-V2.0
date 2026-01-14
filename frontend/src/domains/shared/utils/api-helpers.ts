/**
 * Shared Kernel - API Helper Utilities
 *
 * Common utilities for API communication used across
 * all bounded contexts.
 */

import { supabase } from '@/lib/supabase'
import { DomainError, fromApiError } from '../errors/domain-error'

/**
 * Get the Supabase API base URL
 */
export function getApiBaseUrl(): string {
  const url = import.meta.env.VITE_SUPABASE_URL
  if (!url) {
    throw new DomainError('Missing VITE_SUPABASE_URL environment variable', 'INTERNAL_ERROR')
  }
  return `${url}/functions/v1`
}

/**
 * Get authentication headers for API requests
 */
export async function getAuthHeaders(): Promise<Record<string, string>> {
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    throw new DomainError('Authentication required', 'AUTH_REQUIRED')
  }

  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${session.access_token}`,
  }
}

/**
 * Handle API response and extract JSON
 */
export async function handleApiResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorData: Record<string, unknown>
    try {
      errorData = await response.json()
    } catch {
      errorData = { message: response.statusText }
    }

    throw fromApiError({
      message:
        (errorData.error as { message_en?: string })?.message_en ||
        (errorData.message as string) ||
        'API request failed',
      code: (errorData.code as string) || 'OPERATION_FAILED',
      status: response.status,
      details: errorData,
    })
  }

  return response.json()
}

/**
 * Build URL search params from an object
 */
export function buildSearchParams(
  params: Record<string, string | number | boolean | undefined | null>,
): URLSearchParams {
  const searchParams = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.set(key, String(value))
    }
  })

  return searchParams
}

/**
 * Make a GET request to an Edge Function
 */
export async function apiGet<T>(
  endpoint: string,
  params?: Record<string, string | number | boolean | undefined | null>,
): Promise<T> {
  const headers = await getAuthHeaders()
  const baseUrl = getApiBaseUrl()
  const searchParams = params ? buildSearchParams(params) : null
  const url = searchParams?.toString()
    ? `${baseUrl}/${endpoint}?${searchParams.toString()}`
    : `${baseUrl}/${endpoint}`

  const response = await fetch(url, {
    method: 'GET',
    headers,
  })

  return handleApiResponse<T>(response)
}

/**
 * Make a POST request to an Edge Function
 */
export async function apiPost<T, D = unknown>(endpoint: string, data: D): Promise<T> {
  const headers = await getAuthHeaders()
  const baseUrl = getApiBaseUrl()

  const response = await fetch(`${baseUrl}/${endpoint}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
  })

  return handleApiResponse<T>(response)
}

/**
 * Make a PATCH request to an Edge Function
 */
export async function apiPatch<T, D = unknown>(endpoint: string, data: D): Promise<T> {
  const headers = await getAuthHeaders()
  const baseUrl = getApiBaseUrl()

  const response = await fetch(`${baseUrl}/${endpoint}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(data),
  })

  return handleApiResponse<T>(response)
}

/**
 * Make a DELETE request to an Edge Function
 */
export async function apiDelete<T>(endpoint: string): Promise<T> {
  const headers = await getAuthHeaders()
  const baseUrl = getApiBaseUrl()

  const response = await fetch(`${baseUrl}/${endpoint}`, {
    method: 'DELETE',
    headers,
  })

  return handleApiResponse<T>(response)
}

/**
 * Retry a failed request with exponential backoff
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number
    baseDelayMs?: number
    maxDelayMs?: number
  } = {},
): Promise<T> {
  const { maxRetries = 3, baseDelayMs = 1000, maxDelayMs = 10000 } = options

  let lastError: Error

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))

      // Don't retry on client errors (4xx)
      if (error instanceof DomainError && error.status >= 400 && error.status < 500) {
        throw error
      }

      if (attempt < maxRetries) {
        const delay = Math.min(baseDelayMs * Math.pow(2, attempt), maxDelayMs)
        await new Promise((resolve) => setTimeout(resolve, delay))
      }
    }
  }

  throw lastError!
}
