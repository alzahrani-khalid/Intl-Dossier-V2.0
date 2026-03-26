/**
 * Relationships Domain Types
 * @module domains/relationships/types
 *
 * Re-exports types used across the relationships domain hooks and repository.
 */

export type {
  CreateRelationshipRequest,
  UpdateRelationshipRequest,
  RelationshipFilters,
  RelationshipWithDossiers,
  RelationshipsListResponse,
  RelationshipType,
} from '@/services/relationship-api'

export { RelationshipAPIError } from '@/services/relationship-api'

// Graph types
export type {
  GraphNode,
  GraphEdge,
  GraphData,
} from '../hooks/useRelationships'

// Create relationship types (T064)
export type { CreateRelationshipInput } from '../hooks/useCreateRelationship'
