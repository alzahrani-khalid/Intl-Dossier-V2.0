/**
 * useDocuments Hook
 * @module domains/documents/hooks/useDocuments
 *
 * TanStack Query hook for fetching documents.
 * Routes through the documents repository.
 */

import { useQuery } from '@tanstack/react-query'
import * as DocumentsRepo from '../repositories/documents.repository'

// ============================================================================
// Types
// ============================================================================

export interface Document {
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
}

export interface UseDocumentsFilters {
  owner_type?: string
  owner_id?: string
  document_type?: string
}

export interface UseDocumentsResult {
  documents: Document[]
  totalCount: number
  isLoading: boolean
  error: Error | null
  refetch: () => void
}

// ============================================================================
// Hook Implementation
// ============================================================================

export function useDocuments(filters?: UseDocumentsFilters): UseDocumentsResult {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['documents', filters],
    queryFn: () => DocumentsRepo.getDocuments(filters),
    staleTime: 5 * 60 * 1000,
    enabled: !!(filters?.owner_type && filters?.owner_id),
  })

  return {
    documents: data?.documents || [],
    totalCount: data?.total_count || 0,
    isLoading,
    error: error as Error | null,
    refetch,
  }
}
