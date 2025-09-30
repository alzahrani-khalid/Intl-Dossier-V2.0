import { useMutation, useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

// Types based on API spec
export interface ExtractionResult {
  mode: 'sync' | 'async';
  decisions?: Array<{
    description: string;
    rationale?: string;
    decision_maker: string;
    decision_date: string;
    confidence: number;
  }>;
  commitments?: Array<{
    description: string;
    owner: string;
    due_date: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
    confidence: number;
  }>;
  risks?: Array<{
    description: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    likelihood: 'unlikely' | 'possible' | 'likely' | 'certain';
    mitigation_strategy?: string;
    confidence: number;
  }>;
}

export interface ExtractRequest {
  file: File;
  language?: 'en' | 'ar';
  mode?: 'sync' | 'async' | 'auto';
}

export interface AsyncJobResponse {
  job_id: string;
  status: 'processing';
  estimated_time: number;
}

export interface JobStatusResponse {
  status: 'processing' | 'completed' | 'failed';
  progress?: number;
  result?: ExtractionResult;
  error?: string;
}

// Extract data from meeting minutes (sync or async)
export function useAIExtract() {
  return useMutation<ExtractionResult | AsyncJobResponse, Error, ExtractRequest>({
    mutationFn: async ({ file, language = 'en', mode = 'auto' }) => {
      // Create FormData for multipart upload
      const formData = new FormData();
      formData.append('file', file);
      formData.append('language', language);
      formData.append('mode', mode);

      const { data, error } = await supabase.functions.invoke('ai-extract', {
        body: formData,
      });

      if (error) {
        // Graceful fallback if AI service unavailable
        if (error.message?.includes('unavailable') || error.message?.includes('timeout')) {
          throw new Error(
            'AI extraction service is temporarily unavailable. Please fill in the form manually or try again later.'
          );
        }
        throw error;
      }

      return data as ExtractionResult | AsyncJobResponse;
    },
  });
}

// Poll async extraction job status
export function useExtractionStatus(jobId: string | undefined, options?: { enabled?: boolean; refetchInterval?: number }) {
  return useQuery<JobStatusResponse>({
    queryKey: ['extraction-status', jobId],
    queryFn: async () => {
      if (!jobId) throw new Error('Job ID is required');

      const { data, error } = await supabase.functions.invoke('ai-extract-status', {
        body: { job_id: jobId },
      });

      if (error) throw error;
      return data as JobStatusResponse;
    },
    enabled: !!jobId && (options?.enabled ?? true),
    refetchInterval: (data) => {
      // Stop polling when completed or failed
      if (data?.status === 'completed' || data?.status === 'failed') {
        return false;
      }
      // Poll every 2 seconds while processing
      return options?.refetchInterval ?? 2000;
    },
  });
}

// Helper hook to check if extraction result should be populated
export function useFilterLowConfidence(result: ExtractionResult | undefined, threshold = 0.5) {
  if (!result) return { decisions: [], commitments: [], risks: [] };

  return {
    decisions: result.decisions?.filter((d) => d.confidence >= threshold) ?? [],
    commitments: result.commitments?.filter((c) => c.confidence >= threshold) ?? [],
    risks: result.risks?.filter((r) => r.confidence >= threshold) ?? [],
    lowConfidenceCount: {
      decisions: result.decisions?.filter((d) => d.confidence < threshold).length ?? 0,
      commitments: result.commitments?.filter((c) => c.confidence < threshold).length ?? 0,
      risks: result.risks?.filter((r) => r.confidence < threshold).length ?? 0,
    },
  };
}

// Helper to estimate processing time based on file size
export function estimateProcessingTime(file: File): { mode: 'sync' | 'async'; estimatedSeconds: number } {
  const fileSizeKB = file.size / 1024;

  if (fileSizeKB < 50) {
    // Small files: sync mode, ~2-4 seconds
    return { mode: 'sync', estimatedSeconds: 3 };
  } else if (fileSizeKB < 500) {
    // Medium files: could be sync or async, ~4-8 seconds
    return { mode: 'async', estimatedSeconds: 6 };
  } else {
    // Large files: async mode, ~15-30 seconds
    const estimatedSeconds = Math.min(Math.floor((fileSizeKB / 100) * 1.5), 30);
    return { mode: 'async', estimatedSeconds };
  }
}
