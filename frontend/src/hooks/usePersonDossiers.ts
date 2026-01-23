/**
 * Person Dossier Hooks
 * @module hooks/usePersonDossiers
 * @feature 026-unified-dossier-architecture
 * @feature 027-contact-directory
 *
 * Specialized hooks for person dossiers with contact-specific features.
 *
 * @description
 * This module provides hooks for managing person-type dossiers stored in the unified
 * dossiers table. Person dossiers use the metadata JSONB column for person-specific fields:
 * - Query hooks for fetching and searching person dossiers
 * - Mutation hooks for create and update operations with person metadata
 * - Type-safe access to person-specific fields (title, organization, contact info)
 * - Support for multiple source types (manual, business_card, document)
 *
 * Person metadata structure:
 * - title_en/title_ar: Job title
 * - organization_id/organization_name_en/organization_name_ar: Affiliation
 * - email/phone: Contact information arrays
 * - source_type: Origin of the person record
 *
 * @example
 * // Fetch a person dossier
 * const { data } = usePersonDossier('person-uuid');
 * console.log(data?.metadata.title_en);
 * console.log(data?.metadata.email);
 *
 * @example
 * // Create a new person dossier
 * const { mutate } = useCreatePersonDossier();
 * mutate({
 *   name_en: 'John Smith',
 *   name_ar: 'جون سميث',
 *   metadata: {
 *     title_en: 'Minister',
 *     organization_id: 'org-uuid',
 *     email: ['john@example.com'],
 *     phone: ['+1234567890'],
 *   },
 * });
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
 * Person-specific metadata structure stored in dossiers.metadata JSONB column
 *
 * @property title_en - English job title
 * @property title_ar - Arabic job title
 * @property organization_id - UUID of affiliated organization
 * @property organization_name_en - English organization name
 * @property organization_name_ar - Arabic organization name
 * @property email - Array of email addresses
 * @property phone - Array of phone numbers
 * @property notes - Additional notes
 * @property source_type - Origin of the person record (manual, business_card, document)
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
 * Person dossier type with strict type checking
 *
 * @description
 * Extends DossierWithExtension with person-specific type constraint and metadata.
 */
export interface PersonDossier extends DossierWithExtension {
  type: 'person';
  metadata: PersonMetadata;
}

/**
 * Person dossier search parameters
 *
 * @property search - Text search across name fields
 * @property organization_id - Filter by affiliated organization
 * @property tags - Filter by tags array
 * @property source_type - Filter by source (manual, business_card, document)
 * @property limit - Pagination limit
 * @property offset - Pagination offset
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
 *
 * @description
 * Fetches a dossier and validates it's of type 'person'.
 * Returns type-safe PersonDossier with metadata access.
 *
 * @param id - UUID of the person dossier
 * @param options - Additional TanStack Query options (excluding queryKey and queryFn)
 * @returns TanStack Query result with PersonDossier
 * @throws Error if dossier is not of type 'person'
 *
 * @example
 * const { data } = usePersonDossier('person-uuid');
 * console.log(data?.metadata.title_en);
 * console.log(data?.metadata.email);
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
 *
 * @description
 * Searches the unified dossiers table filtered by type='person' with optional filters.
 *
 * @param params - Optional search and filter parameters
 * @param options - Additional TanStack Query options (excluding queryKey and queryFn)
 * @returns TanStack Query result with DossiersListResponse
 *
 * @example
 * // Search all person dossiers
 * const { data } = useSearchPersonDossiers();
 *
 * @example
 * // Search with filters
 * const { data } = useSearchPersonDossiers({
 *   search: 'Smith',
 *   organization_id: 'org-uuid',
 *   source_type: 'manual',
 *   limit: 20,
 * });
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
 *
 * @description
 * Creates a new person-type dossier with person-specific metadata.
 * On success, invalidates list queries, pre-populates detail cache, and shows toast.
 *
 * @returns TanStack Mutation result with mutate function accepting person data
 *
 * @example
 * const { mutate, isLoading } = useCreatePersonDossier();
 *
 * mutate({
 *   name_en: 'John Smith',
 *   name_ar: 'جون سميث',
 *   description_en: 'Minister of Foreign Affairs',
 *   metadata: {
 *     title_en: 'Minister',
 *     organization_id: 'org-uuid',
 *     email: ['john.smith@gov.example'],
 *     phone: ['+1234567890'],
 *     source_type: 'manual',
 *   },
 *   tags: ['minister', 'foreign-affairs'],
 * });
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
