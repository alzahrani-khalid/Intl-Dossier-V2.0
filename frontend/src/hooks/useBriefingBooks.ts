/**
 * useBriefingBooks Hook
 * Feature: briefing-book-generator
 *
 * TanStack Query hooks for briefing book CRUD operations and generation.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import type {
  BriefingBook,
  BriefingBookProgress,
  BriefingBookStatus,
  BriefingBookTemplate,
  CreateBriefingBookRequest,
  CreateBriefingBookResponse,
  ListBriefingBooksRequest,
  ListBriefingBooksResponse,
  UseBriefingBooksOptions,
  UseBriefingBooksReturn,
} from '@/types/briefing-book.types'

const EDGE_FUNCTION_URL = 'briefing-books'

// Query keys
export const briefingBooksKeys = {
  all: ['briefing-books'] as const,
  lists: () => [...briefingBooksKeys.all, 'list'] as const,
  list: (filters: ListBriefingBooksRequest) => [...briefingBooksKeys.lists(), filters] as const,
  detail: (id: string) => [...briefingBooksKeys.all, 'detail', id] as const,
  templates: () => [...briefingBooksKeys.all, 'templates'] as const,
}

/**
 * Fetch briefing books list
 */
async function fetchBriefingBooks(
  params: ListBriefingBooksRequest,
): Promise<ListBriefingBooksResponse> {
  const searchParams = new URLSearchParams()

  if (params.status) {
    searchParams.set('status', params.status)
  }
  if (params.limit) {
    searchParams.set('limit', params.limit.toString())
  }
  if (params.cursor) {
    searchParams.set('cursor', params.cursor)
  }

  const { data, error } = await supabase.functions.invoke(EDGE_FUNCTION_URL, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    body: { searchParams: searchParams.toString() },
  })

  if (error) {
    throw new Error(error.message)
  }

  return data
}

/**
 * Fetch a single briefing book
 */
async function fetchBriefingBook(id: string): Promise<BriefingBook> {
  const { data, error } = await supabase.functions.invoke(`${EDGE_FUNCTION_URL}/${id}`, {
    method: 'GET',
  })

  if (error) {
    throw new Error(error.message)
  }

  return data.data
}

/**
 * Fetch briefing book templates
 */
async function fetchTemplates(): Promise<BriefingBookTemplate[]> {
  const { data, error } = await supabase.functions.invoke(`${EDGE_FUNCTION_URL}/templates`, {
    method: 'GET',
  })

  if (error) {
    throw new Error(error.message)
  }

  return data.data
}

/**
 * Create and generate a new briefing book
 */
async function createBriefingBook(
  request: CreateBriefingBookRequest,
): Promise<CreateBriefingBookResponse> {
  const { data, error } = await supabase.functions.invoke(EDGE_FUNCTION_URL, {
    method: 'POST',
    body: request,
  })

  if (error) {
    throw new Error(error.message)
  }

  return data
}

/**
 * Delete a briefing book
 */
async function deleteBriefingBook(id: string): Promise<void> {
  const { error } = await supabase.functions.invoke(`${EDGE_FUNCTION_URL}/${id}`, {
    method: 'DELETE',
  })

  if (error) {
    throw new Error(error.message)
  }
}

/**
 * Main hook for briefing books
 */
export function useBriefingBooks(options: UseBriefingBooksOptions = {}): UseBriefingBooksReturn {
  const { t } = useTranslation('briefing-books')
  const queryClient = useQueryClient()
  const [progress, setProgress] = useState<BriefingBookProgress | null>(null)

  // List briefing books query
  const {
    data: listData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: briefingBooksKeys.lists(),
    queryFn: () => fetchBriefingBooks({}),
  })

  // Create mutation
  const createMutation = useMutation({
    mutationFn: createBriefingBook,
    onMutate: () => {
      setProgress({
        stage: 'initializing',
        progress: 0,
        message_en: 'Starting briefing book generation...',
        message_ar: 'جاري بدء إنشاء كتاب الإحاطة...',
      })
    },
    onSuccess: (response) => {
      setProgress({
        stage: 'complete',
        progress: 100,
        message_en: 'Briefing book generated successfully!',
        message_ar: 'تم إنشاء كتاب الإحاطة بنجاح!',
      })

      queryClient.invalidateQueries({ queryKey: briefingBooksKeys.lists() })
      toast.success(t('success.generated'))

      options.onCreateSuccess?.(response)

      // Reset progress after a short delay
      setTimeout(() => setProgress(null), 2000)
    },
    onError: (err) => {
      setProgress({
        stage: 'error',
        progress: 0,
        message_en: err instanceof Error ? err.message : 'Generation failed',
        message_ar: 'فشل الإنشاء',
      })

      toast.error(t('errors.generationFailed'))
      options.onError?.(err instanceof Error ? err : new Error('Unknown error'))

      // Reset progress after a short delay
      setTimeout(() => setProgress(null), 3000)
    },
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: deleteBriefingBook,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: briefingBooksKeys.lists() })
      toast.success(t('success.deleted'))
    },
    onError: () => {
      toast.error(t('errors.deleteFailed'))
    },
  })

  // Download handler
  const downloadBriefingBook = useCallback(
    async (id: string) => {
      try {
        const book = await fetchBriefingBook(id)

        if (!book.fileUrl) {
          throw new Error('No file available')
        }

        // Open the file URL in a new tab or trigger download
        window.open(book.fileUrl, '_blank')
        toast.success(t('success.downloaded'))
      } catch (err) {
        toast.error(t('errors.downloadFailed'))
        throw err
      }
    },
    [t],
  )

  return {
    briefingBooks: listData?.data ?? [],
    isLoading,
    error: error instanceof Error ? error : null,
    createBriefingBook: createMutation.mutateAsync,
    deleteBriefingBook: deleteMutation.mutateAsync,
    downloadBriefingBook,
    progress,
    isGenerating: createMutation.isPending,
    refresh: refetch,
  }
}

/**
 * Hook for fetching briefing book templates
 */
export function useBriefingBookTemplates() {
  return useQuery({
    queryKey: briefingBooksKeys.templates(),
    queryFn: fetchTemplates,
  })
}

/**
 * Hook for fetching a single briefing book
 */
export function useBriefingBook(id: string | undefined) {
  return useQuery({
    queryKey: briefingBooksKeys.detail(id!),
    queryFn: () => fetchBriefingBook(id!),
    enabled: !!id,
  })
}

/**
 * Hook for listing briefing books with filters
 */
export function useBriefingBooksList(filters: ListBriefingBooksRequest = {}) {
  return useQuery({
    queryKey: briefingBooksKeys.list(filters),
    queryFn: () => fetchBriefingBooks(filters),
  })
}
