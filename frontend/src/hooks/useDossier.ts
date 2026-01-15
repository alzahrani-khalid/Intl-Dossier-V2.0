/**
 * Dossier Hooks
 * @module hooks/useDossier
 * @feature 026-unified-dossier-architecture
 * @feature 028-type-specific-dossier-pages
 * @feature 034-dossier-ui-polish
 *
 * TanStack Query hooks for dossier CRUD operations with automatic caching,
 * cache invalidation, optimistic updates, and type-safe variants.
 *
 * @description
 * This module provides a comprehensive set of React hooks for managing dossier entities:
 * - Query hooks for fetching single dossiers, lists, and type-specific collections
 * - Mutation hooks for create, update, and delete operations with optimistic updates
 * - Document linking hooks for managing dossier-document relationships
 * - Type-safe variants with runtime validation using type guards
 * - Prefetch and cache invalidation utilities
 *
 * @example
 * // Fetch a single dossier
 * const { data, isLoading } = useDossier('uuid-here');
 *
 * @example
 * // Fetch with type safety
 * const { data } = useTypedDossier('uuid', 'country');
 * // data is typed as CountryDossier
 *
 * @example
 * // Create a new dossier
 * const { mutate } = useCreateDossier();
 * mutate({ type: 'country', name_en: 'France', extension: { iso_code_2: 'FR' } });
 */

import { useMutation, useQuery, useQueryClient, type UseQueryOptions } from '@tanstack/react-query'
import {
  createDossier,
  getDossier,
  updateDossier,
  deleteDossier,
  listDossiers,
  getDossiersByType,
  getDocumentsForDossier,
  linkDocumentToDossier,
  unlinkDocumentFromDossier,
  getDossierCountsByType,
  type CreateDossierRequest,
  type UpdateDossierRequest,
  type DossierFilters,
  type DossierWithExtension,
  type DossiersListResponse,
  type DossierType,
  type LinkedDocument,
  type DossierTypeCount,
  DossierAPIError,
} from '@/services/dossier-api'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'

/**
 * Query Keys Factory for dossier-related queries
 *
 * @description
 * Provides a hierarchical key structure for TanStack Query cache management.
 * Keys are structured to enable granular cache invalidation.
 *
 * @example
 * // Invalidate all dossier queries
 * queryClient.invalidateQueries({ queryKey: dossierKeys.all });
 *
 * @example
 * // Invalidate only list queries
 * queryClient.invalidateQueries({ queryKey: dossierKeys.lists() });
 *
 * @example
 * // Invalidate specific dossier detail
 * queryClient.invalidateQueries({ queryKey: dossierKeys.detail('uuid') });
 */
export const dossierKeys = {
  all: ['dossiers'] as const,
  lists: () => [...dossierKeys.all, 'list'] as const,
  list: (filters?: DossierFilters) => [...dossierKeys.lists(), { filters }] as const,
  details: () => [...dossierKeys.all, 'detail'] as const,
  detail: (id: string) => [...dossierKeys.details(), id] as const,
  byType: (type: DossierType, page?: number, page_size?: number) =>
    [...dossierKeys.all, 'type', type, { page, page_size }] as const,
}

/**
 * Hook to fetch a single dossier by ID
 *
 * @description
 * Fetches a dossier with optional related data includes. The query is automatically
 * cached and can be invalidated using dossierKeys.detail(id).
 *
 * @param id - The unique identifier (UUID) of the dossier to fetch
 * @param include - Optional array of related data to include (e.g., ['extension', 'relationships'])
 * @param options - Additional TanStack Query options (excluding queryKey and queryFn)
 * @returns TanStack Query result with data typed as DossierWithExtension
 *
 * @example
 * // Basic usage
 * const { data, isLoading, error } = useDossier('uuid-123');
 *
 * @example
 * // With includes and options
 * const { data } = useDossier('uuid-123', ['extension', 'relationships'], {
 *   staleTime: 60000,
 *   enabled: !!dossierId,
 * });
 */
