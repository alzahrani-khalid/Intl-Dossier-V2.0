/**
 * Relationships Repository
 * @module domains/relationships/repositories/relationships.repository
 *
 * Re-exports relationship API functions from the existing service layer.
 * The relationship-api service already follows the repository pattern
 * with proper auth handling, so we delegate to it directly.
 */

export {
  createRelationship,
  getRelationship,
  updateRelationship,
  deleteRelationship,
  listRelationships,
  getRelationshipsForDossier,
  getRelationshipsByType,
} from '@/services/relationship-api'

export type {
  CreateRelationshipRequest,
  UpdateRelationshipRequest,
  RelationshipFilters,
  RelationshipWithDossiers,
  RelationshipsListResponse,
  RelationshipType,
} from '@/services/relationship-api'

import { apiPost } from '@/lib/api-client'

// ============================================================================
// T064: Create Relationship (Edge Function)
// ============================================================================

export async function createDossierRelationship(
  parentDossierId: string,
  input: {
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
  },
): Promise<unknown> {
  return apiPost(`/dossiers-relationships-create?dossierId=${parentDossierId}`, input)
}
