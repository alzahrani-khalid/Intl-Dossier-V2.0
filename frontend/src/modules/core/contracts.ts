/**
 * Modular Monolith - Module Contracts
 *
 * This file defines the contract interfaces that all modules must implement.
 * These contracts ensure consistent behavior and enable loose coupling.
 *
 * @module core/contracts
 */

import type {
  ModuleId,
  ModuleStatus,
  ModuleResult,
  ModuleError,
  ModuleEvent,
  ModuleEventHandler,
  ModuleEventSubscription,
  ModuleRequestContext,
  ModulePagination,
  ModulePaginatedResponse,
} from './types'

// ============================================================================
// Module Definition Contract
// ============================================================================

/**
 * Base contract that all modules must implement
 * This defines the lifecycle and metadata for each module
 */
export interface IModule {
  /** Unique module identifier */
  readonly id: ModuleId

  /** Human-readable module name */
  readonly name: string

  /** Module version (semver format) */
  readonly version: string

  /** IDs of modules this module depends on */
  readonly dependencies: ModuleId[]

  /** Current module status */
  getStatus(): ModuleStatus

  /** Initialize the module */
  initialize(): Promise<void>

  /** Gracefully stop the module */
  stop(): Promise<void>

  /** Health check endpoint */
  healthCheck(): Promise<ModuleHealthStatus>
}

/**
 * Health status returned by module health check
 */
export interface ModuleHealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy'
  module: ModuleId
  timestamp: string
  details?: Record<string, unknown>
  dependencies?: {
    moduleId: ModuleId
    status: 'healthy' | 'degraded' | 'unhealthy'
  }[]
}

// ============================================================================
// Event Bus Contract
// ============================================================================

/**
 * Event bus contract for inter-module communication
 * All modules communicate through events for loose coupling
 */
export interface IModuleEventBus {
  /**
   * Publish an event to the bus
   */
  publish<TPayload>(event: ModuleEvent<TPayload>): Promise<void>

  /**
   * Subscribe to events of a specific type
   */
  subscribe<TPayload>(
    eventType: string,
    handler: ModuleEventHandler<TPayload>,
  ): ModuleEventSubscription

  /**
   * Subscribe to all events from a specific module
   */
  subscribeToModule(moduleId: ModuleId, handler: ModuleEventHandler): ModuleEventSubscription

  /**
   * Subscribe to all events (for logging/debugging)
   */
  subscribeAll(handler: ModuleEventHandler): ModuleEventSubscription
}

// ============================================================================
// Module Service Contracts
// ============================================================================

/**
 * Document module public API contract
 * Other modules interact with documents only through this interface
 */
export interface IDocumentModule extends IModule {
  /**
   * Get a document by ID
   */
  getDocument(
    id: string,
    context: ModuleRequestContext,
  ): Promise<ModuleResult<DocumentDTO, ModuleError>>

  /**
   * List documents with pagination
   */
  listDocuments(
    params: DocumentListParams,
    context: ModuleRequestContext,
  ): Promise<ModuleResult<ModulePaginatedResponse<DocumentDTO>, ModuleError>>

  /**
   * Get documents linked to an entity
   */
  getLinkedDocuments(
    entityRef: { moduleId: ModuleId; entityType: string; entityId: string },
    context: ModuleRequestContext,
  ): Promise<ModuleResult<DocumentDTO[], ModuleError>>

  /**
   * Link a document to an entity
   */
  linkDocument(
    documentId: string,
    entityRef: { moduleId: ModuleId; entityType: string; entityId: string },
    context: ModuleRequestContext,
  ): Promise<ModuleResult<void, ModuleError>>

  /**
   * Unlink a document from an entity
   */
  unlinkDocument(
    documentId: string,
    entityRef: { moduleId: ModuleId; entityType: string; entityId: string },
    context: ModuleRequestContext,
  ): Promise<ModuleResult<void, ModuleError>>

  /**
   * Upload a new document
   */
  uploadDocument(
    data: DocumentUploadParams,
    context: ModuleRequestContext,
  ): Promise<ModuleResult<DocumentDTO, ModuleError>>

  /**
   * Delete a document
   */
  deleteDocument(
    id: string,
    context: ModuleRequestContext,
  ): Promise<ModuleResult<void, ModuleError>>
}

/**
 * Relationship module public API contract
 */
