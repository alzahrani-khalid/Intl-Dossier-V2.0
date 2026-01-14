/**
 * Documents Module - Service
 *
 * Business logic layer for the Documents module.
 * Orchestrates repository calls, applies validation, and handles events.
 *
 * @module documents/service
 */

import type {
  ModuleResult,
  ModuleError,
  ModuleRequestContext,
  ModulePaginatedResponse,
  ModuleId,
} from '../core/types'
import type { DocumentDTO, DocumentListParams, DocumentUploadParams } from '../core/contracts'
import { DOCUMENT_EVENTS } from '../core/contracts'
import { moduleOk, moduleErr, createModuleError } from '../core/types'
import { getEventBus, createModuleEvent } from '../core/event-bus'
import { documentRepository } from './repository'
import type { Document, DocumentSearchParams, DocumentCreateParams } from './types'

// ============================================================================
// DTO Mappers
// ============================================================================

/**
 * Map internal Document to public DocumentDTO
 */
function toDocumentDTO(doc: Document, url?: string): DocumentDTO {
  return {
    id: doc.id,
    name: doc.name_en,
    nameAr: doc.name_ar,
    type: doc.document_type,
    mimeType: doc.mime_type,
    size: doc.file_size,
    url: url || '',
    classification: doc.classification,
    version: doc.version_number,
    createdAt: doc.created_at,
    updatedAt: doc.updated_at,
    createdBy: doc.created_by,
    metadata: doc.metadata,
  }
}

/**
 * Map DocumentListParams to internal SearchParams
 */
function toSearchParams(params: DocumentListParams): DocumentSearchParams {
  return {
    search: params.search,
    classifications: params.classification,
    documentTypes: params.type as DocumentSearchParams['documentTypes'],
    limit: params.pagination.limit,
    offset: params.pagination.offset,
    cursor: params.pagination.cursor,
  }
}

// ============================================================================
// Document Service
// ============================================================================

