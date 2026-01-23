/**
 * Mutation Factory Utility
 *
 * Generic factory for creating TanStack Query mutations with standardized
 * auth handling, fetch logic, error handling, and query invalidation.
 *
 * Eliminates code duplication across CRUD mutation hooks by providing
 * a single source of truth for common mutation patterns.
 *
 * @module lib/mutation-factory
 */

import {
  useMutation,
  useQueryClient,
  type UseMutationOptions,
  type UseMutationResult,
  type QueryKey,
} from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

/**
 * HTTP methods supported by the mutation factory
 */
export type HttpMethod = 'POST' | 'DELETE' | 'PATCH' | 'PUT';

/**
 * Configuration for building mutation URLs
 */
export interface MutationUrlConfig<TInput> {
  /**
   * Base endpoint path (e.g., 'dossiers-relationships-create')
   */
  endpoint: string;

  /**
   * Optional function to build dynamic URL from input
   * @param input - The mutation input data
   * @returns Complete URL path
   */
  buildUrl?: (input: TInput) => string;

  /**
   * Optional query parameters to append to URL
   * Can be static object or dynamic function
   */
  queryParams?:
    | Record<string, string | number | boolean | undefined>
    | ((input: TInput) => Record<string, string | number | boolean | undefined>);
}

/**
 * Configuration for query invalidation after successful mutation
 */
export interface InvalidationConfig<TInput, TResponse> {
  /**
   * Query keys to invalidate on success
   * Can be static array or dynamic function that receives mutation variables and response
   */
  queryKeys:
    | QueryKey[]
    | ((variables: TInput, response: TResponse) => QueryKey[]);
}

/**
 * Complete configuration for creating a mutation
 */
export interface MutationConfig<TInput, TResponse> {
  /**
   * HTTP method for the mutation
   */
  method: HttpMethod;

  /**
   * URL configuration
   */
  url: MutationUrlConfig<TInput>;

  /**
   * Query invalidation configuration
   */
  invalidation: InvalidationConfig<TInput, TResponse>;

  /**
   * Optional custom headers
   */
  headers?: Record<string, string> | ((input: TInput) => Record<string, string>);

  /**
   * Optional request body transformation
   * By default, input is sent as-is in JSON body
   */
  transformBody?: (input: TInput) => unknown;
}

/**
 * Build complete URL with query parameters
 */
function buildCompleteUrl<TInput>(
  config: MutationUrlConfig<TInput>,
  input: TInput
): string {
  // Use custom URL builder if provided
  if (config.buildUrl) {
    return config.buildUrl(input);
  }

  // Build base URL
  const baseUrl = `${supabase.supabaseUrl}/functions/v1/${config.endpoint}`;

  // Add query parameters if provided
  if (config.queryParams) {
    const params =
      typeof config.queryParams === 'function'
        ? config.queryParams(input)
        : config.queryParams;

    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });

    const queryString = searchParams.toString();
    return queryString ? `${baseUrl}?${queryString}` : baseUrl;
  }

  return baseUrl;
}

/**
 * Build request headers with authentication
 */
async function buildHeaders<TInput>(
  config: MutationConfig<TInput, unknown>,
  input: TInput
): Promise<Record<string, string>> {
  // Get authentication token
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    throw new Error('Not authenticated');
  }

  // Build default headers
  const defaultHeaders: Record<string, string> = {
    Authorization: `Bearer ${session.access_token}`,
    'Content-Type': 'application/json',
  };

  // Merge with custom headers if provided
  if (config.headers) {
    const customHeaders =
      typeof config.headers === 'function'
        ? config.headers(input)
        : config.headers;

    return { ...defaultHeaders, ...customHeaders };
  }

  return defaultHeaders;
}

/**
 * Execute mutation request
 */
