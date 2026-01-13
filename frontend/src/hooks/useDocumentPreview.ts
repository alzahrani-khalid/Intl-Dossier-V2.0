/**
 * useDocumentPreview Hook
 *
 * Provides document preview functionality including:
 * - Signed URL generation for viewing
 * - Thumbnail caching
 * - Preview state management
 * - File type detection
 */
import { useState, useCallback, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type {
  PreviewDocument,
  PreviewOptions,
  PreviewStatus,
  PreviewableFileType,
  ThumbnailSize,
  ThumbnailResponse,
} from '@/types/document-preview.types'
import { getFileTypeFromMime, isPreviewable } from '@/types/document-preview.types'

// Get Supabase URL from environment
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL

interface UseDocumentPreviewOptions extends PreviewOptions {
  enabled?: boolean
}

interface UseDocumentPreviewResult {
  // State
  previewUrl: string | null
  thumbnailUrl: string | null
  status: PreviewStatus
  error: string | null
  fileType: PreviewableFileType
  isPreviewable: boolean
  currentPage: number
  totalPages: number
  zoomLevel: number

  // Actions
  openPreview: (document: PreviewDocument) => void
  closePreview: () => void
  setCurrentPage: (page: number) => void
  setTotalPages: (pages: number) => void
  setZoomLevel: (zoom: number) => void
  generateThumbnail: (
    documentId: string,
    storagePath: string,
    size?: ThumbnailSize,
  ) => Promise<ThumbnailResponse | null>
  downloadDocument: (document: PreviewDocument) => Promise<void>

  // Preview document
  previewDocument: PreviewDocument | null
  isOpen: boolean
}

export function useDocumentPreview(
  options: UseDocumentPreviewOptions = {},
): UseDocumentPreviewResult {
  const { initial_zoom = 1, initial_page = 1, cache_thumbnails = true, enabled = true } = options

  const queryClient = useQueryClient()

  // Local state
  const [previewDocument, setPreviewDocument] = useState<PreviewDocument | null>(null)
  const [status, setStatus] = useState<PreviewStatus>('idle')
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(initial_page)
  const [totalPages, setTotalPages] = useState(1)
  const [zoomLevel, setZoomLevel] = useState(initial_zoom)

  // Determine file type
  const fileType = useMemo<PreviewableFileType>(() => {
    if (!previewDocument?.mime_type) return 'unsupported'
    return getFileTypeFromMime(previewDocument.mime_type)
  }, [previewDocument?.mime_type])

  const canPreview = useMemo(() => {
    if (!previewDocument?.mime_type) return false
    return isPreviewable(previewDocument.mime_type)
  }, [previewDocument?.mime_type])

  // Fetch preview URL when document is set
  const {
    data: previewData,
    isLoading,
    error: queryError,
  } = useQuery({
    queryKey: ['document-preview', previewDocument?.id, previewDocument?.file_path],
    queryFn: async () => {
      if (!previewDocument) return null

      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) throw new Error('Not authenticated')

      const params = new URLSearchParams({
        storage_path: previewDocument.file_path,
        mime_type: previewDocument.mime_type || '',
      })
      if (previewDocument.id) {
        params.append('document_id', previewDocument.id)
      }

      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/document-preview?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        },
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to get preview URL')
      }

      return response.json()
    },
    enabled: enabled && !!previewDocument?.file_path,
    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
  })

  // Update status based on query state
  useMemo(() => {
    if (isLoading) {
      setStatus('loading')
    } else if (queryError) {
      setStatus('error')
      setError((queryError as Error).message)
    } else if (previewData) {
      setStatus('ready')
      setError(null)
    }
  }, [isLoading, queryError, previewData])

  // Generate thumbnail mutation
  const thumbnailMutation = useMutation({
    mutationFn: async ({
      documentId,
      storagePath,
      size = 'medium',
    }: {
      documentId: string
      storagePath: string
      size?: ThumbnailSize
    }): Promise<ThumbnailResponse> => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) throw new Error('Not authenticated')

      const response = await fetch(`${SUPABASE_URL}/functions/v1/document-preview`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          document_id: documentId,
          storage_path: storagePath,
          size,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to generate thumbnail')
      }

      return response.json()
    },
    onSuccess: (data) => {
      if (cache_thumbnails && data.thumbnail_url) {
        // Cache the thumbnail URL
        queryClient.setQueryData(['thumbnail', data.document_id], data)
      }
    },
  })

  // Open preview
  const openPreview = useCallback(
    (document: PreviewDocument) => {
      setPreviewDocument(document)
      setStatus('loading')
      setError(null)
      setCurrentPage(initial_page)
      setZoomLevel(initial_zoom)
    },
    [initial_page, initial_zoom],
  )

  // Close preview
  const closePreview = useCallback(() => {
    setPreviewDocument(null)
    setStatus('idle')
    setError(null)
    setCurrentPage(1)
    setTotalPages(1)
    setZoomLevel(1)
  }, [])

  // Generate thumbnail
  const generateThumbnail = useCallback(
    async (
      documentId: string,
      storagePath: string,
      size: ThumbnailSize = 'medium',
    ): Promise<ThumbnailResponse | null> => {
      try {
        return await thumbnailMutation.mutateAsync({ documentId, storagePath, size })
      } catch (err) {
        console.error('Thumbnail generation error:', err)
        return null
      }
    },
    [thumbnailMutation],
  )

  // Download document
  const downloadDocument = useCallback(async (document: PreviewDocument) => {
    try {
      const { data, error: downloadError } = await supabase.storage
        .from('documents')
        .download(document.file_path)

      if (downloadError) throw downloadError

      // Create download link
      const url = URL.createObjectURL(data)
      const a = globalThis.document.createElement('a')
      a.href = url
      a.download = document.file_name
      globalThis.document.body.appendChild(a)
      a.click()
      globalThis.document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Download error:', err)
      throw err
    }
  }, [])

  return {
    // State
    previewUrl: previewData?.preview_url || null,
    thumbnailUrl: previewData?.thumbnail_url || null,
    status,
    error,
    fileType,
    isPreviewable: canPreview,
    currentPage,
    totalPages,
    zoomLevel,

    // Actions
    openPreview,
    closePreview,
    setCurrentPage,
    setTotalPages,
    setZoomLevel,
    generateThumbnail,
    downloadDocument,

    // Preview document
    previewDocument,
    isOpen: !!previewDocument,
  }
}

