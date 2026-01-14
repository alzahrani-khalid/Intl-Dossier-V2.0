/**
 * Document Context - React Query Hooks
 *
 * TanStack Query hooks for document operations.
 * These hooks provide the primary interface for React components
 * to interact with the document domain.
 */

import { useQuery, useMutation, useQueryClient, type UseQueryOptions } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { isOk, isDomainError } from '@/domains/shared'
import { documentService } from '../services/document.service'
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

// ============================================================================
// Query Keys
// ============================================================================

/**
 * Query key factory for documents
 */
export const documentKeys = {
  all: ['documents'] as const,
  lists: () => [...documentKeys.all, 'list'] as const,
  list: (params?: DocumentSearchParams) => [...documentKeys.lists(), params] as const,
  details: () => [...documentKeys.all, 'detail'] as const,
  detail: (id: string) => [...documentKeys.details(), id] as const,
  versions: (documentId: string) => [...documentKeys.all, 'versions', documentId] as const,
  version: (documentId: string, versionNumber: number) =>
    [...documentKeys.versions(documentId), versionNumber] as const,
  comparison: (documentId: string, versionA: number, versionB: number) =>
    [...documentKeys.all, 'comparison', documentId, versionA, versionB] as const,
  linked: (dossierId: string) => [...documentKeys.all, 'linked', dossierId] as const,
}

// ============================================================================
// List Documents Hook
// ============================================================================

/**
 * Hook to list documents with search and filters
 */
export function useDocuments(
  params?: DocumentSearchParams,
  options?: Omit<UseQueryOptions<DocumentListResponse, Error>, 'queryKey' | 'queryFn'>,
) {
  return useQuery({
    queryKey: documentKeys.list(params),
    queryFn: async (): Promise<DocumentListResponse> => {
      const result = await documentService.listDocuments(params)
      if (isOk(result)) {
        return result.data
      }
      throw result.error
    },
    staleTime: 30_000,
    gcTime: 5 * 60_000,
    ...options,
  })
}

// ============================================================================
// Get Document Hook
// ============================================================================

/**
 * Hook to get a single document
 */
export function useDocument(
  id: string,
  options?: Omit<UseQueryOptions<Document, Error>, 'queryKey' | 'queryFn'>,
) {
  return useQuery({
    queryKey: documentKeys.detail(id),
    queryFn: async (): Promise<Document> => {
      const result = await documentService.getDocument(id)
      if (isOk(result)) {
        return result.data
      }
      throw result.error
    },
    enabled: !!id,
    staleTime: 60_000,
    gcTime: 10 * 60_000,
    ...options,
  })
}

// ============================================================================
// Upload Document Hook
// ============================================================================

/**
 * Hook to upload a new document
 */
export function useUploadDocument() {
  const queryClient = useQueryClient()
  const { t } = useTranslation('documents')

  return useMutation({
    mutationFn: async ({
      file,
      metadata,
    }: {
      file: File
      metadata: DocumentCreate
    }): Promise<DocumentUploadResponse> => {
      const result = await documentService.uploadDocument(file, metadata)
      if (isOk(result)) {
        return result.data
      }
      throw result.error
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: documentKeys.lists() })
      if (data.document?.id) {
        queryClient.setQueryData(documentKeys.detail(data.document.id), data.document)
      }
      toast.success(t('messages.uploaded', { name: data.document?.title_en }))
    },
    onError: (error: Error) => {
      const message = isDomainError(error)
        ? error.message
        : t('messages.uploadError', { error: error.message })
      toast.error(message)
    },
  })
}

// ============================================================================
// Update Document Hook
// ============================================================================

/**
 * Hook to update document metadata
 */
export function useUpdateDocument() {
  const queryClient = useQueryClient()
  const { t } = useTranslation('documents')

  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string
      updates: DocumentUpdate
    }): Promise<Document> => {
      const result = await documentService.updateDocument(id, updates)
      if (isOk(result)) {
        return result.data
      }
      throw result.error
    },
    onMutate: async ({ id }) => {
      await queryClient.cancelQueries({ queryKey: documentKeys.detail(id) })
      const previousDocument = queryClient.getQueryData<Document>(documentKeys.detail(id))
      return { previousDocument }
    },
    onSuccess: (data, { id }) => {
      queryClient.setQueryData(documentKeys.detail(id), data)
      queryClient.invalidateQueries({ queryKey: documentKeys.lists() })
      toast.success(t('messages.updated'))
    },
    onError: (error: Error, { id }, context) => {
      if (context?.previousDocument) {
        queryClient.setQueryData(documentKeys.detail(id), context.previousDocument)
      }
      const message = isDomainError(error)
        ? error.message
        : t('messages.updateError', { error: error.message })
      toast.error(message)
    },
  })
}

// ============================================================================
// Archive Document Hook
// ============================================================================

/**
 * Hook to archive a document
 */
