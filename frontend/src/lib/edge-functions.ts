/**
 * Edge Function Utilities
 *
 * Standardized utilities for calling Supabase Edge Functions.
 * Prefer using these utilities over raw fetch() for consistent:
 * - Authentication handling (auto-includes auth token)
 * - Error handling
 * - Response typing
 * - CORS handling
 *
 * @example
 * ```typescript
 * // PREFERRED: Use supabase.functions.invoke()
 * const { data, error } = await supabase.functions.invoke<ResponseType>('function-name', {
 *   body: { key: 'value' }
 * })
 *
 * // OR use the helper functions from this module
 * const result = await invokeEdgeFunction<ResponseType>('function-name', {
 *   body: { key: 'value' }
 * })
 * ```
 */

import { supabase } from './supabase'

/**
 * Error thrown by Edge Function calls
 */
export class EdgeFunctionError extends Error {
  constructor(
    message: string,
    public readonly functionName: string,
    public readonly status?: number,
    public readonly code?: string,
    public readonly details?: unknown,
  ) {
    super(message)
    this.name = 'EdgeFunctionError'
  }
}

/**
 * Options for Edge Function invocation
 */
export interface EdgeFunctionOptions {
  body?: unknown
  headers?: Record<string, string>
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
}

/**
 * Result from Edge Function invocation
 */
export interface EdgeFunctionResult<T> {
  data: T | null
  error: EdgeFunctionError | null
}

/**
 * Invoke an Edge Function using the Supabase client
 *
 * This is the RECOMMENDED way to call Edge Functions as it:
 * - Automatically includes the auth token
 * - Handles CORS properly
 * - Provides consistent error handling
 *
 * @example
 * ```typescript
 * const result = await invokeEdgeFunction<{ users: User[] }>('list-users', {
 *   body: { limit: 10 }
 * })
 *
 * if (result.error) {
 *   console.error('Failed:', result.error.message)
 *   return
 * }
 *
 * console.warn('Users:', result.data.users)
 * ```
 */
export async function invokeEdgeFunction<T>(
  functionName: string,
  options: EdgeFunctionOptions = {},
): Promise<EdgeFunctionResult<T>> {
  try {
    const { data, error } = await supabase.functions.invoke<T>(functionName, {
      body: options.body as Record<string, any> | undefined,
      headers: options.headers,
      method: options.method,
    })

    if (error) {
      return {
        data: null,
        error: new EdgeFunctionError(
          error.message || 'Edge Function failed',
          functionName,
          undefined,
          error.name,
          error,
        ),
      }
    }

    return { data, error: null }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return {
      data: null,
      error: new EdgeFunctionError(message, functionName),
    }
  }
}

/**
 * Invoke an Edge Function and throw on error
 *
 * Use this when you want exceptions rather than error objects
 *
 * @throws EdgeFunctionError
 */
export async function invokeEdgeFunctionOrThrow<T>(
  functionName: string,
  options: EdgeFunctionOptions = {},
): Promise<T> {
  const result = await invokeEdgeFunction<T>(functionName, options)

  if (result.error) {
    throw result.error
  }

  if (result.data === null) {
    throw new EdgeFunctionError('No data returned', functionName)
  }

  return result.data
}

/**
 * Build the full URL for an Edge Function
 *
 * Use this when you need to construct URLs for special cases
 * (e.g., file uploads, streaming responses)
 *
 * @deprecated Prefer using invokeEdgeFunction() which handles auth automatically
 */
export function getEdgeFunctionUrl(
  functionName: string,
  queryParams?: Record<string, string>,
): string {
  const baseUrl = import.meta.env.VITE_SUPABASE_URL
  let url = `${baseUrl}/functions/v1/${functionName}`

  if (queryParams && Object.keys(queryParams).length > 0) {
    const params = new URLSearchParams(queryParams)
    url += `?${params.toString()}`
  }

  return url
}

/**
 * Get auth headers for Edge Function calls
 *
 * Use this only when you must use raw fetch() for special cases
 * (e.g., file uploads, streaming responses)
 *
 * @deprecated Prefer using invokeEdgeFunction() which handles auth automatically
 */
export async function getEdgeFunctionHeaders(): Promise<Record<string, string>> {
  const {
    data: { session },
  } = await supabase.auth.getSession()

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
  }

  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`
  }

  return headers
}

/**
 * Raw fetch to Edge Function with proper auth headers
 *
 * Use this ONLY for special cases like file uploads or streaming
 * that cannot use supabase.functions.invoke()
 *
 * @deprecated Prefer using invokeEdgeFunction() for standard requests
 */
export async function fetchEdgeFunction<T>(
  functionName: string,
  options: RequestInit & { queryParams?: Record<string, string> } = {},
): Promise<EdgeFunctionResult<T>> {
  try {
    const { queryParams, ...fetchOptions } = options
    const url = getEdgeFunctionUrl(functionName, queryParams)
    const headers = await getEdgeFunctionHeaders()

    const response = await fetch(url, {
      ...fetchOptions,
      headers: {
        ...headers,
        ...(fetchOptions.headers as Record<string, string>),
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return {
        data: null,
        error: new EdgeFunctionError(
          errorData.message || errorData.error || `HTTP ${response.status}`,
          functionName,
          response.status,
          errorData.code,
          errorData,
        ),
      }
    }

    const data = await response.json()
    return { data: data as T, error: null }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return {
      data: null,
      error: new EdgeFunctionError(message, functionName),
    }
  }
}