/**
 * Hook for getting a document's thumbnail
 */
export function useDocumentThumbnail(
  documentId: string | null,
  storagePath: string | null,
  size: ThumbnailSize = 'medium',
) {
  return useQuery({
    queryKey: ['thumbnail', documentId, size],
    queryFn: async () => {
      if (!documentId || !storagePath) return null

      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) throw new Error('Not authenticated')

      const response = await fetch(`${SUPABASE_URL}/functions/v1/document-preview`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          document_id: documentId,
          storage_path: storagePath,
          size,
        }),
      })

      if (!response.ok) {
        return null // Silently fail for thumbnails
      }

      return response.json() as Promise<ThumbnailResponse>
    },
    enabled: !!documentId && !!storagePath,
    staleTime: 60 * 60 * 1000, // 1 hour
    gcTime: 24 * 60 * 60 * 1000, // 24 hours
    retry: false, // Don't retry thumbnail generation
  })
}

/**
 * Hook for batch thumbnail loading
 */
export function useBatchThumbnails(
  documents: Array<{ id: string; file_path: string }>,
  size: ThumbnailSize = 'small',
) {
  return useQuery({
    queryKey: ['thumbnails-batch', documents.map((d) => d.id).join(','), size],
    queryFn: async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) throw new Error('Not authenticated')

      // Fetch thumbnails in parallel (max 5 concurrent)
      const results: Record<string, string | null> = {}
      const batchSize = 5

      for (let i = 0; i < documents.length; i += batchSize) {
        const batch = documents.slice(i, i + batchSize)
        const promises = batch.map(async (doc) => {
          try {
            const response = await fetch(`${SUPABASE_URL}/functions/v1/document-preview`, {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${session.access_token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                document_id: doc.id,
                storage_path: doc.file_path,
                size,
              }),
            })

            if (response.ok) {
              const data = await response.json()
              return { id: doc.id, url: data.thumbnail_url || data.preview_url }
            }
            return { id: doc.id, url: null }
          } catch {
            return { id: doc.id, url: null }
          }
        })

        const batchResults = await Promise.all(promises)
        batchResults.forEach(({ id, url }) => {
          results[id] = url
        })
      }

      return results
    },
    enabled: documents.length > 0,
    staleTime: 30 * 60 * 1000, // 30 minutes
  })
}
