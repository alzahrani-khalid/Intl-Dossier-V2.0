// T065: useDeleteRelationship mutation hook
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface DeleteRelationshipInput {
  parentId: string;
  childId: string;
  relationshipType?: string;
}

export function useDeleteRelationship() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: DeleteRelationshipInput) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      const params = new URLSearchParams({
        parentId: input.parentId,
        childId: input.childId,
      });

      if (input.relationshipType) {
        params.append('relationshipType', input.relationshipType);
      }

      const response = await fetch(
        `${supabase.supabaseUrl}/functions/v1/dossiers-relationships-delete?${params.toString()}`,
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
        throw new Error(error.error || 'Failed to delete relationship');
      }

      return await response.json();
    },
    onSuccess: (_, variables) => {
      // Invalidate relationships queries for both parent and child dossiers
      queryClient.invalidateQueries({ queryKey: ['relationships', variables.parentId] });
      queryClient.invalidateQueries({ queryKey: ['relationships', variables.childId] });
    },
  });
}
