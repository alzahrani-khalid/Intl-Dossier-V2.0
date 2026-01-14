/**
 * Shared Kernel - Public API
 *
 * This module exports all shared types, utilities, and errors
 * that are used across bounded contexts.
 *
 * Import from this module:
 * ```typescript
 * import { DossierReference, Result, ok, err, DomainError } from '@/domains/shared'
 * ```
 */

// ============================================================================
// Types
// ============================================================================

// Dossier Reference
export {
  type DossierType,
  type DossierStatus,
  type DossierReference,
  type DossierReferenceExtended,
  type DossierReferenceSummary,
  isDossierReference,
  toDossierReference,
  toDossierReferenceSummary,
} from './types/dossier-reference'

// Entity Link
export {
  type LinkStatus,
  type LinkableEntityType,
  type EntityLink,
  type EntityLinkCreate,
  type EntityLinkUpdate,
  type EntityLinkFilters,
  isEntityLink,
} from './types/entity-link'

// Pagination
export {
  type OffsetPagination,
  type CursorPagination,
  type PaginatedResponse,
  type OffsetPaginationParams,
  type CursorPaginationParams,
  createDefaultOffsetPagination,
  createDefaultCursorPagination,
  isOffsetPagination,
  isCursorPagination,
} from './types/pagination'

// Audit
export {
  type AuditInfo,
  type AuditInfoWithUser,
  type AuditLogEntry,
  type Auditable,
  createAuditInfo,
  updateAuditInfo,
  hasAuditInfo,
} from './types/audit'

// Result
export {
  type Success,
  type Failure,
  type Result,
  ok,
  err,
  isOk,
  isErr,
  unwrap,
  unwrapOr,
  map,
  mapErr,
  andThen,
  tapErr,
  fromPromise,
  combine,
} from './types/result'

// ============================================================================
// Errors
// ============================================================================

export {
  type DomainErrorCode,
  ERROR_STATUS_MAP,
  DomainError,
  ValidationError,
  NotFoundError,
  AuthenticationError,
  AuthorizationError,
  ConflictError,
  isDomainError,
  fromApiError,
  wrapError,
} from './errors/domain-error'

// ============================================================================
// Utilities
// ============================================================================

export {
  getApiBaseUrl,
  getAuthHeaders,
  handleApiResponse,
  buildSearchParams,
  apiGet,
  apiPost,
  apiPatch,
  apiDelete,
  withRetry,
} from './utils/api-helpers'

// ============================================================================
// Event Contracts
// ============================================================================

export {
  type DomainEvent,
  createEvent,
  ENGAGEMENT_EVENTS,
  DOCUMENT_EVENTS,
  RELATIONSHIP_EVENTS,
  type EngagementCreatedPayload,
  type EngagementUpdatedPayload,
  type EngagementStatusChangedPayload,
  type ParticipantAddedPayload,
  type ParticipantRemovedPayload,
  type DocumentUploadedPayload,
  type DocumentVersionCreatedPayload,
  type DocumentLinkedPayload,
  type DocumentUnlinkedPayload,
  type RelationshipCreatedPayload,
  type RelationshipUpdatedPayload,
  type RelationshipDeletedPayload,
  type HealthUpdatedPayload,
  type AlertTriggeredPayload,
  type EngagementEvent,
  type DocumentEvent,
  type RelationshipEvent,
  type AnyDomainEvent,
} from './contracts/events'
