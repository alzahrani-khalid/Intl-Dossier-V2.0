/**
 * Context Map - Bounded Context Relationships
 *
 * This file defines the explicit relationships between bounded contexts.
 * It serves as documentation and a contract for how contexts interact.
 *
 * Context Relationships:
 * - U (Upstream): The context that provides data/services
 * - D (Downstream): The context that consumes data/services
 *
 * Integration Patterns:
 * - Published Language: Upstream publishes a common language for downstream
 * - Conformist: Downstream conforms to upstream's model
 * - Anti-Corruption Layer: Downstream transforms upstream's model
 * - Shared Kernel: Both contexts share common types
 */

// ============================================================================
// Context Definitions
// ============================================================================

export const CONTEXTS = {
  ENGAGEMENT: 'engagement',
  DOCUMENT: 'document',
  RELATIONSHIP: 'relationship',
  SHARED: 'shared',
} as const

export type ContextName = (typeof CONTEXTS)[keyof typeof CONTEXTS]

// ============================================================================
// Context Map Definition
// ============================================================================

/**
 * Defines the relationship between two contexts
 */
export interface ContextRelation {
  upstream: ContextName
  downstream: ContextName
  pattern: 'published_language' | 'conformist' | 'anti_corruption_layer' | 'shared_kernel'
  description: string
  contracts: string[]
}

/**
 * The complete context map defining all relationships
 */
export const CONTEXT_MAP: ContextRelation[] = [
  // Engagement → Document
  {
    upstream: CONTEXTS.ENGAGEMENT,
    downstream: CONTEXTS.DOCUMENT,
    pattern: 'published_language',
    description:
      'Documents can be linked to engagements. Engagement context publishes engagement reference types for document linking.',
    contracts: ['DossierReference', 'EntityLink'],
  },

  // Engagement → Relationship
  {
    upstream: CONTEXTS.ENGAGEMENT,
    downstream: CONTEXTS.RELATIONSHIP,
    pattern: 'published_language',
    description:
      'Relationships between engagement dossiers use engagement references. Engagement context publishes its dossier types.',
    contracts: ['DossierReference', 'EngagementDossier'],
  },

  // Relationship → Engagement
  {
    upstream: CONTEXTS.RELATIONSHIP,
    downstream: CONTEXTS.ENGAGEMENT,
    pattern: 'conformist',
    description:
      'Engagement context uses relationship health scores for display. Engagement conforms to relationship health model.',
    contracts: ['RelationshipHealthSummary', 'HealthLevel'],
  },

  // Document → Engagement
  {
    upstream: CONTEXTS.DOCUMENT,
    downstream: CONTEXTS.ENGAGEMENT,
    pattern: 'anti_corruption_layer',
    description:
      'Engagement context displays document information but transforms it to its own view model.',
    contracts: ['DocumentListItem'],
  },

  // Shared Kernel relationships
  {
    upstream: CONTEXTS.SHARED,
    downstream: CONTEXTS.ENGAGEMENT,
    pattern: 'shared_kernel',
    description:
      'Engagement context uses shared types for dossier references, pagination, and errors.',
    contracts: ['DossierReference', 'PaginatedResponse', 'DomainError', 'Result'],
  },
  {
    upstream: CONTEXTS.SHARED,
    downstream: CONTEXTS.DOCUMENT,
    pattern: 'shared_kernel',
    description:
      'Document context uses shared types for dossier references, pagination, and errors.',
    contracts: ['DossierReference', 'PaginatedResponse', 'DomainError', 'Result'],
  },
  {
    upstream: CONTEXTS.SHARED,
    downstream: CONTEXTS.RELATIONSHIP,
    pattern: 'shared_kernel',
    description:
      'Relationship context uses shared types for dossier references, pagination, and errors.',
    contracts: ['DossierReference', 'PaginatedResponse', 'DomainError', 'Result'],
  },
]

// ============================================================================
// Context Boundaries
// ============================================================================

/**
 * Defines what types are public (exported) from each context
 */
