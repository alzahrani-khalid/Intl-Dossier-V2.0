/**
 * AI Extraction Hooks
 * @module hooks/use-ai-extraction
 * @feature ai-extraction
 *
 * TanStack Query hooks for AI-powered document extraction with automatic sync/async routing,
 * status polling, and fallback handling.
 *
 * @description
 * This module provides hooks for extracting structured data from documents using AI:
 * - Synchronous extraction for small documents (<500KB, <5s processing)
 * - Asynchronous extraction with job queuing for large documents
 * - Automatic status polling for async jobs (every 2 seconds)
 * - Combined hook with automatic sync/async routing based on document size
 * - Extraction of decisions, commitments, risks, and follow-up actions
 * - Support for text, PDF, and DOCX documents
 * - Multi-language support (en, ar)
 *
 * The extraction hooks parse documents and return structured data including:
 * - Decisions with rationale and confidence scores
 * - Commitments with owners, due dates, and priorities
 * - Risks with severity, likelihood, and mitigation strategies
 * - Follow-up actions
 *
 * @example
 * // Synchronous extraction for small documents
 * const { mutate } = useExtractSync();
 * mutate({
 *   document_content: 'Meeting minutes text...',
 *   document_type: 'text/plain',
 *   language: 'en'
 * });
 *
 * @example
 * // Automatic sync/async routing
 * const { extract, isLoading } = useAIExtraction();
 * const result = await extract({
 *   document_content: largeDocumentText,
 *   document_type: 'application/pdf',
 *   language: 'ar'
 * });
 *
 * @example
 * // Async extraction with status polling
 * const asyncMutation = useExtractAsync();
 * const { job_id } = await asyncMutation.mutateAsync(request);
 * const { data: status } = useExtractionStatus(job_id);
 * // Automatically polls every 2s until completed/failed
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSupabaseClient } from '@/lib/supabase';

interface ExtractionRequest {
  document_content: string;
  document_type: 'text/plain' | 'application/pdf' | 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  language: 'en' | 'ar';
  dossier_id?: string;
}

interface ExtractionResult {
  extraction_id: string;
  decisions: Array<{
    description: string;
    rationale: string | null;
    decision_maker: string;
    confidence_score: number;
  }>;
  commitments: Array<{
    description: string;
    owner_name: string;
    due_date: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
    confidence_score: number;
  }>;
  risks: Array<{
    description: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    likelihood: 'rare' | 'unlikely' | 'possible' | 'likely' | 'certain';
    mitigation_strategy?: string;
    confidence_score: number;
  }>;
  follow_up_actions: Array<{
    description: string;
    confidence_score: number;
  }>;
  processing_time_ms?: number;
}

interface AsyncExtractionResponse {
  job_id: string;
  status: 'queued';
  estimated_completion_time: string;
  estimated_time_ms: number;
}

interface ExtractionStatusResponse {
  job_id: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  created_at: string;
  estimated_completion_time?: string;
  progress_percent?: number;
  current_step?: string;
  result?: ExtractionResult;
  completed_at?: string;
  processing_time_ms?: number;
  error?: string;
  failed_at?: string;
}

/**
 * Hook for synchronous AI extraction
 *
 * @description
 * Performs immediate AI extraction for small documents (<500KB content, <5s processing).
 * Returns results directly without job queuing. Best for:
 * - Text documents
 * - Meeting minutes
 * - Short PDFs
 * - Real-time extraction needs
 *
 * The extraction returns:
 * - Decisions with description, rationale, decision maker, confidence
 * - Commitments with description, owner, due date, priority, confidence
 * - Risks with severity, likelihood, mitigation strategy, confidence
 * - Follow-up actions with confidence scores
 * - Processing time in milliseconds
 *
 * Automatically caches results by extraction_id for quick re-access.
 *
 * @returns TanStack Mutation for synchronous extraction
 *
 * @example
 * const extractMutation = useExtractSync();
 *
 * const result = await extractMutation.mutateAsync({
 *   document_content: 'Meeting minutes: Decision to increase budget by 10%...',
 *   document_type: 'text/plain',
 *   language: 'en',
 *   dossier_id: 'optional-dossier-uuid'
 * });
 *
 * console.log('Decisions:', result.decisions);
 * console.log('Commitments:', result.commitments);
 *
 * @example
 * // With loading and error states
 * const { mutate, isPending, error } = useExtractSync();
 *
 * const handleExtract = () => {
 *   mutate({
 *     document_content: documentText,
 *     document_type: 'text/plain',
 *     language: 'en'
 *   });
 * };
 */
