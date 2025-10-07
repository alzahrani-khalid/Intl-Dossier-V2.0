/**
 * usePublishAfterAction Hook
 *
 * Mutation hook for publishing after-action records
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

interface PublishParams {
  afterActionId: string;
  isConfidential: boolean;
}

export function usePublishAfterAction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ afterActionId, isConfidential }: PublishParams) => {
      const { data, error } = await supabase.functions.invoke(
        'after-actions-publish',
        {
          body: { after_action_id: afterActionId, is_confidential: isConfidential },
        }
      );

      if (error) throw error;
      return data;
    },
    onSuccess: (_, { afterActionId }) => {
      queryClient.invalidateQueries({ queryKey: ['after-action', afterActionId] });
      queryClient.invalidateQueries({ queryKey: ['after-actions'] });
    },
  });
}
