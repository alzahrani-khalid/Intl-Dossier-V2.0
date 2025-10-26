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
  type CreateDossierRequest,
  type UpdateDossierRequest,
  type DossierFilters,
  type DossierWithExtension,
  type DossiersListResponse,
  type DossierType,
  type LinkedDocument,
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
  options?: Omit<UseQueryOptions<DossierWithExtension, DossierAPIError>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: dossierKeys.detail(id),
    queryFn: () => getDossier(id),
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
