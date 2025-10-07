/**
 * useCreateDossier Hook
 *
 * Mutation hook for creating new dossiers with optimistic updates
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { DossierCreate } from '@/types/dossier';
import { toast } from 'sonner';

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
