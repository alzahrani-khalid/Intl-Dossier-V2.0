/**
 * Publish After-Action Hook
 * @module hooks/usePublishAfterAction
 * @feature 022-after-action-structured
 *
 * TanStack Query mutation hook for publishing after-action records with:
 * - Confidentiality flag setting
 * - Automatic cache invalidation
 * - Error handling
 *
 * @description
 * Mutation hook for publishing after-action records. Publishing makes the record
 * visible to stakeholders and creates associated commitments as work items.
 *
 * @example
 * // Publish record
 * const { mutate, isPending } = usePublishAfterAction();
 * mutate({
 *   afterActionId: id,
 *   isConfidential: false
 * });
 *
 * @example
 * // Publish confidential record
 * mutate({
 *   afterActionId: id,
 *   isConfidential: true
 * });
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

/**
 * Parameters for publishing an after-action record
 */
interface PublishParams {
  /** UUID of the after-action record to publish */
  afterActionId: string;
  /** Whether the record should be marked as confidential */
  isConfidential: boolean;
}

/**
 * Hook to publish an after-action record
 *
 * @description
 * Publishes a draft after-action record, making it visible and creating
 * associated work items from commitments. Automatically invalidates caches.
 *
 * @returns TanStack Mutation result
 */
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