async function executeMutation<TInput, TResponse>(
  config: MutationConfig<TInput, TResponse>,
  input: TInput
): Promise<TResponse> {
  // Build URL
  const url = buildCompleteUrl(config.url, input);

  // Build headers (includes auth check)
  const headers = await buildHeaders(config, input);

  // Build request body
  const body =
    config.method !== 'DELETE'
      ? JSON.stringify(config.transformBody ? config.transformBody(input) : input)
      : undefined;

  // Execute fetch request
  const response = await fetch(url, {
    method: config.method,
    headers,
    body,
  });

  // Handle errors
  if (!response.ok) {
    const error = await response.json().catch(() => ({
      error: response.statusText,
      message: 'Request failed',
    }));

    throw new Error(error.error || error.message || 'Failed to execute mutation');
  }

  // Return response data
  return await response.json();
}

/**
 * Get query keys to invalidate
 */
function getInvalidationKeys<TInput, TResponse>(
  config: InvalidationConfig<TInput, TResponse>,
  variables: TInput,
  response: TResponse
): QueryKey[] {
  if (typeof config.queryKeys === 'function') {
    return config.queryKeys(variables, response);
  }
  return config.queryKeys;
}

/**
 * Create a mutation hook using the factory pattern
 *
 * @param config - Mutation configuration
 * @param options - Optional TanStack Query mutation options
 * @returns TanStack Query mutation hook
 *
 * @example
 * ```ts
 * const useCreateRelationship = createMutation<CreateRelationshipInput, Relationship>({
 *   method: 'POST',
 *   url: {
 *     endpoint: 'dossiers-relationships-create',
 *     queryParams: (input) => ({ dossierId: input.parentId })
 *   },
 *   invalidation: {
 *     queryKeys: (variables) => [['relationships', variables.parentId]]
 *   }
 * });
 * ```
 */
export function createMutation<TInput, TResponse = unknown>(
  config: MutationConfig<TInput, TResponse>
) {
  return function useMutationHook(
    options?: Omit<
      UseMutationOptions<TResponse, Error, TInput>,
      'mutationFn' | 'onSuccess'
    > & {
      onSuccess?: (data: TResponse, variables: TInput) => void | Promise<void>;
    }
  ): UseMutationResult<TResponse, Error, TInput> {
    const queryClient = useQueryClient();

    return useMutation<TResponse, Error, TInput>({
      ...options,
      mutationFn: async (input: TInput) => {
        return executeMutation(config, input);
      },
      onSuccess: async (data, variables, context) => {
        // Invalidate configured query keys
        const keysToInvalidate = getInvalidationKeys(
          config.invalidation,
          variables,
          data
        );

        await Promise.all(
          keysToInvalidate.map((queryKey) =>
            queryClient.invalidateQueries({ queryKey })
          )
        );

        // Call custom onSuccess if provided
        if (options?.onSuccess) {
          await options.onSuccess(data, variables);
        }
      },
    });
  };
}

/**
 * Helper function to create simple CRUD mutations with common patterns
 */
export const mutationHelpers = {
  /**
   * Create a POST mutation for creating resources
   */
  create: <TInput, TResponse = unknown>(
    endpoint: string,
    invalidateKeys: QueryKey[]
  ) =>
    createMutation<TInput, TResponse>({
      method: 'POST',
      url: { endpoint },
      invalidation: { queryKeys: invalidateKeys },
    }),

  /**
   * Create a DELETE mutation for deleting resources
   */
  delete: <TInput, TResponse = unknown>(
    endpoint: string,
    buildQueryParams: (input: TInput) => Record<string, string | number | boolean>,
    invalidateKeys: (variables: TInput) => QueryKey[]
  ) =>
    createMutation<TInput, TResponse>({
      method: 'DELETE',
      url: { endpoint, queryParams: buildQueryParams },
      invalidation: { queryKeys: invalidateKeys },
    }),

  /**
   * Create a PATCH mutation for updating resources
   */
  update: <TInput, TResponse = unknown>(
    endpoint: string,
    invalidateKeys: QueryKey[]
  ) =>
    createMutation<TInput, TResponse>({
      method: 'PATCH',
      url: { endpoint },
      invalidation: { queryKeys: invalidateKeys },
    }),
};
