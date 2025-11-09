/**
 * Dossier Hooks
 * Part of: 026-unified-dossier-architecture implementation
 *
 * TanStack Query hooks for dossier operations with automatic caching,
 * invalidation, and optimistic updates.
 */

import { useMutation, useQuery, useQueryClient, type UseQueryOptions } from '@tanstack/react-query';
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
} from '@/services/dossier-api';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

/**
 * Query Keys Factory
 */
export const dossierKeys = {
  all: ['dossiers'] as const,
  lists: () => [...dossierKeys.all, 'list'] as const,
  list: (filters?: DossierFilters) => [...dossierKeys.lists(), { filters }] as const,
  details: () => [...dossierKeys.all, 'detail'] as const,
  detail: (id: string) => [...dossierKeys.details(), id] as const,
  byType: (type: DossierType, page?: number, page_size?: number) =>
    [...dossierKeys.all, 'type', type, { page, page_size }] as const,
};

/**
 * Hook to fetch a single dossier by ID
 */
export function useDossier(
  id: string,
  include?: string[],
  options?: Omit<UseQueryOptions<DossierWithExtension, DossierAPIError>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: [...dossierKeys.detail(id), { include }],
    queryFn: () => getDossier(id, include),
    ...options,
  });
}

/**
 * Hook to fetch list of dossiers with filters
 */
export function useDossiers(
  filters?: DossierFilters,
  options?: Omit<UseQueryOptions<DossiersListResponse, DossierAPIError>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: dossierKeys.list(filters),
    queryFn: () => listDossiers(filters),
    ...options,
  });
}

/**
 * Hook to fetch dossiers by type
 */
export function useDossiersByType(
  type: DossierType,
  page?: number,
  page_size?: number,
  options?: Omit<UseQueryOptions<DossiersListResponse, DossierAPIError>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: dossierKeys.byType(type, page, page_size),
    queryFn: () => getDossiersByType(type, page, page_size),
    ...options,
  });
}

/**
 * Hook to create a new dossier
 */
export function useCreateDossier() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (request: CreateDossierRequest) => createDossier(request),
    onSuccess: (data) => {
      // Invalidate all dossier lists to refetch with new data
      queryClient.invalidateQueries({ queryKey: dossierKeys.lists() });
      queryClient.invalidateQueries({ queryKey: dossierKeys.byType(data.type) });

      // Set the new dossier in the cache
      queryClient.setQueryData(dossierKeys.detail(data.id), data);

      toast.success(t('dossier.create.success', { name: data.name_en }));
    },
    onError: (error: DossierAPIError) => {
      toast.error(t('dossier.create.error', { message: error.message }));
    },
  });
}

/**
 * Hook to update a dossier
 */
export function useUpdateDossier() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: ({ id, request }: { id: string; request: UpdateDossierRequest }) =>
      updateDossier(id, request),
    onMutate: async ({ id, request }) => {
      // Cancel any outgoing refetches to avoid overwriting optimistic update
      await queryClient.cancelQueries({ queryKey: dossierKeys.detail(id) });

      // Snapshot the previous value
      const previousDossier = queryClient.getQueryData<DossierWithExtension>(
        dossierKeys.detail(id)
      );

      // Optimistically update the cache
      if (previousDossier) {
        queryClient.setQueryData<DossierWithExtension>(dossierKeys.detail(id), {
          ...previousDossier,
          ...request,
          updated_at: new Date().toISOString(),
        });
      }

      return { previousDossier };
    },
    onSuccess: (data, { id }) => {
      // Update the cache with server response
      queryClient.setQueryData(dossierKeys.detail(id), data);

      // Invalidate lists to refetch
      queryClient.invalidateQueries({ queryKey: dossierKeys.lists() });
      queryClient.invalidateQueries({ queryKey: dossierKeys.byType(data.type) });

      toast.success(t('dossier.update.success', { name: data.name_en }));
    },
    onError: (error: DossierAPIError, { id }, context) => {
      // Rollback optimistic update on error
      if (context?.previousDossier) {
        queryClient.setQueryData(dossierKeys.detail(id), context.previousDossier);
      }

      toast.error(t('dossier.update.error', { message: error.message }));
    },
  });
}

/**
 * Hook to delete a dossier
 */
export function useDeleteDossier() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (id: string) => deleteDossier(id),
    onMutate: async (id) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: dossierKeys.detail(id) });

      // Snapshot the previous value
      const previousDossier = queryClient.getQueryData<DossierWithExtension>(
        dossierKeys.detail(id)
      );

      // Optimistically remove from cache
      queryClient.removeQueries({ queryKey: dossierKeys.detail(id) });

      return { previousDossier };
    },
    onSuccess: (_, id) => {
      // Invalidate all lists to refetch without deleted item
      queryClient.invalidateQueries({ queryKey: dossierKeys.lists() });
      queryClient.invalidateQueries({ queryKey: dossierKeys.all });

      toast.success(t('dossier.delete.success'));
    },
    onError: (error: DossierAPIError, id, context) => {
      // Restore the previous value on error
      if (context?.previousDossier) {
        queryClient.setQueryData(dossierKeys.detail(id), context.previousDossier);
      }

      toast.error(t('dossier.delete.error', { message: error.message }));
    },
  });
}

/**
 * Hook to prefetch a dossier (useful for hover effects, navigation hints)
 */
export function usePrefetchDossier() {
  const queryClient = useQueryClient();

  return (id: string) => {
    queryClient.prefetchQuery({
      queryKey: dossierKeys.detail(id),
      queryFn: () => getDossier(id),
    });
  };
}

/**
 * Hook to invalidate dossier queries (useful after bulk operations)
 */