export function useArchiveDocument() {
  const queryClient = useQueryClient()
  const { t } = useTranslation('documents')

  return useMutation({
    mutationFn: async (id: string): Promise<{ success: boolean }> => {
      const result = await documentService.archiveDocument(id)
      if (isOk(result)) {
        return result.data
      }
      throw result.error
    },
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: documentKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: documentKeys.lists() })
      toast.success(t('messages.archived'))
    },
    onError: (error: Error) => {
      const message = isDomainError(error)
        ? error.message
        : t('messages.archiveError', { error: error.message })
      toast.error(message)
    },
  })
}

// ============================================================================
// Version Hooks
// ============================================================================

/**
 * Hook to get version history for a document
 */
export function useDocumentVersions(
  documentId: string,
  options?: VersionHistoryOptions &
    Omit<UseQueryOptions<VersionListResponse, Error>, 'queryKey' | 'queryFn'>,
) {
  return useQuery({
    queryKey: documentKeys.versions(documentId),
    queryFn: async (): Promise<VersionListResponse> => {
      const result = await documentService.getVersions({
        documentId,
        limit: options?.limit,
        offset: options?.offset,
      })
      if (isOk(result)) {
        return result.data
      }
      throw result.error
    },
    enabled: !!documentId,
    ...options,
  })
}

/**
 * Hook to upload a new version
 */
export function useUploadVersion() {
  const queryClient = useQueryClient()
  const { t } = useTranslation('documents')

  return useMutation({
    mutationFn: async ({
      documentId,
      file,
      metadata,
    }: {
      documentId: string
      file: File
      metadata?: VersionCreate
    }): Promise<DocumentVersion> => {
      const result = await documentService.uploadVersion(documentId, file, metadata)
      if (isOk(result)) {
        return result.data
      }
      throw result.error
    },
    onSuccess: (_, { documentId }) => {
      queryClient.invalidateQueries({ queryKey: documentKeys.detail(documentId) })
      queryClient.invalidateQueries({ queryKey: documentKeys.versions(documentId) })
      toast.success(t('messages.versionUploaded'))
    },
    onError: (error: Error) => {
      const message = isDomainError(error)
        ? error.message
        : t('messages.versionUploadError', { error: error.message })
      toast.error(message)
    },
  })
}

/**
 * Hook to compare two versions
 */
export function useVersionComparison(
  options: VersionCompareOptions,
  queryOptions?: Omit<UseQueryOptions<VersionComparisonResult, Error>, 'queryKey' | 'queryFn'>,
) {
  return useQuery({
    queryKey: documentKeys.comparison(options.documentId, options.versionA, options.versionB),
    queryFn: async (): Promise<VersionComparisonResult> => {
      const result = await documentService.compareVersions(options)
      if (isOk(result)) {
        return result.data
      }
      throw result.error
    },
    enabled:
      !!options.documentId &&
      !!options.versionA &&
      !!options.versionB &&
      options.versionA !== options.versionB,
    ...queryOptions,
  })
}

/**
 * Hook to revert to a previous version
 */
export function useRevertVersion() {
  const queryClient = useQueryClient()
  const { t } = useTranslation('documents')

  return useMutation({
    mutationFn: async (
      options: RevertOptions,
    ): Promise<{
      version: DocumentVersion
      message_en: string
      message_ar: string
    }> => {
      const result = await documentService.revertToVersion(options)
      if (isOk(result)) {
        return result.data
      }
      throw result.error
    },
    onSuccess: (_, { documentId }) => {
      queryClient.invalidateQueries({ queryKey: documentKeys.detail(documentId) })
      queryClient.invalidateQueries({ queryKey: documentKeys.versions(documentId) })
      toast.success(t('messages.reverted'))
    },
    onError: (error: Error) => {
      const message = isDomainError(error)
        ? error.message
        : t('messages.revertError', { error: error.message })
      toast.error(message)
    },
  })
}

// ============================================================================
// Linked Documents Hook
// ============================================================================

/**
 * Hook to get documents linked to a dossier
 */
export function useLinkedDocuments(
  dossierId: string,
  options?: Omit<UseQueryOptions<DocumentListResponse, Error>, 'queryKey' | 'queryFn'>,
) {
  return useQuery({
    queryKey: documentKeys.linked(dossierId),
    queryFn: async (): Promise<DocumentListResponse> => {
      const result = await documentService.getLinkedDocuments(dossierId)
      if (isOk(result)) {
        return result.data
      }
      throw result.error
    },
    enabled: !!dossierId,
    ...options,
  })
}

// ============================================================================
// Cache Invalidation Helper
// ============================================================================

/**
 * Hook to invalidate all document queries
 */
export function useInvalidateDocuments() {
  const queryClient = useQueryClient()

  return () => {
    queryClient.invalidateQueries({ queryKey: documentKeys.all })
  }
}
