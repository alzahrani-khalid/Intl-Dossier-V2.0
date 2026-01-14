/**
 * Domains Module - Main Entry Point
 *
 * This is the main entry point for all bounded contexts.
 * Import from specific contexts for better tree-shaking:
 *
 * ```typescript
 * // Preferred: Import from specific context
 * import { useEngagements, EngagementDossier } from '@/domains/engagement'
 * import { useDocuments, Document } from '@/domains/document'
 * import { useRelationships, RelationshipWithDossiers } from '@/domains/relationship'
 * import { DossierReference, DomainError } from '@/domains/shared'
 *
 * // Also available: Import from main module (larger bundle)
 * import { useEngagements, useDocuments, useRelationships } from '@/domains'
 * ```
 */

// ============================================================================
// Shared Kernel (always needed)
// ============================================================================
export * from './shared'

// ============================================================================
// Context Map
// ============================================================================
export {
  CONTEXTS,
  type ContextName,
  type ContextRelation,
  CONTEXT_MAP,
  CONTEXT_BOUNDARIES,
  INTEGRATION_POINTS,
  getUpstreamContexts,
  getDownstreamContexts,
  getIntegrationPattern,
  getSharedContracts,
} from './context-map'

// ============================================================================
// Bounded Contexts
// ============================================================================

// Engagement Context
export * from './engagement'

// Document Context
export * from './document'

// Relationship Context
export * from './relationship'
