/**
 * Document OCR Processing Hooks
 * @module hooks/useDocumentOCR
 * @feature document-ocr-indexing
 *
 * React hooks for OCR processing with bilingual support (Arabic and English),
 * status monitoring, and batch processing capabilities.
 *
 * @description
 * This module provides hooks for OCR text extraction:
 * - Trigger OCR processing for uploaded documents
 * - Monitor OCR processing status with polling
 * - Support for multiple OCR engines (Tesseract, Google Vision, PDF native text)
 * - Bilingual text extraction (Arabic and English)
 * - Per-page text extraction for multi-page documents
 * - Confidence scoring for OCR accuracy
 * - Batch processing for multiple documents
 * - Automatic cache invalidation on completion
 *
 * OCR Methods (in order of preference):
 * - native_text: Extract native text from PDFs (fastest, highest accuracy)
 * - pdf_extract: PDF.js-based extraction
 * - google_vision: Cloud OCR for complex documents (optional)
 * - tesseract: Local OCR for images and scanned PDFs
 *
 * @example
 * // Check OCR status
 * const { data: status } = useDocumentOCRStatus(documentId, 'documents');
 * if (status?.status === 'completed') {
 *   console.log('Extracted text:', status.result?.text_en);
 * }
 *
 * @example
 * // Trigger OCR processing
 * const { mutate: processOCR, isPending } = useProcessDocumentOCR();
 * processOCR({
 *   document_id: 'doc-uuid',
 *   document_table: 'documents',
 *   use_cloud_ocr: true, // Use Google Vision if available
 * });
 *
 * @example
 * // Batch process multiple documents
 * const { mutate: batchProcess } = useBatchProcessOCR();
 * batchProcess([
 *   { document_id: 'doc1', document_table: 'documents' },
 *   { document_id: 'doc2', document_table: 'documents' },
 * ]);
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

// Types
export type OCRStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'skipped'
  | 'not_processed'
export type OCRMethod = 'tesseract' | 'google_vision' | 'pdf_extract' | 'native_text'

export interface OCRResult {
  text_en: string
  text_ar: string
  confidence: number
  languages: string[]
  method: OCRMethod
}

export interface OCRStatusResponse {
  document_id: string
  status: OCRStatus
  result: OCRResult | null
}

export interface ProcessOCRRequest {
  document_id: string
  document_table: 'attachments' | 'documents'
  storage_path?: string
  mime_type?: string
  use_cloud_ocr?: boolean
}

export interface ProcessOCRResponse {
  success: boolean
  document_id: string
  status: 'completed' | 'failed' | 'processing' | 'skipped'
  result?: {
    text_en: string
    text_ar: string
    raw_text: string
    confidence: number
    languages: string[]
    page_count: number
    page_texts: Array<{ page: number; text: string; confidence: number }>
    method: OCRMethod
    processing_time_ms: number
  }
  error?: string
}

// Get Supabase URL
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL

/**
 * Get authorization headers with current user's JWT token
 */
async function getAuthHeaders(): Promise<Record<string, string>> {
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    throw new Error('Not authenticated')
  }

  return {
    Authorization: `Bearer ${session.access_token}`,
    'Content-Type': 'application/json',
  }
}

/**
 * Fetch OCR status for a document
 */
async function fetchOCRStatus(
  documentId: string,
  documentTable: 'attachments' | 'documents',
): Promise<OCRStatusResponse> {
  const headers = await getAuthHeaders()

  const response = await fetch(
    `${supabaseUrl}/functions/v1/document-ocr-process?document_id=${documentId}&document_table=${documentTable}`,
    {
      method: 'GET',
      headers,
    },
  )

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to fetch OCR status')
  }

  return response.json()
}

/**
 * Process OCR for a document
 */
async function processOCR(request: ProcessOCRRequest): Promise<ProcessOCRResponse> {
  const headers = await getAuthHeaders()

  const response = await fetch(`${supabaseUrl}/functions/v1/document-ocr-process`, {
    method: 'POST',
    headers,
    body: JSON.stringify(request),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'OCR processing failed')
  }

  return response.json()
}

