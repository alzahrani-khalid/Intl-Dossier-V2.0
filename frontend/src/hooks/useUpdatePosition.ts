/**
 * TanStack Query mutation for updating a position
 *
 * Uses the mutation factory pattern for standardized auth, fetch, and error handling.
 * Version conflict (409) errors are handled by the factory's error handling.
 *
 * Note: Consumers can add optimistic updates via onMutate/onError options if needed.
 */

import { createMutation } from '@/lib/mutation-factory';
import type { Position, UpdatePositionPayload } from '@/types/position';

export interface UpdatePositionInput {
  id: string;
  data: UpdatePositionPayload;
}

/**
 * Hook to update a position
 *
 * @example
 * const updatePosition = useUpdatePosition();
 * updatePosition.mutate({
 *   id: 'position-id',
 *   data: { title_en: 'Updated Title', version: 2 }
 * });
 */
export const useUpdatePosition = createMutation<UpdatePositionInput, Position>({
  method: 'PUT',
  url: {
    endpoint: 'positions-update',
    queryParams: (input) => ({ id: input.id }),
  },
  invalidation: {
    queryKeys: (variables) => [
      ['positions', 'detail', variables.id],
      ['positions', 'list'],
    ],
  },
  transformBody: ({ data }) => data,
});
