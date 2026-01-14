/**
 * Document Context - Repository
 *
 * Data access layer for document entities.
 * Abstracts the underlying data source (Supabase Edge Functions)
 * from the service layer.
 */

import {
  apiGet,
  apiPost,
  apiPatch,
  apiDelete,
  getAuthHeaders,
  getApiBaseUrl,
  handleApiResponse,
} from '@/domains/shared'
import type {
  Document,
  DocumentListItem,
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

/**
 * Document list response from API
 */
export interface DocumentListResponse {
  data: DocumentListItem[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    has_more: boolean
  }
}

/**
 * Version list response from API
 */
export interface VersionListResponse {
  data: DocumentVersion[]
  pagination: {
    limit: number
    offset: number
    has_more: boolean
  }
}

/**
 * Document Repository
 *
 * Provides data access methods for documents. All methods are
 * stateless and make direct API calls.
 */
export const documentRepository = {
  // ============================================================================
  // Document CRUD
  // ============================================================================

  /**
   * List documents with search and filters
   */
  async list(params?: DocumentSearchParams): Promise<DocumentListResponse> {
    return apiGet<DocumentListResponse>('documents', {
      search: params?.search,
      category: params?.category,
      classification: params?.classification,
      status: params?.status,
      linked_dossier_id: params?.linked_dossier_id,
      mime_type: params?.mime_type,
      from_date: params?.from_date,
      to_date: params?.to_date,
      page: params?.page,
      limit: params?.limit,
    })
  },

  /**
   * Get a single document by ID
   */
  async getById(id: string): Promise<Document> {
    return apiGet<Document>(`documents/${id}`)
  },

  /**
   * Upload a new document
   */
  async upload(file: File, metadata: DocumentCreate): Promise<DocumentUploadResponse> {
    const headers = await getAuthHeaders()
    // Remove Content-Type to let browser set it with boundary for multipart
    delete (headers as Record<string, string>)['Content-Type']

    const formData = new FormData()
    formData.append('file', file)
    formData.append('metadata', JSON.stringify(metadata))

    const response = await fetch(`${getApiBaseUrl()}/documents`, {
      method: 'POST',
      headers,
      body: formData,
    })

    return handleApiResponse<DocumentUploadResponse>(response)
  },

  /**
   * Update document metadata
   */
  async update(id: string, data: DocumentUpdate): Promise<Document> {
    return apiPatch<Document, DocumentUpdate>(`documents/${id}`, data)
  },

  /**
   * Archive (soft delete) a document
   */
  async archive(id: string): Promise<{ success: boolean }> {
    return apiDelete<{ success: boolean }>(`documents/${id}`)
  },

  /**
   * Get document download URL
   */
  async getDownloadUrl(id: string): Promise<{ url: string; expires_at: string }> {
    return apiGet<{ url: string; expires_at: string }>(`documents/${id}/download`)
  },

  // ============================================================================
  // Document Versions
  // ============================================================================

  /**
   * Get version history for a document
   */
  async getVersions(options: VersionHistoryOptions): Promise<VersionListResponse> {
    return apiGet<VersionListResponse>(`documents/${options.documentId}/versions`, {
      limit: options.limit,
      offset: options.offset,
    })
  },

  /**
   * Get a specific version
   */
  async getVersion(documentId: string, versionNumber: number): Promise<DocumentVersion> {
    return apiGet<DocumentVersion>(`documents/${documentId}/versions/${versionNumber}`)
  },

  /**
   * Upload a new version
   */
  async uploadVersion(
    documentId: string,
    file: File,
    metadata?: VersionCreate,
  ): Promise<DocumentVersion> {
    const headers = await getAuthHeaders()
    delete (headers as Record<string, string>)['Content-Type']

    const formData = new FormData()
    formData.append('file', file)
    if (metadata) {
      formData.append('metadata', JSON.stringify(metadata))
    }

    const response = await fetch(`${getApiBaseUrl()}/documents/${documentId}/versions`, {
      method: 'POST',
      headers,
      body: formData,
    })

    return handleApiResponse<DocumentVersion>(response)
  },

  /**
   * Compare two versions
   */
  async compareVersions(options: VersionCompareOptions): Promise<VersionComparisonResult> {
    return apiGet<VersionComparisonResult>(`documents/${options.documentId}/versions/compare`, {
      version_a: options.versionA,
      version_b: options.versionB,
      view_mode: options.viewMode,
    })
  },

  /**
   * Revert to a previous version
   */
  async revertToVersion(
    options: RevertOptions,
  ): Promise<{ version: DocumentVersion; message_en: string; message_ar: string }> {
    return apiPost<
      { version: DocumentVersion; message_en: string; message_ar: string },
      { target_version: number; reason?: string }
    >(`documents/${options.documentId}/versions/revert`, {
      target_version: options.targetVersion,
      reason: options.reason,
    })
  },

  // ============================================================================
  // Document Links
  // ============================================================================

  /**
   * Get documents linked to a dossier
   */
  async getLinkedDocuments(dossierId: string): Promise<DocumentListResponse> {
    return apiGet<DocumentListResponse>('documents', {
      linked_dossier_id: dossierId,
    })
  },

  /**
   * Link a document to a dossier
   */
  async linkToDossier(documentId: string, dossierId: string): Promise<{ success: boolean }> {
    return apiPost<{ success: boolean }, { dossier_id: string }>(`documents/${documentId}/link`, {
      dossier_id: dossierId,
    })
  },

  /**
   * Unlink a document from a dossier
   */
  async unlinkFromDossier(documentId: string, dossierId: string): Promise<{ success: boolean }> {
    return apiDelete<{ success: boolean }>(`documents/${documentId}/link?dossier_id=${dossierId}`)
  },
}

/**
 * Type for the document repository
 */
export type DocumentRepository = typeof documentRepository
