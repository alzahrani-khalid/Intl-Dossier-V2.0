// T065: useDeleteRelationship mutation hook
import { mutationHelpers } from '@/lib/mutation-factory';

export interface DeleteRelationshipInput {
  parentId: string;
  childId: string;
  relationshipType?: string;
}

/**
 * Hook for deleting dossier relationships
 * Uses mutation factory for standardized error handling and query invalidation
 */
export const useDeleteRelationship = mutationHelpers.delete<DeleteRelationshipInput>(
  'dossiers-relationships-delete',
  (input) => ({
    parentId: input.parentId,
    childId: input.childId,
    ...(input.relationshipType && { relationshipType: input.relationshipType }),
  }),
  (variables) => [
    ['relationships', variables.parentId],
    ['relationships', variables.childId],
  ]
);
