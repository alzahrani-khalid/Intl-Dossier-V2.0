import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

interface StageTransitionParams {
  assignmentId: string;
  newStage: string;
  userId: string;
}

export function useStageTransition() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ assignmentId, newStage, userId }: StageTransitionParams) => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('No active session');
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/assignments-workflow-stage-update/${assignmentId}`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            workflow_stage: newStage,
            triggered_by_user_id: userId,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.validation_error || data.error || 'Failed to update stage');
      }

      return data;
    },
    onSuccess: (_, variables) => {
      // Invalidate Kanban queries to refresh the board
      queryClient.invalidateQueries({ queryKey: ['engagement-kanban'] });
    },
  });
}
