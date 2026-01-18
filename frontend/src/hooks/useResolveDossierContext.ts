/**
 * useResolveDossierContext Hook
 * Feature: 035-dossier-context (Smart Dossier Context Inheritance)
 *
 * TanStack Query wrapper for the resolve-dossier-context Edge Function.
 * Resolves dossier context from entity relationships.
 * Target: <100ms response time.
 */

import { useQuery, type UseQueryOptions } from '@tanstack/react-query'
import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useDossierContextInternal } from '@/contexts/dossier-context'
import { useCreationContext } from '@/components/work-creation/hooks/useCreationContext'
import type {
  ResolvedDossierContext,
  DossierContextResponse,
  ContextEntityType,
} from '@/types/dossier-context.types'

// ============================================================================
// API Types
// ============================================================================

interface ResolveDossierContextRequest {
  entity_type: 'dossier' | 'engagement' | 'after_action' | 'position'
  entity_id: string
}

// ============================================================================
// API Call
// ============================================================================

async function fetchDossierContext(
  request: ResolveDossierContextRequest,
): Promise<DossierContextResponse> {
  const { data, error } = await supabase.functions.invoke<DossierContextResponse>(
    'resolve-dossier-context',
    {
      body: request,
    },
  )

  if (error) {
    console.error('Error resolving dossier context:', error)
    throw new Error(error.message || 'Failed to resolve dossier context')
  }

  if (!data) {
    throw new Error('No data returned from resolve-dossier-context')
  }

  return data
}

// ============================================================================
// Query Key Factory
// ============================================================================

export const dossierContextKeys = {
  all: ['dossier-context'] as const,
  resolve: (entityType: string, entityId: string) =>
    [...dossierContextKeys.all, 'resolve', entityType, entityId] as const,
}

// ============================================================================
// Hook Options
// ============================================================================

export interface UseResolveDossierContextOptions {
  /**
   * Entity type to resolve context from.
   * If not provided, will be auto-detected from route.
   */
  entityType?: 'dossier' | 'engagement' | 'after_action' | 'position'
  /**
   * Entity ID to resolve context from.
   * If not provided, will be auto-detected from route.
   */
  entityId?: string
  /**
   * Whether to auto-update the DossierContext with resolved data.
   * Defaults to true.
   */
  autoUpdateContext?: boolean
  /**
   * Whether to skip the query (e.g., when no context is needed).
   */
  skip?: boolean
  /**
   * Additional TanStack Query options.
   */
  queryOptions?: Omit<
    UseQueryOptions<DossierContextResponse, Error>,
    'queryKey' | 'queryFn' | 'enabled'
  >
}

// ============================================================================
// Hook Return Type
// ============================================================================

export interface UseResolveDossierContextReturn {
  data: DossierContextResponse | undefined
  dossiers: ResolvedDossierContext[]
  isLoading: boolean
  isError: boolean
  error: Error | null
  refetch: () => void
}

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * Resolves dossier context from entity relationships.
 *
 * @example
 * ```tsx
 * // Auto-detect from route
 * const { dossiers, isLoading } = useResolveDossierContext();
 *
 * // Explicit entity
 * const { dossiers } = useResolveDossierContext({
 *   entityType: 'engagement',
 *   entityId: engagementId,
 * });
 * ```
 */
export function useResolveDossierContext(
  options: UseResolveDossierContextOptions = {},
): UseResolveDossierContextReturn {
  const {
    entityType: explicitEntityType,
    entityId: explicitEntityId,
    autoUpdateContext = true,
    skip = false,
    queryOptions,
  } = options

  const creationContext = useCreationContext()
  const { actions } = useDossierContextInternal()

  // Determine entity type and ID (explicit or from route)
  const entityType: ResolveDossierContextRequest['entity_type'] | null =
    explicitEntityType ??
    (creationContext.entityType === 'dossier' ||
    creationContext.entityType === 'engagement' ||
    creationContext.entityType === 'after_action' ||
    creationContext.entityType === 'position'
      ? creationContext.entityType
      : null)

  const entityId = explicitEntityId ?? creationContext.entityId ?? null

  // Determine if we should run the query
  const shouldQuery = !skip && !!entityType && !!entityId

  // Query for context resolution
  const query = useQuery<DossierContextResponse, Error>({
    queryKey: dossierContextKeys.resolve(entityType ?? '', entityId ?? ''),
    queryFn: () =>
      fetchDossierContext({
        entity_type: entityType!,
        entity_id: entityId!,
      }),
    enabled: shouldQuery,
    staleTime: 5 * 60 * 1000, // 5 minutes - context doesn't change often
    gcTime: 30 * 60 * 1000, // 30 minutes
    retry: 1, // Quick failure for better UX
    ...queryOptions,
  })

  // Auto-update DossierContext when data is fetched
  useEffect(() => {
    if (!autoUpdateContext) return

    if (query.isLoading) {
      actions.setLoading(true)
      return
    }

    if (query.isError && query.error) {
      actions.setError(query.error.message)
      return
    }

    if (query.data) {
      actions.setResolvedContext(query.data.dossiers)
    }
  }, [autoUpdateContext, query.isLoading, query.isError, query.error, query.data, actions])

  return {
    data: query.data,
    dossiers: query.data?.dossiers ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: () => query.refetch(),
  }
}

export default useResolveDossierContext
