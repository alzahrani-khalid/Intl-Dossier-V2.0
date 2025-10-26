/**
 * Person Dossier Hooks
 * Part of: Enhanced Unified Dossier Architecture
 *
 * Specialized hooks for person dossiers (type='person') with contact-specific features.
 * Uses the unified dossiers table with metadata JSONB for person-specific fields.
 */

import { useMutation, useQuery, useQueryClient, type UseQueryOptions } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import {
  createDossier,
  getDossier,
  updateDossier,
  getDossiersByType,
  type CreateDossierRequest,
  type UpdateDossierRequest,
  type DossierWithExtension,
  type DossiersListResponse,
  DossierAPIError,
} from '@/services/dossier-api';
import { dossierKeys } from './useDossier';

/**
 * Person-specific metadata structure
 * Stored in dossiers.metadata JSONB column
 */
export interface PersonMetadata {
  title_en?: string;
  title_ar?: string;
  organization_id?: string;
  organization_name_en?: string;
  organization_name_ar?: string;
  email?: string[];
  phone?: string[];
  notes?: string;
  source_type?: 'manual' | 'business_card' | 'document';
  [key: string]: unknown;
}

/**
 * Person dossier type helper
 */
export interface PersonDossier extends DossierWithExtension {
  type: 'person';
  metadata: PersonMetadata;
}

/**
 * Person search parameters
 */
export interface PersonSearchParams {
  search?: string;
  organization_id?: string;
  tags?: string[];
  source_type?: 'manual' | 'business_card' | 'document';
  limit?: number;
  offset?: number;
}

/**
 * Hook to fetch a single person dossier by ID
 */
export function usePersonDossier(
  id: string,
  options?: Omit<UseQueryOptions<PersonDossier, DossierAPIError>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: dossierKeys.detail(id),
    queryFn: async () => {
      const dossier = await getDossier(id);
      if (dossier.type !== 'person') {
        throw new Error('Dossier is not a person');
      }
      return dossier as PersonDossier;
    },
    enabled: !!id,
    ...options,
  });
}

/**
 * Hook to search person dossiers
 * Uses the unified dossiers table filtered by type='person'
 */
export function useSearchPersonDossiers(
  params?: PersonSearchParams,
  options?: Omit<UseQueryOptions<DossiersListResponse, DossierAPIError>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: [...dossierKeys.byType('person'), { params }],
    queryFn: () => getDossiersByType('person', 1, params?.limit || 50),
    ...options,
  });
}

/**
 * Hook to create a new person dossier
 */
export function useCreatePersonDossier() {
  const queryClient = useQueryClient();
  const { t } = useTranslation('contacts');

  return useMutation({
    mutationFn: async (data: {
      name_en: string;
      name_ar: string;
      description_en?: string;
      description_ar?: string;
      metadata: PersonMetadata;
      tags?: string[];
    }) => {
      const request: CreateDossierRequest = {
        type: 'person',
        name_en: data.name_en,
        name_ar: data.name_ar,
        description_en: data.description_en,
        description_ar: data.description_ar,
        status: 'active',
        sensitivity_level: 0,
        tags: data.tags || [],
        metadata: data.metadata as Record<string, unknown>,
      };
      return createDossier(request);
    },
    onSuccess: (data) => {
      // Invalidate all person dossier lists
      queryClient.invalidateQueries({ queryKey: dossierKeys.byType('person') });
      queryClient.invalidateQueries({ queryKey: dossierKeys.lists() });

      // Set newly created person in cache
      queryClient.setQueryData(dossierKeys.detail(data.id), data);

      toast.success(t('hooks.contact_created_success', { name: data.name_en }));
    },
    onError: (error: DossierAPIError) => {
      toast.error(t('hooks.contact_created_error', { error: error.message }));
    },
  });
}

/**
 * Hook to update a person dossier
 */
export function useUpdatePersonDossier() {
  const queryClient = useQueryClient();
  const { t } = useTranslation('contacts');

  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: {
        name_en?: string;
        name_ar?: string;
        description_en?: string;
        description_ar?: string;
        metadata?: Partial<PersonMetadata>;
        tags?: string[];
        status?: 'active' | 'inactive' | 'archived';
      };
    }) => {
      const request: UpdateDossierRequest = {
        ...updates,
        metadata: updates.metadata as Record<string, unknown> | undefined,
      };
      return updateDossier(id, request);
    },
    onMutate: async ({ id, updates }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: dossierKeys.detail(id) });

      // Snapshot previous value
      const previousDossier = queryClient.getQueryData<PersonDossier>(dossierKeys.detail(id));

      // Optimistic update
      if (previousDossier) {
        queryClient.setQueryData<PersonDossier>(dossierKeys.detail(id), {
          ...previousDossier,
          ...updates,
          metadata: {
            ...previousDossier.metadata,
            ...updates.metadata,
          },
          updated_at: new Date().toISOString(),
        });
      }

      return { previousDossier };
    },
    onSuccess: (data, variables) => {
      // Replace optimistic update with actual data
      queryClient.setQueryData(dossierKeys.detail(variables.id), data);

      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: dossierKeys.byType('person') });
      queryClient.invalidateQueries({ queryKey: dossierKeys.lists() });

      toast.success(t('hooks.contact_updated_success', { name: data.name_en }));
    },
    onError: (error: DossierAPIError, variables, context) => {
      // Rollback on error
      if (context?.previousDossier) {
        queryClient.setQueryData(dossierKeys.detail(variables.id), context.previousDossier);
      }
      toast.error(t('hooks.contact_updated_error', { error: error.message }));
    },
  });
}

/**
 * Hook to archive a person dossier (soft delete)
 */
export function useArchivePersonDossier() {
  const queryClient = useQueryClient();
  const { t } = useTranslation('contacts');

  return useMutation({
    mutationFn: async (id: string) => {
      return updateDossier(id, { status: 'archived' });
    },
    onSuccess: (_, id) => {
      // Remove from detail cache
      queryClient.removeQueries({ queryKey: dossierKeys.detail(id) });

      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: dossierKeys.byType('person') });
      queryClient.invalidateQueries({ queryKey: dossierKeys.lists() });

      toast.success(t('hooks.contact_archived_success'));
    },
    onError: (error: DossierAPIError) => {
      toast.error(t('hooks.contact_archived_error', { error: error.message }));
    },
  });
}

/**
 * Hook to invalidate all person dossier queries
 */
export function useInvalidatePersonDossiers() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ queryKey: dossierKeys.byType('person') });
    queryClient.invalidateQueries({ queryKey: dossierKeys.lists() });
  };
}
