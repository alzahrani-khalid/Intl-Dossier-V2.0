/**
 * Modular Monolith - Core Types
 *
 * This file defines the foundational types for the modular monolith architecture.
 * All modules must use these types for inter-module communication.
 *
 * @module core/types
 */

// ============================================================================
// Module Identity
// ============================================================================

/**
 * Unique identifier for each module in the system
 */
export type ModuleId =
  | 'documents'
  | 'relationships'
  | 'ai'
  | 'engagements'
  | 'commitments'
  | 'notifications'
  | 'search'
  | 'analytics'

/**
 * Module status for lifecycle management
 */
export type ModuleStatus = 'initializing' | 'ready' | 'degraded' | 'stopped'

// ============================================================================
// Module Communication Types
// ============================================================================

/**
 * Standard result type for all module operations
 */
export type ModuleResult<T, E = ModuleError> =
  | { success: true; data: T }
  | { success: false; error: E }

/**
 * Standard error type for all module operations
 */
export interface ModuleError {
  code: ModuleErrorCode
  message: string
  module: ModuleId
  details?: Record<string, unknown>
  cause?: Error
}

/**
 * Standard error codes across all modules
 */
export type ModuleErrorCode =
  | 'VALIDATION_ERROR'
  | 'NOT_FOUND'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'CONFLICT'
  | 'INTERNAL_ERROR'
  | 'MODULE_UNAVAILABLE'
  | 'DEPENDENCY_ERROR'
  | 'TIMEOUT'
  | 'RATE_LIMITED'

// ============================================================================
// Module Query Types
// ============================================================================

/**
 * Standard pagination parameters for list operations
 */
export interface ModulePagination {
  limit: number
  offset?: number
  cursor?: string
}

/**
 * Standard paginated response
 */
export interface ModulePaginatedResponse<T> {
  data: T[]
  pagination: {
    total: number
    limit: number
    offset?: number
    cursor?: string
    hasMore: boolean
  }
}

/**
 * Standard filter operators
 */
export type FilterOperator = 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'like' | 'ilike'

/**
 * Generic filter definition
 */
export interface ModuleFilter<T = unknown> {
  field: string
  operator: FilterOperator
  value: T
}

/**
 * Standard sort definition
 */
export interface ModuleSort {
  field: string
  direction: 'asc' | 'desc'
}

// ============================================================================
// Module Event Types
// ============================================================================

/**
 * Standard event structure for inter-module communication
 */
export interface ModuleEvent<TPayload = unknown> {
  id: string
  type: string
  source: ModuleId
  timestamp: string
  payload: TPayload
  correlationId?: string
  metadata?: Record<string, unknown>
}

/**
 * Event handler type
 */
export type ModuleEventHandler<TPayload = unknown> = (
  event: ModuleEvent<TPayload>,
) => Promise<void> | void

/**
 * Event subscription
 */
export interface ModuleEventSubscription {
  unsubscribe: () => void
}

// ============================================================================
// Module Request/Response Types
// ============================================================================

/**
 * Standard request context passed between modules
 */
export interface ModuleRequestContext {
  userId: string
  tenantId?: string
  locale: 'en' | 'ar'
  correlationId: string
  permissions?: string[]
  metadata?: Record<string, unknown>
}

/**
 * Standard command type for write operations
 */
export interface ModuleCommand<TPayload = unknown> {
  type: string
  payload: TPayload
  context: ModuleRequestContext
}

/**
 * Standard query type for read operations
 */
export interface ModuleQuery<TParams = unknown> {
  type: string
  params: TParams
  context: ModuleRequestContext
}

// ============================================================================
// Module Reference Types
// ============================================================================

/**
 * Reference to an entity in another module
 * Used for loose coupling between modules
 */
export interface ModuleEntityRef {
  moduleId: ModuleId
  entityType: string
  entityId: string
  displayName?: string
}

/**
 * Create a module entity reference
 */
export function createEntityRef(
  moduleId: ModuleId,
  entityType: string,
  entityId: string,
  displayName?: string,
): ModuleEntityRef {
  return { moduleId, entityType, entityId, displayName }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Create a successful module result
 */
export function moduleOk<T>(data: T): ModuleResult<T, never> {
  return { success: true, data }
}

/**
 * Create a failed module result
 */
export function moduleErr<E extends ModuleError>(error: E): ModuleResult<never, E> {
  return { success: false, error }
}

/**
 * Create a standard module error
 */
export function createModuleError(
  code: ModuleErrorCode,
  message: string,
  module: ModuleId,
  details?: Record<string, unknown>,
  cause?: Error,
): ModuleError {
  return { code, message, module, details, cause }
}

/**
 * Check if a result is successful
 */
export function isModuleOk<T, E>(result: ModuleResult<T, E>): result is { success: true; data: T } {
  return result.success
}

/**
 * Check if a result is an error
 */
export function isModuleErr<T, E>(
  result: ModuleResult<T, E>,
): result is { success: false; error: E } {
  return !result.success
}

/**
 * Unwrap a successful result or throw
 */
export function unwrapModule<T, E extends ModuleError>(result: ModuleResult<T, E>): T {
  if (result.success) {
    return result.data
  }
  throw new Error(`Module error [${result.error.module}]: ${result.error.message}`)
}

/**
 * Unwrap a result with a default value
 */
export function unwrapModuleOr<T, E>(result: ModuleResult<T, E>, defaultValue: T): T {
  return result.success ? result.data : defaultValue
}

/**
 * Generate a unique correlation ID
 */
export function generateCorrelationId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}