export function useDossier(
  id: string,
  include?: string[],
  options?: Omit<UseQueryOptions<DossierWithExtension, DossierAPIError>, 'queryKey' | 'queryFn'>,
) {
  return useQuery({
    queryKey: [...dossierKeys.detail(id), { include }],
    queryFn: () => getDossier(id, include),
    ...options,
  })
}

/**
 * Hook to fetch list of dossiers with filters
 *
 * @description
 * Fetches a paginated list of dossiers with optional filtering by type, status,
 * search query, and other criteria. Results are cached based on filter parameters.
 *
 * @param filters - Optional filters to apply (type, status, search, page, page_size)
 * @param options - Additional TanStack Query options (excluding queryKey and queryFn)
 * @returns TanStack Query result with paginated dossier list
 *
 * @example
 * // Fetch all dossiers
 * const { data } = useDossiers();
 *
 * @example
 * // Fetch with filters
 * const { data } = useDossiers({
 *   type: 'country',
 *   status: 'active',
 *   search: 'France',
 *   page: 1,
 *   page_size: 20,
 * });
 */
export function useDossiers(
  filters?: DossierFilters,
  options?: Omit<UseQueryOptions<DossiersListResponse, DossierAPIError>, 'queryKey' | 'queryFn'>,
) {
  return useQuery({
    queryKey: dossierKeys.list(filters),
    queryFn: () => listDossiers(filters),
    ...options,
  })
}

/**
 * Hook to fetch dossiers by type with pagination
 *
 * @description
 * Fetches a paginated list of dossiers filtered by a specific type.
 * Useful for type-specific listing pages (e.g., Countries, Organizations).
 *
 * @param type - The dossier type to filter by ('country', 'organization', 'person', etc.)
 * @param page - Page number for pagination (1-indexed, defaults to 1)
 * @param page_size - Number of items per page (defaults to 20)
 * @param options - Additional TanStack Query options (excluding queryKey and queryFn)
 * @returns TanStack Query result with paginated dossier list
 *
 * @example
 * // Fetch first page of countries
 * const { data } = useDossiersByType('country');
 *
 * @example
 * // Fetch page 2 with 10 items per page
 * const { data } = useDossiersByType('organization', 2, 10);
 */
export function useDossiersByType(
  type: DossierType,
  page?: number,
  page_size?: number,
  options?: Omit<UseQueryOptions<DossiersListResponse, DossierAPIError>, 'queryKey' | 'queryFn'>,
) {
  return useQuery({
    queryKey: dossierKeys.byType(type, page, page_size),
    queryFn: () => getDossiersByType(type, page, page_size),
    ...options,
  })
}

/**
 * Hook to create a new dossier
 *
 * @description
 * Creates a new dossier entity with automatic cache invalidation and toast notifications.
 * On success, invalidates list queries and pre-populates the detail cache with the new entity.
 *
 * @returns TanStack Mutation result with mutate function accepting CreateDossierRequest
 *
 * @example
 * const { mutate, isPending, isError } = useCreateDossier();
 *
 * // Create a country dossier
 * mutate({
 *   type: 'country',
 *   name_en: 'France',
 *   name_ar: 'فرنسا',
 *   status: 'active',
 *   extension: { iso_code_2: 'FR', iso_code_3: 'FRA' },
 * });
 */
export function useCreateDossier() {
  const queryClient = useQueryClient()
  const { t } = useTranslation()

  return useMutation({
    mutationFn: (request: CreateDossierRequest) => createDossier(request),
    onSuccess: (data) => {
      // Invalidate all dossier lists to refetch with new data
      queryClient.invalidateQueries({ queryKey: dossierKeys.lists() })
      queryClient.invalidateQueries({ queryKey: dossierKeys.byType(data.type) })

      // Set the new dossier in the cache
      queryClient.setQueryData(dossierKeys.detail(data.id), data)

      toast.success(t('dossier.create.success', { name: data.name_en }))
    },
    onError: (error: DossierAPIError) => {
      toast.error(t('dossier.create.error', { message: error.message }))
    },
  })
}

