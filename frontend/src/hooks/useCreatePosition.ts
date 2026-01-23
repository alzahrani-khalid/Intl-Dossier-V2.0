/**
 * Position Creation Hook
 *
 * Mutation hook for creating positions using the mutation factory pattern.
 * Handles authentication, request execution, and automatic query invalidation.
 *
 * @module hooks/useCreatePosition
 */

import { mutationHelpers } from '@/lib/mutation-factory';
import type { CreatePositionPayload, Position } from '@/types/position';

/**
 * Create position mutation hook
 *
 * Invalidates 'positions' list query on success to trigger refetch
 */
export const useCreatePosition = mutationHelpers.create<
  CreatePositionPayload,
  Position
>('positions-create', [['positions', 'list']]);
