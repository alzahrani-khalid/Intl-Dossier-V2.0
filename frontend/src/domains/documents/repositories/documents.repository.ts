/**
 * Documents Repository
 * @module domains/documents/repositories/documents.repository
 *
 * Plain function exports for document-related API operations.
 * Uses the shared apiClient for auth, base URL, and error handling.
 */

import { apiGet, apiPost } from '@/lib/api-client'

// ============================================================================
// Document Fetching
// ============================================================================

export interface DocumentsResponse {
  documents: Array<{
    id: string
    owner_type: string
    owner_id: string
    document_type: string
    title_en?: string
    title_ar?: string
    storage_path: string
    file_size?: number
    mime_type?: string
    metadata?: Record<string, unknown>
    uploaded_by: string
    created_at: string
  }>
  total_count: number
}

export async function getDocuments(filters?: {
  owner_type?: string
  owner_id?: string
  document_type?: string
}): Promise<DocumentsResponse> {
  const params = new URLSearchParams()
  if (filters?.owner_type) params.append('owner_type', filters.owner_type)
  if (filters?.owner_id) params.append('owner_id', filters.owner_id)
  if (filters?.document_type) params.append('document_type', filters.document_type)

  return apiGet<DocumentsResponse>(`/documents-get?${params.toString()}`)
}

// ============================================================================
// Data Export
// ============================================================================

export async function exportData(request: {
  entityType: string
  format: string
  [key: string]: unknown
}): Promise<{
  content: string
  fileName: string
  contentType: string
  recordCount: number
  exportedAt: string
  entityType: string
  format: string
}> {
  return apiPost(`/data-export`, request)
}