/**
 * Hook to update a dossier with optimistic updates
 *
 * @description
 * Updates an existing dossier with optimistic UI updates for instant feedback.
 * Implements TanStack Query's optimistic update pattern:
 * 1. Immediately updates the cache with new values (onMutate)
 * 2. Rolls back to previous state if the mutation fails (onError)
 * 3. Updates cache with server response on success (onSuccess)
 *
 * @returns TanStack Mutation result with mutate function accepting { id, request }
 *
 * @example
 * const { mutate, isPending } = useUpdateDossier();
 *
 * // Update dossier name and status
 * mutate({
 *   id: 'uuid-123',
 *   request: {
 *     name_en: 'Updated Name',
 *     status: 'inactive',
 *   },
 * });
 */
export function useUpdateDossier() {
  const queryClient = useQueryClient()
  const { t } = useTranslation()

  return useMutation({
    mutationFn: ({ id, request }: { id: string; request: UpdateDossierRequest }) =>
      updateDossier(id, request),
    onMutate: async ({ id, request }) => {
      // Cancel any outgoing refetches to avoid overwriting optimistic update
      await queryClient.cancelQueries({ queryKey: dossierKeys.detail(id) })

      // Snapshot the previous value
      const previousDossier = queryClient.getQueryData<DossierWithExtension>(dossierKeys.detail(id))

      // Optimistically update the cache
      if (previousDossier) {
        queryClient.setQueryData<DossierWithExtension>(dossierKeys.detail(id), {
          ...previousDossier,
          ...request,
          updated_at: new Date().toISOString(),
        })
      }

      return { previousDossier }
    },
    onSuccess: (data, { id }) => {
      // Update the cache with server response
      queryClient.setQueryData(dossierKeys.detail(id), data)

      // Invalidate lists to refetch
      queryClient.invalidateQueries({ queryKey: dossierKeys.lists() })
      queryClient.invalidateQueries({ queryKey: dossierKeys.byType(data.type) })

      toast.success(t('dossier.update.success', { name: data.name_en }))
    },
    onError: (error: DossierAPIError, { id }, context) => {
      // Rollback optimistic update on error
      if (context?.previousDossier) {
        queryClient.setQueryData(dossierKeys.detail(id), context.previousDossier)
      }

      toast.error(t('dossier.update.error', { message: error.message }))
    },
  })
}

/**
 * Hook to delete a dossier with optimistic removal
 *
 * @description
 * Deletes a dossier with optimistic cache removal for instant UI feedback.
 * Implements soft-delete pattern (marks as deleted) with rollback on failure.
 *
 * @returns TanStack Mutation result with mutate function accepting dossier ID
 *
 * @example
 * const { mutate, isPending } = useDeleteDossier();
 *
 * // Delete with confirmation
 * const handleDelete = (id: string) => {
 *   if (confirm('Are you sure?')) {
 *     mutate(id);
 *   }
 * };
 */
export function useDeleteDossier() {
  const queryClient = useQueryClient()
  const { t } = useTranslation()

  return useMutation({
    mutationFn: (id: string) => deleteDossier(id),
    onMutate: async (id) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: dossierKeys.detail(id) })

      // Snapshot the previous value
      const previousDossier = queryClient.getQueryData<DossierWithExtension>(dossierKeys.detail(id))

      // Optimistically remove from cache
      queryClient.removeQueries({ queryKey: dossierKeys.detail(id) })

      return { previousDossier }
    },
    onSuccess: (_, id) => {
      // Invalidate all lists to refetch without deleted item
      queryClient.invalidateQueries({ queryKey: dossierKeys.lists() })
      queryClient.invalidateQueries({ queryKey: dossierKeys.all })

      toast.success(t('dossier.delete.success'))
    },
    onError: (error: DossierAPIError, id, context) => {
      // Restore the previous value on error
      if (context?.previousDossier) {
        queryClient.setQueryData(dossierKeys.detail(id), context.previousDossier)
      }

      toast.error(t('dossier.delete.error', { message: error.message }))
    },
  })
}