export function useExtractSync() {
  const supabase = useSupabaseClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: ExtractionRequest): Promise<ExtractionResult> => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Unauthorized');

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-extraction/extract-sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'AI extraction failed');
      }

      const data = await response.json();
      return data;
    },
    onSuccess: (data) => {
      // Cache extraction result
      queryClient.setQueryData(['ai-extraction', data.extraction_id], data);
    }
  });
}

/**
 * Hook for asynchronous AI extraction with job queuing
 *
 * @description
 * Queues an AI extraction job for large documents (>500KB or expected >5s processing).
 * Returns a job_id for status polling. Best for:
 * - Large PDFs
 * - Multi-page documents
 * - Complex DOCX files
 * - Batch processing
 *
 * The async extraction workflow:
 * 1. Submit extraction request
 * 2. Receive job_id and estimated completion time
 * 3. Poll status using useExtractionStatus hook
 * 4. Retrieve results when job completes
 *
 * Automatically triggers status query invalidation to start polling.
 *
 * @returns TanStack Mutation for asynchronous extraction
 *
 * @example
 * const extractAsyncMutation = useExtractAsync();
 *
 * const { job_id, estimated_time_ms } = await extractAsyncMutation.mutateAsync({
 *   document_content: largePdfContent,
 *   document_type: 'application/pdf',
 *   language: 'ar',
 *   dossier_id: 'dossier-uuid'
 * });
 *
 * console.log(`Extraction queued, estimated ${estimated_time_ms}ms`);
 *
 * @example
 * // Poll for completion
 * const asyncMutation = useExtractAsync();
 * const [jobId, setJobId] = useState<string | null>(null);
 *
 * const handleExtract = async () => {
 *   const result = await asyncMutation.mutateAsync(request);
 *   setJobId(result.job_id);
 * };
 *
 * const { data: status } = useExtractionStatus(jobId);
 * // Polls automatically until completed/failed
 */
