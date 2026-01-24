/**
 * Briefing Books Hooks
 * @module hooks/useBriefingBooks
 * @feature briefing-book-generator
 *
 * TanStack Query hooks for briefing book CRUD operations, generation, and template management.
 *
 * @description
 * This module provides a comprehensive set of React hooks for managing briefing books:
 * - Query hooks for fetching briefing books, templates, and lists with filters
 * - Mutation hooks for create and delete operations with progress tracking
 * - Download handlers for generated briefing book files
 * - Real-time progress updates during generation
 * - Automatic cache invalidation and toast notifications
 *
 * @example
 * // Fetch all briefing books
 * const { briefingBooks, isLoading } = useBriefingBooks();
 *
 * @example
 * // Create a new briefing book with progress tracking
 * const { createBriefingBook, progress, isGenerating } = useBriefingBooks();
 * await createBriefingBook({
 *   template_id: 'template-uuid',
 *   engagement_id: 'engagement-uuid',
 *   language: 'en'
 * });
 *
 * @example
 * // Fetch a single briefing book
 * const { data: book } = useBriefingBook('book-uuid');
 *
 * @example
 * // Fetch available templates
 * const { data: templates } = useBriefingBookTemplates();
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

/**
 * Query Keys Factory for briefing book-related queries
 *
 * @description
 * Provides a hierarchical key structure for TanStack Query cache management.
 * Keys are structured to enable granular cache invalidation.
 *
 * @example
 * // Invalidate all briefing book queries
 * queryClient.invalidateQueries({ queryKey: briefingBooksKeys.all });
 *
 * @example
 * // Invalidate only list queries
 * queryClient.invalidateQueries({ queryKey: briefingBooksKeys.lists() });
 *
 * @example
 * // Invalidate specific briefing book detail
 * queryClient.invalidateQueries({ queryKey: briefingBooksKeys.detail('uuid') });
 */
export const briefingBooksKeys = {
  all: ['briefing-books'] as const,
  lists: () => [...briefingBooksKeys.all, 'list'] as const,
  list: (filters: ListBriefingBooksRequest) => [...briefingBooksKeys.lists(), filters] as const,
  detail: (id: string) => [...briefingBooksKeys.all, 'detail', id] as const,
  templates: () => [...briefingBooksKeys.all, 'templates'] as const,
}