/**
 * Hook to get OCR status for a document
 *
 * @description
 * Fetches the current OCR processing status for a document. Supports polling
 * via refetchInterval to monitor ongoing OCR processing. Returns status
 * (pending, processing, completed, failed, skipped) and extracted text if available.
 *
 * @param documentId - Document UUID to check status for (undefined disables query)
 * @param documentTable - Table name ('documents' or 'attachments')
 * @param options - Optional configuration (enabled flag, refetch interval for polling)
 * @returns TanStack Query result with OCR status and extracted text
 *
 * @example
 * // Check status once
 * const { data: ocrStatus } = useDocumentOCRStatus(documentId);
 * if (ocrStatus?.status === 'completed') {
 *   console.log('English text:', ocrStatus.result?.text_en);
 *   console.log('Arabic text:', ocrStatus.result?.text_ar);
 *   console.log('Confidence:', ocrStatus.result?.confidence);
 * }
 *
 * @example
 * // Poll status every 5 seconds during processing
 * const { data } = useDocumentOCRStatus(documentId, 'documents', {
 *   refetchInterval: 5000, // Poll every 5 seconds
 * });
 */
export function useDocumentOCRStatus(
  documentId: string | undefined,
  documentTable: 'attachments' | 'documents' = 'documents',
  options?: {
    enabled?: boolean
    refetchInterval?: number | false
  },
) {
  return useQuery({
    queryKey: ['document-ocr-status', documentId, documentTable],
    queryFn: () => fetchOCRStatus(documentId!, documentTable),
    enabled: !!documentId && options?.enabled !== false,
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: options?.refetchInterval ?? false,
  })
}

/**
 * Hook to process OCR for a document
 *
 * @description
 * Triggers OCR processing for a document. Supports multiple OCR methods
 * (native text, PDF extraction, Tesseract, Google Vision). Automatically
 * invalidates OCR status and search queries on completion.
 *
 * @returns TanStack Mutation result for OCR processing
 *
 * @example
 * // Basic OCR processing
 * const { mutate: processOCR, isPending, error } = useProcessDocumentOCR();
 * processOCR({
 *   document_id: 'doc-uuid',
 *   document_table: 'documents',
 * });
 *
 * @example
 * // Use cloud OCR (Google Vision) for better accuracy
 * const { mutate } = useProcessDocumentOCR();
 * mutate({
 *   document_id: 'doc-uuid',
 *   document_table: 'documents',
 *   use_cloud_ocr: true, // Enable Google Vision if configured
 * });
 *
 * @example
 * // Provide file metadata if not in database
 * const { mutate } = useProcessDocumentOCR();
 * mutate({
 *   document_id: 'doc-uuid',
 *   document_table: 'attachments',
 *   storage_path: 'uploads/scan.pdf',
 *   mime_type: 'application/pdf',
 * });
 */
export function useProcessDocumentOCR() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: processOCR,
    onSuccess: (data) => {
      // Invalidate OCR status query
      queryClient.invalidateQueries({
        queryKey: ['document-ocr-status', data.document_id],
      })

      // Invalidate document search queries
      queryClient.invalidateQueries({
        queryKey: ['document-content-search'],
      })
    },
  })
}

/**
 * Hook for batch OCR processing of multiple documents
 */
export function useBatchProcessOCR() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (requests: ProcessOCRRequest[]) => {
      const results = await Promise.allSettled(requests.map(processOCR))

      return results.map((result, index) => ({
        request: requests[index],
        success: result.status === 'fulfilled',
        response: result.status === 'fulfilled' ? result.value : undefined,
        error: result.status === 'rejected' ? result.reason?.message : undefined,
      }))
    },
    onSuccess: () => {
      // Invalidate all OCR-related queries
      queryClient.invalidateQueries({
        queryKey: ['document-ocr-status'],
      })
      queryClient.invalidateQueries({
        queryKey: ['document-content-search'],
      })
    },
  })
}

/**
 * Hook to poll OCR status until completion
 */
export function useDocumentOCRPolling(
  documentId: string | undefined,
  documentTable: 'attachments' | 'documents' = 'documents',
  options?: {
    enabled?: boolean
    pollInterval?: number
    onComplete?: (result: OCRStatusResponse) => void
    onError?: (error: Error) => void
  },
) {
  const { data, ...rest } = useQuery({
    queryKey: ['document-ocr-status', documentId, documentTable],
    queryFn: () => fetchOCRStatus(documentId!, documentTable),
    enabled: !!documentId && options?.enabled !== false,
    refetchInterval: (query) => {
      const data = query.state.data as OCRStatusResponse | undefined
      // Stop polling if completed, failed, or skipped
      if (data?.status === 'completed' || data?.status === 'failed' || data?.status === 'skipped') {
        if (data.status === 'completed' && options?.onComplete) {
          options.onComplete(data)
        }
        return false
      }
      return options?.pollInterval ?? 2000 // Default 2 second polling
    },
  })

  return { data, ...rest }
}

export default {
  useDocumentOCRStatus,
  useProcessDocumentOCR,
  useBatchProcessOCR,
  useDocumentOCRPolling,
}