export function useExtractAsync() {
  const supabase = useSupabaseClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: ExtractionRequest): Promise<AsyncExtractionResponse> => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Unauthorized');

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-extraction/extract-async`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to queue AI extraction');
      }

      const data = await response.json();
      return data;
    },
    onSuccess: (data) => {
      // Invalidate to trigger polling
      queryClient.invalidateQueries({ queryKey: ['ai-extraction-status', data.job_id] });
    }
  });
}

/**
 * Hook for polling extraction job status
 *
 * @description
 * Automatically polls the status of an async extraction job every 2 seconds until
 * completion or failure. Returns:
 * - Current status (queued, processing, completed, failed)
 * - Progress percentage (0-100)
 * - Current processing step
 * - Extraction results (when completed)
 * - Error message (when failed)
 * - Processing time
 *
 * Polling stops automatically when job reaches completed or failed status.
 * Query is disabled if jobId is null.
 *
 * @param jobId - The job ID from useExtractAsync
 * @param options - Polling configuration options
 * @param options.enabled - Whether to enable polling (default: true if jobId exists)
 * @param options.refetchInterval - Custom polling interval in ms (default: 2000)
 * @returns TanStack Query result with extraction status
 *
 * @example
 * const { data: status, isLoading } = useExtractionStatus(jobId);
 *
 * if (status?.status === 'processing') {
 *   console.log(`Progress: ${status.progress_percent}%`);
 *   console.log(`Step: ${status.current_step}`);
 * }
 *
 * if (status?.status === 'completed') {
 *   console.log('Results:', status.result);
 * }
 *
 * if (status?.status === 'failed') {
 *   console.error('Error:', status.error);
 * }
 *
 * @example
 * // With custom polling interval
 * const { data } = useExtractionStatus(jobId, {
 *   refetchInterval: 5000 // Poll every 5 seconds
 * });
 *
 * @example
 * // Conditional polling
 * const { data } = useExtractionStatus(jobId, {
 *   enabled: userWantsToTrackProgress
 * });
 */
export function useExtractionStatus(jobId: string | null, options?: { enabled?: boolean; refetchInterval?: number }) {
  const supabase = useSupabaseClient();

  return useQuery({
    queryKey: ['ai-extraction-status', jobId],
    queryFn: async (): Promise<ExtractionStatusResponse> => {
      if (!jobId) throw new Error('No job ID provided');

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Unauthorized');

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-extraction/extraction-status/${jobId}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to get extraction status');
      }

      const data = await response.json();
      return data;
    },
    enabled: options?.enabled !== false && !!jobId,
    refetchInterval: (data) => {
      // Stop polling when completed or failed
      if (data?.status === 'completed' || data?.status === 'failed') {
        return false;
      }
      // Poll every 2 seconds for queued/processing jobs
      return options?.refetchInterval || 2000;
    },
    retry: 3
  });
}

/**
 * Combined hook for automatic sync/async extraction routing
 *
 * @description
 * Intelligent hook that automatically chooses between sync and async extraction
 * based on document size and user preference:
 * - Documents <500KB → sync extraction (immediate response)
 * - Documents >500KB → async extraction (job queuing + polling)
 * - Timeout fallback: If sync times out, automatically retries with async
 *
 * This hook provides a simple API that handles complexity internally:
 * - Automatic size detection
 * - Smart routing
 * - Timeout fallback
 * - Unified error handling
 * - Combined loading states
 *
 * @returns Extraction control object with extract function and state
 *
 * @example
 * const { extract, isLoading, error, reset } = useAIExtraction();
 *
 * const handleExtract = async () => {
 *   const result = await extract({
 *     document_content: documentText,
 *     document_type: 'text/plain',
 *     language: 'en'
 *   });
 *
 *   // result is ExtractionResult for sync, AsyncExtractionResponse for async
 *   if ('extraction_id' in result) {
 *     // Sync extraction completed
 *     console.log('Decisions:', result.decisions);
 *   } else {
 *     // Async extraction queued
 *     console.log('Job ID:', result.job_id);
 *   }
 * };
 *
 * @example
 * // Force async extraction
 * const { extract } = useAIExtraction();
 *
 * const result = await extract(request, true); // forceAsync = true
 *
 * @example
 * // With error handling
 * const { extract, error, reset } = useAIExtraction();
 *
 * const handleRetry = () => {
 *   reset(); // Clear error state
 *   extract(request);
 * };
 */
export function useAIExtraction() {
  const syncMutation = useExtractSync();
  const asyncMutation = useExtractAsync();

  const extract = async (request: ExtractionRequest, forceAsync = false) => {
    const contentSizeKB = new TextEncoder().encode(request.document_content).length / 1024;

    // Use async for large documents or if forced
    if (forceAsync || contentSizeKB > 500) {
      return asyncMutation.mutateAsync(request);
    }

    // Try sync first, fall back to async if timeout
    try {
      return await syncMutation.mutateAsync(request);
    } catch (error) {
      // If sync fails due to timeout (408) or complexity, try async
      if (error instanceof Error && error.message.includes('timeout')) {
        return asyncMutation.mutateAsync(request);
      }
      throw error;
    }
  };

  return {
    extract,
    isLoading: syncMutation.isPending || asyncMutation.isPending,
    error: syncMutation.error || asyncMutation.error,
    reset: () => {
      syncMutation.reset();
      asyncMutation.reset();
    }
  };
}
