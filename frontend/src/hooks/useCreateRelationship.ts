// T064: useCreateRelationship mutation hook
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface CreateRelationshipInput {
  child_dossier_id: string;
  relationship_type: 'member_of' | 'participates_in' | 'collaborates_with' | 'monitors' | 'is_member' | 'hosts';
  relationship_strength?: 'primary' | 'secondary' | 'observer';
  established_date?: string;
  end_date?: string | null;
  notes?: string | null;
}

export function useCreateRelationship(parentDossierId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateRelationshipInput) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(
        `${supabase.supabaseUrl}/functions/v1/dossiers-relationships-create?dossierId=${parentDossierId}`,
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
        throw new Error(error.error || 'Failed to create relationship');
      }

      return await response.json();
    },
    onSuccess: () => {
      // Invalidate relationships query to refetch
      queryClient.invalidateQueries({ queryKey: ['relationships', parentDossierId] });
    },
  });
}
