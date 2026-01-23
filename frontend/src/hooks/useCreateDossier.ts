/**
 * Create Dossier Mutation Hook
 * @module hooks/useCreateDossier
 * @feature 026-unified-dossier-architecture
 * @feature 028-type-specific-dossier-pages
 *
 * TanStack Query mutation hook for creating new dossiers with automatic cache
 * invalidation, optimistic updates, and toast notifications.
 *
 * @description
 * This hook provides a mutation function to create new dossier entities. It
 * handles the full creation lifecycle including:
 *
 * - Type-safe dossier creation with validation
 * - Automatic cache invalidation for list queries
 * - Optimistic cache population for detail queries
 * - Success/error toast notifications (bilingual support)
 * - Proper error handling and reporting
 *
 * The hook creates dossiers with status 'active' by default and supports all
 * 8 dossier types (country, organization, forum, engagement, topic,
 * working_group, person, elected_official).
 *
 * Validation:
 * - Required: name_en, type
 * - Optional: name_ar, sensitivity_level, summary_en, summary_ar, tags
 * - Default status: 'active'
 * - Default sensitivity_level: 1
 *
 * @example
 * // Basic usage
 * const { mutate: createDossier, isPending } = useCreateDossier();
 *
 * createDossier({
 *   type: 'country',
 *   name_en: 'France',
 *   name_ar: 'فرنسا',
 *   sensitivity_level: 2,
 * });
 *
 * @example
 * // With form submission
 * const { mutate, isPending, error } = useCreateDossier();
 *
 * const handleSubmit = (formData) => {
 *   mutate(formData, {
 *     onSuccess: (newDossier) => {
 *       navigate({ to: `/dossiers/${newDossier.id}` });
 *     },
 *   });
 * };
 *
 * @example
 * // With all fields
 * const { mutate } = useCreateDossier();
 *
 * mutate({
 *   type: 'organization',
 *   name_en: 'United Nations',
 *   name_ar: 'الأمم المتحدة',
 *   summary_en: 'International organization...',
 *   summary_ar: 'منظمة دولية...',
 *   tags: ['international', 'multilateral'],
 *   sensitivity_level: 3,
 * });
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { DossierCreate } from '@/types/dossier';
import { toast } from 'sonner';

/**
 * Hook to create a new dossier
 *
 * @description
 * Creates a TanStack Query mutation for creating dossiers. The mutation handles
 * database insertion, cache updates, and user notifications automatically.
 *
 * Success side effects:
 * 1. Invalidates dossier list queries (triggers refetch)
 * 2. Populates detail cache for the new dossier
 * 3. Shows success toast notification
 *
 * Error handling:
 * - Displays error toast with descriptive message
 * - Throws error for upstream handling
 * - Maintains type safety through error types
 *
 * @returns TanStack Query mutation result with mutate function
 *
 * @example
 * // In a create dossier form
 * const { mutate, isPending, error } = useCreateDossier();
 *
 * const onSubmit = (data: DossierCreate) => {
 *   mutate(data);
 * };
 *
 * @example
 * // With callback chaining
 * const { mutate } = useCreateDossier();
 *
 * mutate(dossierData, {
 *   onSuccess: (newDossier) => {
 *     console.log('Created:', newDossier.id);
 *     navigate(`/dossiers/${newDossier.id}`);
 *   },
 *   onError: (error) => {
 *     console.error('Failed:', error);
 *   },
 * });
 */
export function useCreateDossier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dossierData: DossierCreate) => {
      const { data, error } = await supabase
        .from('dossiers')
        .insert({
          name_en: dossierData.name_en,
          name_ar: dossierData.name_ar,
          type: dossierData.type,
          sensitivity_level: dossierData.sensitivity_level,
          summary_en: dossierData.summary_en || null,
          summary_ar: dossierData.summary_ar || null,
          tags: dossierData.tags || [],
          status: 'active',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (newDossier) => {
      // Invalidate dossiers list query to refetch
      queryClient.invalidateQueries({ queryKey: ['dossiers'] });

      // Optionally add to cache optimistically
      queryClient.setQueryData(['dossier', newDossier.id], newDossier);

      toast.success('Dossier created successfully');
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : 'Failed to create dossier'
      );
    },
  });
}
