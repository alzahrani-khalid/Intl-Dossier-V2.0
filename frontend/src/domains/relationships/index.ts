/**
 * Relationships Domain Barrel
 * @module domains/relationships
 *
 * Re-exports all hooks, repository, and types for the relationships domain.
 * Canonical import path for consumers: `@/domains/relationships`
 */

// Hooks — Relationships
export {
  relationshipKeys,
  useRelationship,
  useRelationships,
  useRelationshipsForDossier,
  useRelationshipsByType,
  useCreateRelationship as useCreateRelationshipMutation,
  useUpdateRelationship,
  useDeleteRelationship,
  usePrefetchRelationshipsForDossier,
  useInvalidateRelationships,
  graphKeys,
  useGraphData,
  usePrefetchGraphData,
  type GraphNode,
  type GraphEdge,
  type GraphData,
} from './hooks/useRelationships'

// Hooks — Create Relationship (T064 Edge Function)
export {
  useCreateRelationship,
  type CreateRelationshipInput,
} from './hooks/useCreateRelationship'

// Repository
export * as relationshipsRepo from './repositories/relationships.repository'

// Types
export * from './types'