/**
 * Hook to prefetch a dossier for improved UX
 *
 * @description
 * Returns a prefetch function that can be called on hover or focus events
 * to pre-populate the cache before navigation. Improves perceived performance.
 *
 * @returns Prefetch function accepting dossier ID
 *
 * @example
 * const prefetch = usePrefetchDossier();
 *
 * // Prefetch on hover
 * <Link
 *   to={`/dossiers/${id}`}
 *   onMouseEnter={() => prefetch(id)}
 * >
 *   View Dossier
 * </Link>
 */
export function usePrefetchDossier() {
  const queryClient = useQueryClient()

  return (id: string) => {
    queryClient.prefetchQuery({
      queryKey: dossierKeys.detail(id),
      queryFn: () => getDossier(id),
    })
  }
}

/**
 * Hook to invalidate all dossier queries
 *
 * @description
 * Returns a function to invalidate all dossier-related queries in the cache.
 * Useful after bulk operations or external data changes that affect multiple dossiers.
 *
 * @returns Invalidation function (no parameters)
 *
 * @example
 * const invalidate = useInvalidateDossiers();
 *
 * // After bulk import
 * await bulkImportDossiers(data);
 * invalidate(); // Force refetch of all dossier queries
 */
export function useInvalidateDossiers() {
  const queryClient = useQueryClient()

  return () => {
    queryClient.invalidateQueries({ queryKey: dossierKeys.all })
  }
}

/**
 * Query Keys Factory for document-dossier link queries
 *
 * @description
 * Provides cache keys for managing document-dossier relationships.
 * Enables granular invalidation of document link queries per dossier.
 */
export const documentLinksKeys = {
  all: ['documentLinks'] as const,
  forDossier: (dossierId: string) => [...documentLinksKeys.all, 'dossier', dossierId] as const,
}

/**
 * Hook to fetch linked documents for a dossier
 *
 * @description
 * Fetches all documents (positions, MOUs, briefs) linked to a specific dossier.
 * Returns an array of LinkedDocument objects with document metadata.
 *
 * @param dossierId - The dossier ID to fetch linked documents for
 * @param options - Additional TanStack Query options
 * @returns TanStack Query result with array of LinkedDocument
 *
 * @example
 * const { data: documents, isLoading } = useDocumentLinks('dossier-uuid');
 *
 * // Render linked documents
 * documents?.map(doc => <DocumentCard key={doc.id} document={doc} />);
 */
export function useDocumentLinks(
  dossierId: string,
  options?: Omit<UseQueryOptions<LinkedDocument[], DossierAPIError>, 'queryKey' | 'queryFn'>,
) {
  return useQuery({
    queryKey: documentLinksKeys.forDossier(dossierId),
    queryFn: () => getDocumentsForDossier(dossierId),
    ...options,
  })
}

/**
 * Hook to link a document to a dossier
 *
 * @description
 * Creates a relationship between a document (position, MOU, or brief) and a dossier.
 * Automatically invalidates the document links query for the affected dossier.
 *
 * @returns TanStack Mutation result with mutate function
 *
 * @example
 * const { mutate } = useLinkDocument();
 *
 * // Link a position paper to a dossier
 * mutate({
 *   dossierId: 'dossier-uuid',
 *   documentId: 'position-uuid',
 *   documentType: 'position',
 * });
 */