export interface IRelationshipModule extends IModule {
  /**
   * Get a relationship by ID
   */
  getRelationship(
    id: string,
    context: ModuleRequestContext,
  ): Promise<ModuleResult<RelationshipDTO, ModuleError>>

  /**
   * List relationships for an entity
   */
  getRelationshipsForEntity(
    entityRef: { moduleId: ModuleId; entityType: string; entityId: string },
    context: ModuleRequestContext,
  ): Promise<ModuleResult<RelationshipDTO[], ModuleError>>

  /**
   * Create a new relationship
   */
  createRelationship(
    data: RelationshipCreateParams,
    context: ModuleRequestContext,
  ): Promise<ModuleResult<RelationshipDTO, ModuleError>>

  /**
   * Update a relationship
   */
  updateRelationship(
    id: string,
    data: RelationshipUpdateParams,
    context: ModuleRequestContext,
  ): Promise<ModuleResult<RelationshipDTO, ModuleError>>

  /**
   * Delete a relationship
   */
  deleteRelationship(
    id: string,
    context: ModuleRequestContext,
  ): Promise<ModuleResult<void, ModuleError>>

  /**
   * Get health score for a relationship
   */
  getHealthScore(
    id: string,
    context: ModuleRequestContext,
  ): Promise<ModuleResult<RelationshipHealthDTO, ModuleError>>

  /**
   * Get network graph data
   */
  getNetworkGraph(
    params: NetworkGraphParams,
    context: ModuleRequestContext,
  ): Promise<ModuleResult<NetworkGraphDTO, ModuleError>>
}

/**
 * AI module public API contract
 */
export interface IAIModule extends IModule {
  /**
   * Generate embeddings for text
   */
  generateEmbeddings(
    text: string,
    context: ModuleRequestContext,
  ): Promise<ModuleResult<number[], ModuleError>>

  /**
   * Perform semantic search
   */
  semanticSearch(
    params: SemanticSearchParams,
    context: ModuleRequestContext,
  ): Promise<ModuleResult<SemanticSearchResult[], ModuleError>>

  /**
   * Extract entities from text
   */
  extractEntities(
    text: string,
    context: ModuleRequestContext,
  ): Promise<ModuleResult<ExtractedEntity[], ModuleError>>

  /**
   * Generate a summary
   */
  generateSummary(
    text: string,
    options: SummaryOptions,
    context: ModuleRequestContext,
  ): Promise<ModuleResult<string, ModuleError>>

  /**
   * Generate a brief for an entity
   */
  generateBrief(
    entityRef: { moduleId: ModuleId; entityType: string; entityId: string },
    options: BriefOptions,
    context: ModuleRequestContext,
  ): Promise<ModuleResult<BriefDTO, ModuleError>>

  /**
   * Get AI recommendations
   */
  getRecommendations(
    params: RecommendationParams,
    context: ModuleRequestContext,
  ): Promise<ModuleResult<RecommendationDTO[], ModuleError>>
}

// ============================================================================
// Module DTOs (Data Transfer Objects)
// ============================================================================

/**
 * Document data transfer object
 * This is the public shape of a document exposed to other modules
 */
export interface DocumentDTO {
  id: string
  name: string
  nameAr?: string
  type: string
  mimeType: string
  size: number
  url: string
  classification: 'public' | 'internal' | 'confidential' | 'restricted'
  version: number
  createdAt: string
  updatedAt: string
  createdBy: string
  metadata?: Record<string, unknown>
}

export interface DocumentListParams {
  pagination: ModulePagination
  classification?: DocumentDTO['classification'][]
  type?: string[]
  search?: string
}

export interface DocumentUploadParams {
  name: string
  nameAr?: string
  type: string
  file: File | Blob
  classification: DocumentDTO['classification']
  metadata?: Record<string, unknown>
  linkedEntities?: { moduleId: ModuleId; entityType: string; entityId: string }[]
}

/**
 * Relationship data transfer object
 */
