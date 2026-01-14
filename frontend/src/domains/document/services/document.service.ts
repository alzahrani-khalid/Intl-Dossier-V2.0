/**
 * Document Context - Domain Service
 *
 * Business logic layer for document operations.
 * Orchestrates repository calls and applies domain rules.
 */

import { type Result, ok, err, DomainError, wrapError } from '@/domains/shared'
import { documentRepository } from '../repositories/document.repository'
import type {
  Document,
  DocumentCreate,
  DocumentUpdate,
  DocumentSearchParams,
  DocumentUploadResponse,
} from '../types/document'
import type {
  DocumentVersion,
  VersionHistoryOptions,
  VersionCompareOptions,
  RevertOptions,
  VersionComparisonResult,
  VersionCreate,
} from '../types/version'
import type { DocumentListResponse, VersionListResponse } from '../repositories/document.repository'

// Maximum file size (100MB)
const MAX_FILE_SIZE = 100 * 1024 * 1024

// Allowed MIME types
const ALLOWED_MIME_TYPES = [
  // Documents
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  // Text
  'text/plain',
  'text/csv',
  'text/markdown',
  'application/json',
  'application/xml',
  'text/xml',
  // Images
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  // Archives
  'application/zip',
  'application/x-rar-compressed',
]

/**
 * Document Domain Service
 *
 * Provides domain-level operations for documents with
 * validation, business rules, and error handling.
 */