export function useLinkDocument() {
  const queryClient = useQueryClient()
  const { t } = useTranslation()

  return useMutation({
    mutationFn: ({
      dossierId,
      documentId,
      documentType,
    }: {
      dossierId: string
      documentId: string
      documentType: 'position' | 'mou' | 'brief'
    }) => linkDocumentToDossier(dossierId, documentId, documentType),
    onSuccess: (_, variables) => {
      // Invalidate document links for this dossier
      queryClient.invalidateQueries({
        queryKey: documentLinksKeys.forDossier(variables.dossierId),
      })
      toast.success(t('document.linkSuccess'))
    },
    onError: (error: DossierAPIError) => {
      toast.error(t('document.linkError', { message: error.message }))
    },
  })
}

/**
 * Hook to unlink a document from a dossier
 *
 * @description
 * Removes the relationship between a document and a dossier.
 * Automatically invalidates the document links query for the affected dossier.
 *
 * @returns TanStack Mutation result with mutate function
 *
 * @example
 * const { mutate } = useUnlinkDocument();
 *
 * // Unlink a document
 * mutate({
 *   dossierId: 'dossier-uuid',
 *   documentId: 'position-uuid',
 *   documentType: 'position',
 * });
 */
export function useUnlinkDocument() {
  const queryClient = useQueryClient()
  const { t } = useTranslation()

  return useMutation({
    mutationFn: ({
      dossierId,
      documentId,
      documentType,
    }: {
      dossierId: string
      documentId: string
      documentType: 'position' | 'mou' | 'brief'
    }) => unlinkDocumentFromDossier(dossierId, documentId, documentType),
    onSuccess: (_, variables) => {
      // Invalidate document links for this dossier
      queryClient.invalidateQueries({
        queryKey: documentLinksKeys.forDossier(variables.dossierId),
      })
      toast.success(t('document.unlinkSuccess'))
    },
    onError: (error: DossierAPIError) => {
      toast.error(t('document.unlinkError', { message: error.message }))
    },
  })
}

/**
 * Type-Safe Dossier Hooks
 * @feature 028-type-specific-dossier-pages
 *
 * @description
 * These hooks provide compile-time and runtime type safety for dossier operations.
 * They use discriminated unions and type guards to ensure type correctness when
 * working with specific dossier types (country, organization, person, etc.).
 */

import {
  type Dossier,
  type DossierType as TypeGuardDossierType,
  type CountryDossier,
  type OrganizationDossier,
  type PersonDossier,
  type EngagementDossier,
  type ForumDossier,
  type WorkingGroupDossier,
  getTypeGuard,
  validateDossierType,
} from '@/lib/dossier-type-guards'

/**
 * Hook to fetch a dossier with compile-time type safety
 *
 * @description
 * Fetches a dossier and validates it matches the expected type at runtime.
 * Returns a typed result that narrows to the specific dossier type.
 * Throws an error if the fetched dossier doesn't match the expected type.
 *
 * @template T - The expected dossier type ('country', 'organization', etc.)
 * @param id - The dossier UUID to fetch
 * @param expectedType - The expected dossier type for runtime validation
 * @param options - Additional TanStack Query options
 * @returns TanStack Query result with data typed to the specific dossier type
 *
 * @example
 * // Fetch a country dossier with type safety
 * const { data } = useTypedDossier('uuid-123', 'country');
 * // data is typed as CountryDossier
 * // data.extension.iso_code_2 is accessible with autocompletion
 *
 * @example
 * // Fetch an organization dossier
 * const { data } = useTypedDossier('uuid-456', 'organization');
 * // data is typed as OrganizationDossier
 * // data.extension.organization_type is accessible
 *
 * @throws Error if fetched dossier type doesn't match expectedType
 */
