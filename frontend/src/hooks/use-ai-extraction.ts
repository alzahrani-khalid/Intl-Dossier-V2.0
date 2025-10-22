/**
 * AI Extraction Hooks
 *
 * TanStack Query hooks for AI extraction operations
 * Handles sync extraction, async extraction, and status polling
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
 * Hook for synchronous AI extraction (<5s, <500KB documents)
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
 * Hook for asynchronous AI extraction (>5s, large documents)
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
 * Hook for polling extraction status (for async jobs)
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
 * Combined hook for handling both sync and async extraction with automatic fallback
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
