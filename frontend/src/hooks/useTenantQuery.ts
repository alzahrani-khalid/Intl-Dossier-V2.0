/**
 * Tenant-Scoped Query Hook
 *
 * Provides TanStack Query hooks that automatically include tenant context
 * in API calls and query keys for proper cache isolation.
 *
 * @module useTenantQuery
 */

import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryOptions,
  UseMutationOptions,
  QueryKey,
} from '@tanstack/react-query'
import { useTenant } from '@/contexts/TenantContext'

/**
 * Base fetch options with tenant context
 */
export interface TenantFetchOptions {
  /** Additional headers */
  headers?: Record<string, string>
  /** Include all accessible tenants (not just current) */
  includeAllTenants?: boolean
}

/**
 * Creates headers with tenant context
 */
export function useTenantHeaders(options?: TenantFetchOptions): Record<string, string> {
  const { currentTenantId } = useTenant()

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers || {}),
  }

  if (currentTenantId && !options?.includeAllTenants) {
    headers['x-tenant-id'] = currentTenantId
  }

  return headers
}

/**
 * Creates a tenant-scoped query key
 * Automatically includes tenant ID for cache isolation
 */
export function useTenantQueryKey(baseKey: QueryKey): QueryKey {
  const { currentTenantId } = useTenant()

  if (!currentTenantId) {
    return baseKey
  }

  // Prepend tenant ID to query key for cache isolation
  return ['tenant', currentTenantId, ...baseKey]
}

/**
 * Tenant-scoped query options
 */
export interface UseTenantQueryOptions<TQueryFnData = unknown, TError = Error, TData = TQueryFnData>
  extends Omit<UseQueryOptions<TQueryFnData, TError, TData>, 'queryKey'> {
  /** Base query key (will be prefixed with tenant context) */
  queryKey: QueryKey
  /** Whether to skip tenant scoping */
  skipTenantScope?: boolean
  /** Include data from all accessible tenants */
  includeAllTenants?: boolean
}

/**
 * Hook for tenant-scoped queries
 * Automatically handles tenant context and cache isolation
 */
export function useTenantQuery<TQueryFnData = unknown, TError = Error, TData = TQueryFnData>(
  options: UseTenantQueryOptions<TQueryFnData, TError, TData>,
) {
  const { currentTenantId, isLoading: isTenantLoading } = useTenant()
  const { queryKey, skipTenantScope, includeAllTenants, ...queryOptions } = options

  // Create tenant-scoped query key
  const scopedQueryKey = skipTenantScope ? queryKey : ['tenant', currentTenantId, ...queryKey]

  // Disable query while tenant context is loading
  const enabled =
    (queryOptions.enabled ?? true) && !isTenantLoading && (skipTenantScope || !!currentTenantId)

  return useQuery({
    ...queryOptions,
    queryKey: scopedQueryKey,
    enabled,
  })
}

/**
 * Tenant-scoped mutation options
 */
export interface UseTenantMutationOptions<
  TData = unknown,
  TError = Error,
  TVariables = void,
  TContext = unknown,
> extends UseMutationOptions<TData, TError, TVariables, TContext> {
  /** Query keys to invalidate on success (will be tenant-scoped) */
  invalidateKeys?: QueryKey[]
  /** Skip tenant scoping for invalidation */
  skipTenantScope?: boolean
}

/**
 * Hook for tenant-scoped mutations
 * Automatically handles cache invalidation with tenant context
 */
export function useTenantMutation<
  TData = unknown,
  TError = Error,
  TVariables = void,
  TContext = unknown,
>(options: UseTenantMutationOptions<TData, TError, TVariables, TContext>) {
  const queryClient = useQueryClient()
  const { currentTenantId } = useTenant()
  const { invalidateKeys, skipTenantScope, onSuccess, ...mutationOptions } = options

  return useMutation({
    ...mutationOptions,
    onSuccess: async (data, variables, context) => {
      // Call original onSuccess if provided
      if (onSuccess) {
        await onSuccess(data, variables, context)
      }

      // Invalidate tenant-scoped queries
      if (invalidateKeys && invalidateKeys.length > 0) {
        for (const key of invalidateKeys) {
          const scopedKey = skipTenantScope ? key : ['tenant', currentTenantId, ...key]

          await queryClient.invalidateQueries({ queryKey: scopedKey })
        }
      }
    },
  })
}

/**
 * Hook to create a tenant-aware API fetch function
 */
export function useTenantFetch() {
  const headers = useTenantHeaders()

  return async function tenantFetch<T>(
    url: string,
    options?: RequestInit & { includeAllTenants?: boolean },
  ): Promise<T> {
    const { includeAllTenants, ...fetchOptions } = options || {}

    const finalHeaders = {
      ...headers,
      ...((fetchOptions.headers as Record<string, string>) || {}),
    }

    // Remove tenant header if including all tenants
    if (includeAllTenants) {
      delete finalHeaders['x-tenant-id']
    }

    const response = await fetch(url, {
      ...fetchOptions,
      headers: finalHeaders,
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || `Request failed: ${response.status}`)
    }

    return response.json()
  }
}

/**
 * Hook to invalidate all tenant-scoped queries
 * Useful when switching tenants
 */
export function useInvalidateTenantQueries() {
  const queryClient = useQueryClient()
  const { currentTenantId } = useTenant()

  return async function invalidateAllTenantQueries() {
    if (!currentTenantId) return

    await queryClient.invalidateQueries({
      queryKey: ['tenant', currentTenantId],
    })
  }
}

/**
 * Hook to get optimistic update helpers for tenant-scoped data
 */
export function useTenantOptimisticUpdate<T>(queryKey: QueryKey) {
  const queryClient = useQueryClient()
  const tenantQueryKey = useTenantQueryKey(queryKey)

  return {
    /**
     * Get current cached data
     */
    getData: () => queryClient.getQueryData<T>(tenantQueryKey),

    /**
     * Set cached data
     */
    setData: (data: T) => queryClient.setQueryData(tenantQueryKey, data),

    /**
     * Update cached data
     */
    updateData: (updater: (old: T | undefined) => T) => {
      queryClient.setQueryData(tenantQueryKey, updater)
    },

    /**
     * Cancel any in-flight queries
     */
    cancelQueries: () => queryClient.cancelQueries({ queryKey: tenantQueryKey }),

    /**
     * Invalidate the query
     */
    invalidate: () => queryClient.invalidateQueries({ queryKey: tenantQueryKey }),
  }
}

/**
 * Creates a query key factory with tenant scoping
 */
export function createTenantQueryKeys<T extends string>(
  entity: T,
  keys: Record<string, (...args: unknown[]) => QueryKey>,
) {
  const result = {} as Record<keyof typeof keys, (...args: unknown[]) => QueryKey>

  for (const [key, fn] of Object.entries(keys)) {
    result[key as keyof typeof keys] = (...args: unknown[]) => [entity, ...fn(...args)]
  }

  return result
}

export default useTenantQuery