export const documentService = {
  /**
   * Get a document by ID
   */
  async getDocument(
    id: string,
    context: ModuleRequestContext,
  ): Promise<ModuleResult<DocumentDTO, ModuleError>> {
    if (!id) {
      return moduleErr(
        createModuleError('VALIDATION_ERROR', 'Document ID is required', 'documents'),
      )
    }

    try {
      const document = await documentRepository.getById(id)
      const url = await documentRepository.getDownloadUrl(document)
      return moduleOk(toDocumentDTO(document, url))
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'

      if (message.includes('not found')) {
        return moduleErr(createModuleError('NOT_FOUND', `Document ${id} not found`, 'documents'))
      }

      return moduleErr(
        createModuleError('INTERNAL_ERROR', message, 'documents', undefined, error as Error),
      )
    }
  },

  /**
   * List documents with pagination
   */
  async listDocuments(
    params: DocumentListParams,
    context: ModuleRequestContext,
  ): Promise<ModuleResult<ModulePaginatedResponse<DocumentDTO>, ModuleError>> {
    try {
      const searchParams = toSearchParams(params)
      const result = await documentRepository.list(searchParams)

      // Get download URLs for all documents
      const documentsWithUrls = await Promise.all(
        result.documents.map(async (doc) => {
          try {
            const url = await documentRepository.getDownloadUrl(doc)
            return toDocumentDTO(doc, url)
          } catch {
            return toDocumentDTO(doc)
          }
        }),
      )

      return moduleOk({
        data: documentsWithUrls,
        pagination: {
          total: result.total,
          limit: result.limit,
          offset: result.offset,
          cursor: result.cursor,
          hasMore: result.hasMore,
        },
      })
    } catch (error) {
      return moduleErr(
        createModuleError(
          'INTERNAL_ERROR',
          error instanceof Error ? error.message : 'Failed to list documents',
          'documents',
        ),
      )
    }
  },

  /**
   * Get documents linked to an entity
   */
  async getLinkedDocuments(
    entityRef: { moduleId: ModuleId; entityType: string; entityId: string },
    context: ModuleRequestContext,
  ): Promise<ModuleResult<DocumentDTO[], ModuleError>> {
    try {
      const documents = await documentRepository.getLinkedDocuments(
        entityRef.moduleId,
        entityRef.entityType,
        entityRef.entityId,
      )

      const documentsWithUrls = await Promise.all(
        documents.map(async (doc) => {
          try {
            const url = await documentRepository.getDownloadUrl(doc)
            return toDocumentDTO(doc, url)
          } catch {
            return toDocumentDTO(doc)
          }
        }),
      )

      return moduleOk(documentsWithUrls)
    } catch (error) {
      return moduleErr(
        createModuleError(
          'INTERNAL_ERROR',
          error instanceof Error ? error.message : 'Failed to get linked documents',
          'documents',
        ),
      )
    }
  },

  /**
   * Link a document to an entity
   */
  async linkDocument(
    documentId: string,
    entityRef: { moduleId: ModuleId; entityType: string; entityId: string },
    context: ModuleRequestContext,
  ): Promise<ModuleResult<void, ModuleError>> {
    if (!documentId) {
      return moduleErr(
        createModuleError('VALIDATION_ERROR', 'Document ID is required', 'documents'),
      )
    }

    try {
      await documentRepository.linkDocument(
        documentId,
        entityRef.moduleId,
        entityRef.entityType,
        entityRef.entityId,
        'reference',
        context.userId,
      )

      // Publish event
      const eventBus = getEventBus()
      await eventBus.publish(
        createModuleEvent(
          DOCUMENT_EVENTS.LINKED,
          'documents',
          {
            documentId,
            entityRef,
          },
          context.correlationId,
        ),
      )

      return moduleOk(undefined)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to link document'

      if (message.includes('already linked')) {
        return moduleErr(createModuleError('CONFLICT', message, 'documents'))
      }

      return moduleErr(createModuleError('INTERNAL_ERROR', message, 'documents'))
    }
  },

  /**
   * Unlink a document from an entity
   */
  async unlinkDocument(
    documentId: string,
    entityRef: { moduleId: ModuleId; entityType: string; entityId: string },
    context: ModuleRequestContext,
  ): Promise<ModuleResult<void, ModuleError>> {
    if (!documentId) {
      return moduleErr(
        createModuleError('VALIDATION_ERROR', 'Document ID is required', 'documents'),
      )
    }

    try {
      await documentRepository.unlinkDocument(
        documentId,
        entityRef.moduleId,
        entityRef.entityType,
        entityRef.entityId,
      )

      // Publish event
      const eventBus = getEventBus()
      await eventBus.publish(
        createModuleEvent(
          DOCUMENT_EVENTS.UNLINKED,
          'documents',
          {
            documentId,
            entityRef,
          },
          context.correlationId,
        ),
      )

      return moduleOk(undefined)
    } catch (error) {
      return moduleErr(
        createModuleError(
          'INTERNAL_ERROR',
          error instanceof Error ? error.message : 'Failed to unlink document',
          'documents',
        ),
      )
    }
  },

  /**
   * Upload a new document
   */
  async uploadDocument(
    data: DocumentUploadParams,
    context: ModuleRequestContext,
  ): Promise<ModuleResult<DocumentDTO, ModuleError>> {
    // Validation
    if (!data.name) {
      return moduleErr(
        createModuleError('VALIDATION_ERROR', 'Document name is required', 'documents'),
      )
    }

    if (!data.file) {
      return moduleErr(createModuleError('VALIDATION_ERROR', 'File is required', 'documents'))
    }

    try {
      const createParams: DocumentCreateParams = {
        name_en: data.name,
        name_ar: data.nameAr,
        document_type: data.type as DocumentCreateParams['document_type'],
        classification: data.classification,
        file: data.file,
        metadata: data.metadata,
        linkedEntities: data.linkedEntities?.map((e) => ({
          moduleId: e.moduleId,
          entityType: e.entityType,
          entityId: e.entityId,
        })),
      }

      const result = await documentRepository.create(createParams, context.userId)
      const url = await documentRepository.getDownloadUrl(result.document)
      const dto = toDocumentDTO(result.document, url)

      // Publish event
      const eventBus = getEventBus()
      await eventBus.publish(
        createModuleEvent(
          DOCUMENT_EVENTS.UPLOADED,
          'documents',
          {
            documentId: result.document.id,
            name: result.document.name_en,
            type: result.document.document_type,
            linkedEntities: data.linkedEntities,
          },
          context.correlationId,
        ),
      )

      return moduleOk(dto)
    } catch (error) {
      return moduleErr(
        createModuleError(
          'INTERNAL_ERROR',
          error instanceof Error ? error.message : 'Failed to upload document',
          'documents',
        ),
      )
    }
  },

  /**
   * Delete a document
   */
  async deleteDocument(
    id: string,
    context: ModuleRequestContext,
  ): Promise<ModuleResult<void, ModuleError>> {
    if (!id) {
      return moduleErr(
        createModuleError('VALIDATION_ERROR', 'Document ID is required', 'documents'),
      )
    }

    try {
      // Get document info before deletion for event
      const document = await documentRepository.getById(id)

      await documentRepository.delete(id, context.userId)

      // Publish event
      const eventBus = getEventBus()
      await eventBus.publish(
        createModuleEvent(
          DOCUMENT_EVENTS.DELETED,
          'documents',
          {
            documentId: id,
            name: document.name_en,
          },
          context.correlationId,
        ),
      )

      return moduleOk(undefined)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete document'

      if (message.includes('not found')) {
        return moduleErr(createModuleError('NOT_FOUND', message, 'documents'))
      }

      return moduleErr(createModuleError('INTERNAL_ERROR', message, 'documents'))
    }
  },
}

export type DocumentService = typeof documentService
