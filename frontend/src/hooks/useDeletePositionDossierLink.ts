// T068: useDeletePositionDossierLink mutation hook
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface DeletePositionDossierLinkInput {
  positionId: string;
  dossierId: string;
}

export function useDeletePositionDossierLink() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: DeletePositionDossierLinkInput) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      const params = new URLSearchParams({
        positionId: input.positionId,
        dossierId: input.dossierId,
      });

      const response = await fetch(
        `${supabase.supabaseUrl}/functions/v1/positions-dossiers-delete?${params.toString()}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete position-dossier link');
      }

      return await response.json();
    },
    onSuccess: (_, variables) => {
      // Invalidate position-dossier links query to refetch
      queryClient.invalidateQueries({ queryKey: ['position-dossier-links', variables.positionId] });
    },
  });
}