export function useTypedDossier<T extends TypeGuardDossierType>(
  id: string,
  expectedType: T,
  options?: Omit<
    UseQueryOptions<Extract<Dossier, { type: T }>, DossierAPIError>,
    'queryKey' | 'queryFn'
  >,
) {
  const typeGuard = getTypeGuard(expectedType)

  return useQuery({
    queryKey: [...dossierKeys.detail(id), { expectedType }],
    queryFn: async () => {
      const dossier = await getDossier(id)

      // Runtime type validation
      if (!validateDossierType(dossier as unknown as Dossier, expectedType)) {
        throw new Error(`Type mismatch: expected ${expectedType}, got ${(dossier as any).type}`)
      }

      // Type narrowing with type guard
      if (!typeGuard(dossier as unknown as Dossier)) {
        throw new Error(`Type guard failed for dossier ${id} with type ${expectedType}`)
      }

      return dossier as unknown as Extract<Dossier, { type: T }>
    },
    ...options,
  })
}

/**
 * Query Keys Factory for dossier count queries
 *
 * @description
 * Provides cache keys for dossier count aggregations.
 * Used by the Dossiers Hub to display count badges per type.
 */
export const dossierCountsKeys = {
  all: ['dossierCounts'] as const,
  byType: (type: TypeGuardDossierType) => [...dossierCountsKeys.all, type] as const,
}

/**
 * Hook to fetch dossier counts for all types with status breakdown
 *
 * @description
 * Fetches aggregated counts for all dossier types in a single efficient query.
 * Returns a record mapping each type to its count breakdown by status.
 * Used primarily by the Dossiers Hub page to display count badges.
 * Results are cached for 5 minutes to reduce server load.
 *
 * @param options - Additional TanStack Query options
 * @returns TanStack Query result with Record<DossierType, DossierTypeCount>
 *
 * @example
 * const { data: counts, isLoading } = useDossierCounts();
 *
 * // Access counts per type
 * counts?.country.total;     // Total countries
 * counts?.country.active;    // Active countries
 * counts?.organization.total; // Total organizations
 */
export function useDossierCounts(
  options?: Omit<
    UseQueryOptions<Record<TypeGuardDossierType, DossierTypeCount>, DossierAPIError>,
    'queryKey' | 'queryFn'
  >,
) {
  return useQuery({
    queryKey: dossierCountsKeys.all,
    queryFn: async () => {
      try {
        const counts = await getDossierCountsByType()
        return counts as Record<TypeGuardDossierType, DossierTypeCount>
      } catch (error) {
        console.warn('Failed to fetch dossier counts:', error)
        // Return empty counts on error
        const types: TypeGuardDossierType[] = [
          'country',
          'organization',
          'person',
          'engagement',
          'forum',
          'working_group',
        ]
        const emptyCounts: Record<TypeGuardDossierType, DossierTypeCount> = {} as any
        types.forEach((type) => {
          emptyCounts[type] = {
            type: type as DossierType,
            total: 0,
            active: 0,
            inactive: 0,
            archived: 0,
          }
        })
        return emptyCounts
      }
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    ...options,
  })
}

/**
 * Hook to fetch count for a specific dossier type
 *
 * @description
 * Fetches the total count for a single dossier type.
 * Uses an efficient minimal query (page_size=1) to get total count.
 * Results are cached for 5 minutes.
 *
 * @param type - The dossier type to get count for
 * @param options - Additional TanStack Query options
 * @returns TanStack Query result with count number
 *
 * @example
 * const { data: countryCount } = useDossierCountByType('country');
 * console.log(`Total countries: ${countryCount}`);
 */
export function useDossierCountByType(
  type: TypeGuardDossierType,
  options?: Omit<UseQueryOptions<number, DossierAPIError>, 'queryKey' | 'queryFn'>,
) {
  return useQuery({
    queryKey: dossierCountsKeys.byType(type),
    queryFn: async () => {
      try {
        const response = await getDossiersByType(type, 1, 1)
        return response.total || 0
      } catch (error) {
        console.warn(`Failed to fetch count for ${type}:`, error)
        return 0
      }
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    ...options,
  })
}
