/**
 * Modular Monolith - Core Module Exports
 *
 * This is the main entry point for the modular monolith core.
 * Import all core types, contracts, and utilities from here.
 *
 * @module core
 */

// ============================================================================
// Types
// ============================================================================

export type {
  ModuleId,
  ModuleStatus,
  ModuleResult,
  ModuleError,
  ModuleErrorCode,
  ModulePagination,
  ModulePaginatedResponse,
  FilterOperator,
  ModuleFilter,
  ModuleSort,
  ModuleEvent,
  ModuleEventHandler,
  ModuleEventSubscription,
  ModuleRequestContext,
  ModuleCommand,
  ModuleQuery,
  ModuleEntityRef,
} from './types'

export {
  moduleOk,
  moduleErr,
  createModuleError,
  isModuleOk,
  isModuleErr,
  unwrapModule,
  unwrapModuleOr,
  createEntityRef,
  generateCorrelationId,
} from './types'

// ============================================================================
// Contracts
// ============================================================================

export type {
  IModule,
  ModuleHealthStatus,
  IModuleEventBus,
  IDocumentModule,
  IRelationshipModule,
  IAIModule,
  // DTOs
  DocumentDTO,
  DocumentListParams,
  DocumentUploadParams,
  RelationshipDTO,
  RelationshipCreateParams,
  RelationshipUpdateParams,
  RelationshipHealthDTO,
  NetworkGraphParams,
  NetworkGraphDTO,
  SemanticSearchParams,
  SemanticSearchResult,
  ExtractedEntity,
  SummaryOptions,
  BriefOptions,
  BriefDTO,
  RecommendationParams,
  RecommendationDTO,
} from './contracts'

export { DOCUMENT_EVENTS, RELATIONSHIP_EVENTS, AI_EVENTS } from './contracts'

export type { DocumentEventType, RelationshipEventType, AIEventType } from './contracts'

// ============================================================================
// Event Bus
// ============================================================================

export {
  getEventBus,
  resetEventBus,
  createModuleEvent,
  useEventBus,
  enableEventLogging,
} from './event-bus'

// ============================================================================
// Registry
// ============================================================================

export {
  getModuleRegistry,
  resetModuleRegistry,
  getModule,
  useModule,
  useModuleStatuses,
  ModuleRegistration,
} from './registry'
