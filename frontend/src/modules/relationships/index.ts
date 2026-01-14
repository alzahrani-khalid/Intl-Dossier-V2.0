/**
 * Relationships Module - Public API
 *
 * This is the public entry point for the Relationships module.
 * Only types and functions exported from here should be used by other modules.
 *
 * @module relationships
 */

// ============================================================================
// Module (Primary Export)
// ============================================================================

export { relationshipModule, default } from './module'

// ============================================================================
// Public Types (Re-exported from core contracts)
// ============================================================================

export type {
  RelationshipDTO,
  RelationshipCreateParams,
  RelationshipUpdateParams,
  RelationshipHealthDTO,
  NetworkGraphParams,
  NetworkGraphDTO,
} from '../core/contracts'

// ============================================================================
// Events (for subscription)
// ============================================================================

export { RELATIONSHIP_EVENTS } from '../core/contracts'
export type { RelationshipEventType } from '../core/contracts'

// ============================================================================
// Usage Examples
// ============================================================================

/**
 * @example
 * // Access the Relationships module from another module
 * import { getModule } from '@/modules/core'
 * import type { IRelationshipModule } from '@/modules/core/contracts'
 *
 * const relationshipsModule = getModule<IRelationshipModule>('relationships')
 *
 * // Get relationships for an entity
 * const result = await relationshipsModule.getRelationshipsForEntity(
 *   { moduleId: 'engagements', entityType: 'dossier', entityId: '123' },
 *   context
 * )
 *
 * if (result.success) {
 *   console.log('Relationships:', result.data)
 * }
 *
 * @example
 * // Subscribe to relationship events
 * import { getEventBus } from '@/modules/core'
 * import { RELATIONSHIP_EVENTS } from '@/modules/relationships'
 *
 * const eventBus = getEventBus()
 *
 * eventBus.subscribe(RELATIONSHIP_EVENTS.CREATED, (event) => {
 *   console.log('Relationship created:', event.payload)
 * })
 *
 * @example
 * // Get network graph for visualization
 * const graphResult = await relationshipsModule.getNetworkGraph(
 *   { centerEntityId: '123', depth: 2, maxNodes: 50 },
 *   context
 * )
 *
 * if (graphResult.success) {
 *   const { nodes, edges } = graphResult.data
 *   // Use with React Flow or similar library
 * }
 */