export const CONTEXT_BOUNDARIES = {
  [CONTEXTS.ENGAGEMENT]: {
    publicTypes: [
      'EngagementDossier',
      'EngagementListItem',
      'EngagementFullProfile',
      'EngagementType',
      'EngagementCategory',
      'EngagementStatus',
      'EngagementParticipant',
      'EngagementAgendaItem',
    ],
    publicHooks: [
      'useEngagements',
      'useEngagement',
      'useCreateEngagement',
      'useUpdateEngagement',
      'useArchiveEngagement',
      'useEngagementParticipants',
      'useEngagementAgenda',
    ],
    publicServices: ['engagementService'],
  },
  [CONTEXTS.DOCUMENT]: {
    publicTypes: [
      'Document',
      'DocumentListItem',
      'DocumentVersion',
      'DocumentCategory',
      'DocumentClassification',
      'DocumentStatus',
    ],
    publicHooks: [
      'useDocuments',
      'useDocument',
      'useUploadDocument',
      'useDocumentVersions',
      'useVersionComparison',
      'useLinkedDocuments',
    ],
    publicServices: ['documentService'],
  },
  [CONTEXTS.RELATIONSHIP]: {
    publicTypes: [
      'Relationship',
      'RelationshipWithDossiers',
      'RelationshipType',
      'RelationshipStatus',
      'RelationshipHealthScore',
      'RelationshipHealthSummary',
      'HealthLevel',
      'HealthTrend',
    ],
    publicHooks: [
      'useRelationships',
      'useRelationship',
      'useRelationshipsForDossier',
      'useCreateRelationship',
      'useRelationshipHealthScore',
      'useHealthScores',
    ],
    publicServices: ['relationshipService'],
  },
  [CONTEXTS.SHARED]: {
    publicTypes: [
      'DossierReference',
      'DossierType',
      'DossierStatus',
      'EntityLink',
      'PaginatedResponse',
      'Result',
      'DomainError',
      'AuditInfo',
    ],
    publicHooks: [],
    publicServices: [],
  },
} as const

// ============================================================================
// Integration Points
// ============================================================================

/**
 * Defines where contexts integrate and what data flows between them
 */
export const INTEGRATION_POINTS = {
  engagementToDocument: {
    trigger: 'Engagement created/updated',
    dataFlow: 'Engagement ID → Document linking',
    sharedTypes: ['DossierReference', 'EntityLink'],
  },
  engagementToRelationship: {
    trigger: 'Engagement involves multiple dossiers',
    dataFlow: 'Engagement participants → Relationship creation',
    sharedTypes: ['DossierReference'],
  },
  relationshipToEngagement: {
    trigger: 'Display relationship health on engagement detail',
    dataFlow: 'Relationship health score → Engagement UI',
    sharedTypes: ['RelationshipHealthSummary', 'HealthLevel'],
  },
  documentToEngagement: {
    trigger: 'Display linked documents on engagement detail',
    dataFlow: 'Document list → Engagement UI',
    sharedTypes: ['DocumentListItem'],
  },
} as const

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get all upstream contexts for a given context
 */
export function getUpstreamContexts(context: ContextName): ContextName[] {
  return CONTEXT_MAP.filter((r) => r.downstream === context).map((r) => r.upstream)
}

/**
 * Get all downstream contexts for a given context
 */
export function getDownstreamContexts(context: ContextName): ContextName[] {
  return CONTEXT_MAP.filter((r) => r.upstream === context).map((r) => r.downstream)
}

/**
 * Get integration pattern for a context pair
 */
export function getIntegrationPattern(
  upstream: ContextName,
  downstream: ContextName,
): string | null {
  const relation = CONTEXT_MAP.find((r) => r.upstream === upstream && r.downstream === downstream)
  return relation?.pattern || null
}

/**
 * Get contracts shared between two contexts
 */
export function getSharedContracts(upstream: ContextName, downstream: ContextName): string[] {
  const relation = CONTEXT_MAP.find((r) => r.upstream === upstream && r.downstream === downstream)
  return relation?.contracts || []
}
