/**
 * Documents Module - Public API
 *
 * This is the public entry point for the Documents module.
 * Only types and functions exported from here should be used by other modules.
 *
 * @module documents
 */

// ============================================================================
// Module (Primary Export)
// ============================================================================

export { documentModule, default } from './module'

// ============================================================================
// Public Types (Re-exported from core contracts)
// ============================================================================

// Re-export only the DTOs that other modules need
export type { DocumentDTO, DocumentListParams, DocumentUploadParams } from '../core/contracts'

// ============================================================================
// Events (for subscription)
// ============================================================================

export { DOCUMENT_EVENTS } from '../core/contracts'
export type { DocumentEventType } from '../core/contracts'

// ============================================================================
// Internal Types (DO NOT import from other modules)
// ============================================================================

// These are only for use within the documents module
// Other modules should use DocumentDTO from core/contracts

// export type { Document } from './types'  // NOT EXPORTED - internal only

// ============================================================================
// Usage Examples
// ============================================================================

/**
 * @example
 * // Access the Documents module from another module
 * import { getModule } from '@/modules/core'
 * import type { IDocumentModule } from '@/modules/core/contracts'
 *
 * const documentsModule = getModule<IDocumentModule>('documents')
 *
 * // Get linked documents for an entity
 * const result = await documentsModule.getLinkedDocuments(
 *   { moduleId: 'engagements', entityType: 'engagement', entityId: '123' },
 *   context
 * )
 *
 * if (result.success) {
 *   console.log('Documents:', result.data)
 * }
 *
 * @example
 * // Subscribe to document events
 * import { getEventBus } from '@/modules/core'
 * import { DOCUMENT_EVENTS } from '@/modules/documents'
 *
 * const eventBus = getEventBus()
 *
 * eventBus.subscribe(DOCUMENT_EVENTS.UPLOADED, (event) => {
 *   console.log('Document uploaded:', event.payload)
 * })
 */
