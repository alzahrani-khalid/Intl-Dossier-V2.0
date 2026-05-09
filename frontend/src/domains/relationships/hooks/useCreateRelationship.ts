/**
 * useCreateRelationship Hook (T064)
 * @module domains/relationships/hooks/useCreateRelationship
 *
 * TanStack Query mutation hook for creating dossier relationships
 * via the Edge Function endpoint. Routes through the relationships repository.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query'
import * as RelationshipsRepo from '../repositories/relationships.repository'

// ============================================================================
// Types
// ============================================================================

export interface CreateRelationshipInput {
  child_dossier_id: string
  relationship_type:
    | 'member_of'
    | 'participates_in'
    | 'collaborates_with'
    | 'monitors'
    | 'is_member'
    | 'hosts'
  relationship_strength?: 'primary' | 'secondary' | 'observer'
  established_date?: string
  end_date?: string | null
  notes?: string | null
}

// ============================================================================
// Hook Implementation
// ============================================================================

export function useCreateRelationship(parentDossierId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateRelationshipInput) =>
      RelationshipsRepo.createDossierRelationship(parentDossierId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['relationships', parentDossierId] })
    },
  })
}
