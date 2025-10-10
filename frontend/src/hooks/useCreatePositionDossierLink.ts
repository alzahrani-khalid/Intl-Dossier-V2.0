// T067: useCreatePositionDossierLink mutation hook
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface CreatePositionDossierLinkInput {
  dossier_id: string;
  link_type?: 'primary' | 'related' | 'reference';
  notes?: string;
}

export function useCreatePositionDossierLink(positionId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreatePositionDossierLinkInput) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(
        `${supabase.supabaseUrl}/functions/v1/positions-dossiers-create?positionId=${positionId}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(input),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create position-dossier link');
      }

      return await response.json();
    },
    onSuccess: () => {
      // Invalidate position-dossier links query to refetch
      queryClient.invalidateQueries({ queryKey: ['position-dossier-links', positionId] });
    },
  });
}