export interface RelationshipDTO {
  id: string
  type: string
  sourceEntity: {
    moduleId: ModuleId
    entityType: string
    entityId: string
    displayName: string
  }
  targetEntity: {
    moduleId: ModuleId
    entityType: string
    entityId: string
    displayName: string
  }
  strength: 'weak' | 'moderate' | 'strong'
  status: 'active' | 'inactive' | 'pending'
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface RelationshipCreateParams {
  type: string
  sourceEntity: {
    moduleId: ModuleId
    entityType: string
    entityId: string
  }
  targetEntity: {
    moduleId: ModuleId
    entityType: string
    entityId: string
  }
  strength?: RelationshipDTO['strength']
  notes?: string
}

export interface RelationshipUpdateParams {
  type?: string
  strength?: RelationshipDTO['strength']
  status?: RelationshipDTO['status']
  notes?: string
}

export interface RelationshipHealthDTO {
  relationshipId: string
  score: number
  level: 'critical' | 'poor' | 'fair' | 'good' | 'excellent'
  trend: 'declining' | 'stable' | 'improving'
  factors: {
    name: string
    score: number
    weight: number
  }[]
  lastUpdated: string
}

export interface NetworkGraphParams {
  centerEntityId: string
  depth: number
  includeTypes?: string[]
  excludeTypes?: string[]
  maxNodes?: number
}

export interface NetworkGraphDTO {
  nodes: {
    id: string
    label: string
    type: string
    moduleId: ModuleId
    metadata?: Record<string, unknown>
  }[]
  edges: {
    id: string
    source: string
    target: string
    type: string
    strength: RelationshipDTO['strength']
  }[]
}

/**
 * AI module DTOs
 */
export interface SemanticSearchParams {
  query: string
  modules?: ModuleId[]
  entityTypes?: string[]
  limit?: number
  threshold?: number
}

export interface SemanticSearchResult {
  entityRef: {
    moduleId: ModuleId
    entityType: string
    entityId: string
  }
  score: number
  snippet: string
  highlights?: string[]
}

export interface ExtractedEntity {
  type: 'person' | 'organization' | 'location' | 'date' | 'event' | 'topic'
  value: string
  confidence: number
  position: { start: number; end: number }
}

export interface SummaryOptions {
  maxLength?: number
  style?: 'brief' | 'detailed' | 'executive'
  language?: 'en' | 'ar'
}

export interface BriefOptions {
  includeRelationships?: boolean
  includeDocuments?: boolean
  includeTimeline?: boolean
  maxLength?: number
  language?: 'en' | 'ar'
}

export interface BriefDTO {
  id: string
  entityRef: {
    moduleId: ModuleId
    entityType: string
    entityId: string
  }
  summary: string
  keyPoints: string[]
  sections: {
    title: string
    content: string
  }[]
  generatedAt: string
  expiresAt?: string
}

export interface RecommendationParams {
  entityRef: {
    moduleId: ModuleId
    entityType: string
    entityId: string
  }
  types?: ('relationship' | 'document' | 'action' | 'engagement')[]
  limit?: number
}

export interface RecommendationDTO {
  id: string
  type: 'relationship' | 'document' | 'action' | 'engagement'
  title: string
  description: string
  confidence: number
  suggestedEntity?: {
    moduleId: ModuleId
    entityType: string
    entityId: string
    displayName: string
  }
  actionUrl?: string
  metadata?: Record<string, unknown>
}

// ============================================================================
// Module Events
// ============================================================================

/**
 * Document module events
 */
export const DOCUMENT_EVENTS = {
  UPLOADED: 'document.uploaded',
  UPDATED: 'document.updated',
  DELETED: 'document.deleted',
  LINKED: 'document.linked',
  UNLINKED: 'document.unlinked',
  VERSION_CREATED: 'document.version.created',
} as const

export type DocumentEventType = (typeof DOCUMENT_EVENTS)[keyof typeof DOCUMENT_EVENTS]

/**
 * Relationship module events
 */
export const RELATIONSHIP_EVENTS = {
  CREATED: 'relationship.created',
  UPDATED: 'relationship.updated',
  DELETED: 'relationship.deleted',
  HEALTH_UPDATED: 'relationship.health.updated',
  ALERT_TRIGGERED: 'relationship.alert.triggered',
} as const

export type RelationshipEventType = (typeof RELATIONSHIP_EVENTS)[keyof typeof RELATIONSHIP_EVENTS]

/**
 * AI module events
 */
export const AI_EVENTS = {
  BRIEF_GENERATED: 'ai.brief.generated',
  ENTITIES_EXTRACTED: 'ai.entities.extracted',
  RECOMMENDATIONS_UPDATED: 'ai.recommendations.updated',
  EMBEDDINGS_UPDATED: 'ai.embeddings.updated',
} as const

export type AIEventType = (typeof AI_EVENTS)[keyof typeof AI_EVENTS]