export const documentService = {
  // ============================================================================
  // Document Operations
  // ============================================================================

  /**
   * List documents with filters
   */
  async listDocuments(
    params?: DocumentSearchParams,
  ): Promise<Result<DocumentListResponse, DomainError>> {
    try {
      const result = await documentRepository.list(params)
      return ok(result)
    } catch (error) {
      return err(wrapError(error, 'DocumentService.listDocuments'))
    }
  },

  /**
   * Get a single document by ID
   */
  async getDocument(id: string): Promise<Result<Document, DomainError>> {
    if (!id) {
      return err(new DomainError('Document ID is required', 'VALIDATION_ERROR'))
    }

    try {
      const result = await documentRepository.getById(id)
      return ok(result)
    } catch (error) {
      return err(wrapError(error, 'DocumentService.getDocument'))
    }
  },

  /**
   * Upload a new document
   */
  async uploadDocument(
    file: File,
    metadata: DocumentCreate,
  ): Promise<Result<DocumentUploadResponse, DomainError>> {
    // Validate file
    const fileValidation = validateFile(file)
    if (fileValidation) {
      return err(fileValidation)
    }

    // Validate metadata
    const metadataValidation = validateDocumentCreate(metadata)
    if (metadataValidation) {
      return err(metadataValidation)
    }

    try {
      const result = await documentRepository.upload(file, metadata)
      return ok(result)
    } catch (error) {
      return err(wrapError(error, 'DocumentService.uploadDocument'))
    }
  },

  /**
   * Update document metadata
   */
  async updateDocument(id: string, data: DocumentUpdate): Promise<Result<Document, DomainError>> {
    if (!id) {
      return err(new DomainError('Document ID is required', 'VALIDATION_ERROR'))
    }

    try {
      const result = await documentRepository.update(id, data)
      return ok(result)
    } catch (error) {
      return err(wrapError(error, 'DocumentService.updateDocument'))
    }
  },

  /**
   * Archive a document
   */
  async archiveDocument(id: string): Promise<Result<{ success: boolean }, DomainError>> {
    if (!id) {
      return err(new DomainError('Document ID is required', 'VALIDATION_ERROR'))
    }

    try {
      const result = await documentRepository.archive(id)
      return ok(result)
    } catch (error) {
      return err(wrapError(error, 'DocumentService.archiveDocument'))
    }
  },

  /**
   * Get document download URL
   */
  async getDownloadUrl(
    id: string,
  ): Promise<Result<{ url: string; expires_at: string }, DomainError>> {
    if (!id) {
      return err(new DomainError('Document ID is required', 'VALIDATION_ERROR'))
    }

    try {
      const result = await documentRepository.getDownloadUrl(id)
      return ok(result)
    } catch (error) {
      return err(wrapError(error, 'DocumentService.getDownloadUrl'))
    }
  },

  // ============================================================================
  // Version Operations
  // ============================================================================

  /**
   * Get version history for a document
   */
  async getVersions(
    options: VersionHistoryOptions,
  ): Promise<Result<VersionListResponse, DomainError>> {
    if (!options.documentId) {
      return err(new DomainError('Document ID is required', 'VALIDATION_ERROR'))
    }

    try {
      const result = await documentRepository.getVersions(options)
      return ok(result)
    } catch (error) {
      return err(wrapError(error, 'DocumentService.getVersions'))
    }
  },

  /**
   * Get a specific version
   */
  async getVersion(
    documentId: string,
    versionNumber: number,
  ): Promise<Result<DocumentVersion, DomainError>> {
    if (!documentId) {
      return err(new DomainError('Document ID is required', 'VALIDATION_ERROR'))
    }
    if (!versionNumber || versionNumber < 1) {
      return err(new DomainError('Valid version number is required', 'VALIDATION_ERROR'))
    }

    try {
      const result = await documentRepository.getVersion(documentId, versionNumber)
      return ok(result)
    } catch (error) {
      return err(wrapError(error, 'DocumentService.getVersion'))
    }
  },

  /**
   * Upload a new version
   */
  async uploadVersion(
    documentId: string,
    file: File,
    metadata?: VersionCreate,
  ): Promise<Result<DocumentVersion, DomainError>> {
    if (!documentId) {
      return err(new DomainError('Document ID is required', 'VALIDATION_ERROR'))
    }

    // Validate file
    const fileValidation = validateFile(file)
    if (fileValidation) {
      return err(fileValidation)
    }

    try {
      const result = await documentRepository.uploadVersion(documentId, file, metadata)
      return ok(result)
    } catch (error) {
      return err(wrapError(error, 'DocumentService.uploadVersion'))
    }
  },

  /**
   * Compare two versions
   */
  async compareVersions(
    options: VersionCompareOptions,
  ): Promise<Result<VersionComparisonResult, DomainError>> {
    if (!options.documentId) {
      return err(new DomainError('Document ID is required', 'VALIDATION_ERROR'))
    }
    if (!options.versionA || !options.versionB) {
      return err(
        new DomainError('Both version numbers are required for comparison', 'VALIDATION_ERROR'),
      )
    }
    if (options.versionA === options.versionB) {
      return err(new DomainError('Cannot compare a version with itself', 'VALIDATION_ERROR'))
    }

    try {
      const result = await documentRepository.compareVersions(options)
      return ok(result)
    } catch (error) {
      return err(wrapError(error, 'DocumentService.compareVersions'))
    }
  },

  /**
   * Revert to a previous version
   */
  async revertToVersion(
    options: RevertOptions,
  ): Promise<
    Result<{ version: DocumentVersion; message_en: string; message_ar: string }, DomainError>
  > {
    if (!options.documentId) {
      return err(new DomainError('Document ID is required', 'VALIDATION_ERROR'))
    }
    if (!options.targetVersion || options.targetVersion < 1) {
      return err(new DomainError('Valid target version number is required', 'VALIDATION_ERROR'))
    }

    try {
      const result = await documentRepository.revertToVersion(options)
      return ok(result)
    } catch (error) {
      return err(wrapError(error, 'DocumentService.revertToVersion'))
    }
  },

  // ============================================================================
  // Link Operations
  // ============================================================================

  /**
   * Get documents linked to a dossier
   */
  async getLinkedDocuments(dossierId: string): Promise<Result<DocumentListResponse, DomainError>> {
    if (!dossierId) {
      return err(new DomainError('Dossier ID is required', 'VALIDATION_ERROR'))
    }

    try {
      const result = await documentRepository.getLinkedDocuments(dossierId)
      return ok(result)
    } catch (error) {
      return err(wrapError(error, 'DocumentService.getLinkedDocuments'))
    }
  },

  /**
   * Link a document to a dossier
   */
  async linkToDossier(
    documentId: string,
    dossierId: string,
  ): Promise<Result<{ success: boolean }, DomainError>> {
    if (!documentId) {
      return err(new DomainError('Document ID is required', 'VALIDATION_ERROR'))
    }
    if (!dossierId) {
      return err(new DomainError('Dossier ID is required', 'VALIDATION_ERROR'))
    }

    try {
      const result = await documentRepository.linkToDossier(documentId, dossierId)
      return ok(result)
    } catch (error) {
      return err(wrapError(error, 'DocumentService.linkToDossier'))
    }
  },

  /**
   * Unlink a document from a dossier
   */
  async unlinkFromDossier(
    documentId: string,
    dossierId: string,
  ): Promise<Result<{ success: boolean }, DomainError>> {
    if (!documentId) {
      return err(new DomainError('Document ID is required', 'VALIDATION_ERROR'))
    }
    if (!dossierId) {
      return err(new DomainError('Dossier ID is required', 'VALIDATION_ERROR'))
    }

    try {
      const result = await documentRepository.unlinkFromDossier(documentId, dossierId)
      return ok(result)
    } catch (error) {
      return err(wrapError(error, 'DocumentService.unlinkFromDossier'))
    }
  },
}

// ============================================================================
// Validation Helpers
// ============================================================================

function validateFile(file: File): DomainError | null {
  if (!file) {
    return new DomainError('File is required', 'VALIDATION_ERROR')
  }

  if (file.size > MAX_FILE_SIZE) {
    return new DomainError(
      `File size exceeds maximum allowed size of ${MAX_FILE_SIZE / 1024 / 1024}MB`,
      'VALIDATION_ERROR',
      { maxSize: MAX_FILE_SIZE, actualSize: file.size },
    )
  }

  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return new DomainError('File type is not allowed', 'VALIDATION_ERROR', {
      mimeType: file.type,
      allowedTypes: ALLOWED_MIME_TYPES,
    })
  }

  return null
}

function validateDocumentCreate(data: DocumentCreate): DomainError | null {
  if (!data.title_en?.trim()) {
    return new DomainError('Document title is required', 'VALIDATION_ERROR')
  }

  if (!data.category) {
    return new DomainError('Document category is required', 'VALIDATION_ERROR')
  }

  return null
}

/**
 * Type for the document service
 */
export type DocumentService = typeof documentService