export function useInvalidateDossiers() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ queryKey: dossierKeys.all });
  };
}

/**
 * Document Links Query Keys
 */
export const documentLinksKeys = {
  all: ['documentLinks'] as const,
  forDossier: (dossierId: string) => [...documentLinksKeys.all, 'dossier', dossierId] as const,
};

/**
 * Hook to fetch linked documents for a dossier
 */
export function useDocumentLinks(
  dossierId: string,
  options?: Omit<UseQueryOptions<LinkedDocument[], DossierAPIError>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: documentLinksKeys.forDossier(dossierId),
    queryFn: () => getDocumentsForDossier(dossierId),
    ...options,
  });
}

/**
 * Hook to link a document to a dossier
 */
export function useLinkDocument() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: ({
      dossierId,
      documentId,
      documentType,
    }: {
      dossierId: string;
      documentId: string;
      documentType: 'position' | 'mou' | 'brief';
    }) => linkDocumentToDossier(dossierId, documentId, documentType),
    onSuccess: (_, variables) => {
      // Invalidate document links for this dossier
      queryClient.invalidateQueries({
        queryKey: documentLinksKeys.forDossier(variables.dossierId),
      });
      toast.success(t('document.linkSuccess'));
    },
    onError: (error: DossierAPIError) => {
      toast.error(t('document.linkError', { message: error.message }));
    },
  });
}

/**
 * Hook to unlink a document from a dossier
 */
export function useUnlinkDocument() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: ({
      dossierId,
      documentId,
      documentType,
    }: {
      dossierId: string;
      documentId: string;
      documentType: 'position' | 'mou' | 'brief';
    }) => unlinkDocumentFromDossier(dossierId, documentId, documentType),
    onSuccess: (_, variables) => {
      // Invalidate document links for this dossier
      queryClient.invalidateQueries({
        queryKey: documentLinksKeys.forDossier(variables.dossierId),
      });
      toast.success(t('document.unlinkSuccess'));
    },
    onError: (error: DossierAPIError) => {
      toast.error(t('document.unlinkError', { message: error.message }));
    },
  });
}

/**
 * Type-Safe Dossier Hooks (Feature: 028-type-specific-dossier-pages)
 * Uses type guards for compile-time and runtime type narrowing
 */

import type {
  Dossier,
  DossierType as TypeGuardDossierType,
  CountryDossier,
  OrganizationDossier,
  PersonDossier,
  EngagementDossier,
  ForumDossier,
  WorkingGroupDossier,
  getTypeGuard,
  validateDossierType,
} from '@/lib/dossier-type-guards';

/**
 * Hook to fetch a single dossier with type validation
 * Throws error if fetched dossier doesn't match expected type
 */
export function useTypedDossier<T extends TypeGuardDossierType>(
  id: string,
  expectedType: T,
  options?: Omit<UseQueryOptions<Extract<Dossier, { type: T }>, DossierAPIError>, 'queryKey' | 'queryFn'>
) {
  const typeGuard = getTypeGuard(expectedType);

  return useQuery({
    queryKey: [...dossierKeys.detail(id), { expectedType }],
    queryFn: async () => {
      const dossier = await getDossier(id);

      // Runtime type validation
      if (!validateDossierType(dossier as unknown as Dossier, expectedType)) {
        throw new Error(
          `Type mismatch: expected ${expectedType}, got ${(dossier as any).type}`
        );
      }

      // Type narrowing with type guard
      if (!typeGuard(dossier as unknown as Dossier)) {
        throw new Error(
          `Type guard failed for dossier ${id} with type ${expectedType}`
        );
      }

      return dossier as unknown as Extract<Dossier, { type: T }>;
    },
    ...options,
  });
}

/**
 * Dossier Counts Query Keys
 */
export const dossierCountsKeys = {
  all: ['dossierCounts'] as const,
  byType: (type: TypeGuardDossierType) => [...dossierCountsKeys.all, type] as const,
};

/**
 * Hook to fetch dossier counts for all types with status breakdown (for Dossiers Hub)
 * Single efficient query that aggregates counts by type and status
 */
export function useDossierCounts(
  options?: Omit<
    UseQueryOptions<Record<TypeGuardDossierType, DossierTypeCount>, DossierAPIError>,
    'queryKey' | 'queryFn'
  >
) {
  return useQuery({
    queryKey: dossierCountsKeys.all,
    queryFn: async () => {
      try {
        const counts = await getDossierCountsByType();
        return counts as Record<TypeGuardDossierType, DossierTypeCount>;
      } catch (error) {
        console.warn('Failed to fetch dossier counts:', error);
        // Return empty counts on error
        const types: TypeGuardDossierType[] = [
          'country',
          'organization',
          'person',
          'engagement',
          'forum',
          'working_group',
        ];
        const emptyCounts: Record<TypeGuardDossierType, DossierTypeCount> = {} as any;
        types.forEach((type) => {
          emptyCounts[type] = {
            type: type as DossierType,
            total: 0,
            active: 0,
            inactive: 0,
            archived: 0,
          };
        });
        return emptyCounts;
      }
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    ...options,
  });
}

/**
 * Hook to fetch count for a specific dossier type
 */
export function useDossierCountByType(
  type: TypeGuardDossierType,
  options?: Omit<UseQueryOptions<number, DossierAPIError>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: dossierCountsKeys.byType(type),
    queryFn: async () => {
      try {
        const response = await getDossiersByType(type, 1, 1);
        return response.total || 0;
      } catch (error) {
        console.warn(`Failed to fetch count for ${type}:`, error);
        return 0;
      }
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    ...options,
  });
}