/**
 * Fetch briefing books list from Supabase Edge Function
 *
 * @description
 * Calls the briefing-books edge function to retrieve a paginated list of briefing books
 * with optional filtering by status, limit, and cursor-based pagination.
 *
 * @param params - List request parameters (status, limit, cursor)
 * @returns Promise resolving to paginated briefing books list
 * @throws Error if the edge function call fails
 *
 * @internal
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
 * Fetch a single briefing book by ID from Supabase Edge Function
 *
 * @description
 * Retrieves detailed information for a specific briefing book including metadata,
 * file URL, and generation status.
 *
 * @param id - The unique identifier (UUID) of the briefing book
 * @returns Promise resolving to the briefing book entity
 * @throws Error if the edge function call fails or book not found
 *
 * @internal
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
 * Fetch available briefing book templates from Supabase Edge Function
 *
 * @description
 * Retrieves all available briefing book templates that can be used for generation.
 * Templates define the structure, sections, and formatting of generated briefing books.
 *
 * @returns Promise resolving to array of available templates
 * @throws Error if the edge function call fails
 *
 * @internal
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
 * Create and generate a new briefing book via Supabase Edge Function
 *
 * @description
 * Initiates the generation of a new briefing book based on the provided template,
 * engagement, and language. This is an async operation that may take several seconds
 * to complete depending on the complexity of the briefing book.
 *
 * @param request - Creation request with template_id, engagement_id, and language
 * @returns Promise resolving to the created briefing book response
 * @throws Error if the edge function call fails or generation fails
 *
 * @internal
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
 * Delete a briefing book via Supabase Edge Function
 *
 * @description
 * Permanently deletes a briefing book and its associated file from storage.
 * This operation cannot be undone.
 *
 * @param id - The unique identifier (UUID) of the briefing book to delete
 * @returns Promise resolving when deletion is complete
 * @throws Error if the edge function call fails or book not found
 *
 * @internal
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
 * Main hook for briefing book CRUD operations and generation
 *
 * @description
 * Provides a comprehensive interface for managing briefing books with real-time
 * progress tracking during generation. Includes query hooks for listing books,
 * mutation hooks for create/delete operations, and download functionality.
 *
 * Features:
 * - Automatic cache invalidation on mutations
 * - Real-time progress updates during generation (0-100%)
 * - Toast notifications for success/error states
 * - Bilingual progress messages (EN/AR)
 * - Download handler for generated files
 *
 * @param options - Optional callbacks for create success and error handling
 * @returns Hook interface with briefing books data and mutation functions
 *
 * @example
 * // Basic usage
 * const { briefingBooks, isLoading, createBriefingBook } = useBriefingBooks();
 *
 * @example
 * // With progress tracking
 * const { createBriefingBook, progress, isGenerating } = useBriefingBooks();
 * await createBriefingBook({
 *   template_id: 'uuid',
 *   engagement_id: 'uuid',
 *   language: 'en'
 * });
 * // progress: { stage: 'generating', progress: 50, message_en: '...', message_ar: '...' }
 *
 * @example
 * // With callbacks
 * const { createBriefingBook } = useBriefingBooks({
 *   onCreateSuccess: (response) => {
 *     console.log('Created:', response.data.id);
 *   },
 *   onError: (error) => {
 *     console.error('Failed:', error);
 *   }
 * });
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
 * Hook to fetch available briefing book templates
 *
 * @description
 * Fetches all available briefing book templates that can be used for generation.
 * Results are automatically cached by TanStack Query.
 *
 * @returns TanStack Query result with templates array
 *
 * @example
 * // Fetch available templates
 * const { data: templates, isLoading } = useBriefingBookTemplates();
 *
 * @example
 * // Display templates in a select dropdown
 * const { data: templates } = useBriefingBookTemplates();
 * {templates?.map(t => (
 *   <option key={t.id} value={t.id}>{t.name_en}</option>
 * ))}
 */
export function useBriefingBookTemplates() {
  return useQuery({
    queryKey: briefingBooksKeys.templates(),
    queryFn: fetchTemplates,
  })
}

/**
 * Hook to fetch a single briefing book by ID
 *
 * @description
 * Fetches detailed information for a specific briefing book. The query is automatically
 * cached and can be invalidated using briefingBooksKeys.detail(id).
 * Query is disabled when id is undefined.
 *
 * @param id - The unique identifier (UUID) of the briefing book to fetch
 * @returns TanStack Query result with briefing book data
 *
 * @example
 * // Fetch a specific briefing book
 * const { data: book, isLoading } = useBriefingBook('uuid-123');
 *
 * @example
 * // Conditional fetching (enabled only when id exists)
 * const { data: book } = useBriefingBook(bookId); // bookId can be undefined
 * // Query is automatically disabled when bookId is undefined
 */
export function useBriefingBook(id: string | undefined) {
  return useQuery({
    queryKey: briefingBooksKeys.detail(id!),
    queryFn: () => fetchBriefingBook(id!),
    enabled: !!id,
  })
}

/**
 * Hook to fetch paginated list of briefing books with filters
 *
 * @description
 * Fetches a paginated list of briefing books with optional filtering by status,
 * limit, and cursor-based pagination. Results are cached based on filter parameters.
 *
 * @param filters - Optional filters (status, limit, cursor)
 * @returns TanStack Query result with paginated briefing books list
 *
 * @example
 * // Fetch all briefing books
 * const { data } = useBriefingBooksList();
 *
 * @example
 * // Fetch with status filter
 * const { data } = useBriefingBooksList({ status: 'completed', limit: 10 });
 *
 * @example
 * // Cursor-based pagination
 * const { data: page1 } = useBriefingBooksList({ limit: 20 });
 * const { data: page2 } = useBriefingBooksList({
 *   limit: 20,
 *   cursor: page1?.next_cursor
 * });
 */
export function useBriefingBooksList(filters: ListBriefingBooksRequest = {}) {
  return useQuery({
    queryKey: briefingBooksKeys.list(filters),
    queryFn: () => fetchBriefingBooks(filters),
  })
}
