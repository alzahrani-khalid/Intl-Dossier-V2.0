/**
 * Briefing Pack Status Polling Hook
 * @module hooks/useBriefingPackStatus
 * @feature briefing-pack-generator
 * @task T041
 *
 * TanStack Query hook for polling briefing pack generation job status with automatic refetch.
 *
 * @description
 * This hook provides real-time status tracking for asynchronous briefing pack generation jobs.
 * Features:
 * - Automatic polling every 2 seconds while job is pending/generating
 * - Stops polling when job completes or fails
 * - Optional success/failure callbacks
 * - Progress tracking (0-100%)
 * - Estimated completion time
 * - Retry count metadata
 *
 * @example
 * // Basic usage with callbacks
 * const { status, progress, briefingPack } = useBriefingPackStatus({
 *   jobId: 'job-uuid',
 *   onCompleted: (pack) => {
 *     window.open(pack.file_url, '_blank');
 *   },
 *   onFailed: (error) => {
 *     toast.error(`Generation failed: ${error}`);
 *   }
 * });
 *
 * @example
 * // Conditional polling
 * const { status, isPolling } = useBriefingPackStatus({
 *   jobId: jobId,
 *   enabled: !!jobId, // Only poll when jobId exists
 * });
 * // isPolling is true when status is 'pending' or 'generating'
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

/**
 * Generated briefing pack entity
 *
 * @description
 * Represents a successfully generated briefing pack with metadata and file URL.
 */
export interface BriefingPack {
  id: string;
  engagement_id: string;
  position_ids: string[];
  language: 'en' | 'ar';
  generated_by: string;
  generated_at: string;
  file_url: string;
  file_size_bytes: number;
  expires_at?: string;
  metadata?: {
    page_count?: number;
    template_version?: string;
    translations_performed?: number;
  };
}

/**
 * Briefing pack job status response
 *
 * @description
 * Status information for an ongoing or completed briefing pack generation job.
 */
export interface BriefingPackJobStatus {
  /** Current job status */
  status: 'pending' | 'generating' | 'completed' | 'failed';
  /** Generation progress (0-100) */
  progress?: number;
  /** Error message if status is 'failed' */
  error?: string;
  /** Generated briefing pack if status is 'completed' */
  briefing_pack?: BriefingPack;
  /** Estimated seconds until completion */
  estimated_completion_seconds?: number;
  /** Additional metadata (retry count, etc.) */
  metadata?: {
    retry_count?: number;
  };
}

/**
 * Hook options for useBriefingPackStatus
 *
 * @description
 * Configuration options for briefing pack status polling including callbacks.
 */
export interface UseBriefingPackStatusOptions {
  /** The job ID to poll for status */
  jobId: string;
  /** Whether polling is enabled (default: true) */
  enabled?: boolean;
  /** Callback invoked when generation completes successfully */
  onCompleted?: (briefingPack: BriefingPack) => void;
  /** Callback invoked when generation fails */
  onFailed?: (error: string) => void;
}

/**
 * Fetch briefing pack job status from Supabase Edge Function
 *
 * @description
 * Queries the briefing-packs edge function to check the current status of a generation job.
 * Requires authentication via Supabase session token.
 *
 * @param jobId - The unique job identifier returned from useGenerateBriefingPack
 * @returns Promise resolving to job status information
 * @throws Error if authentication fails or job not found
 *
 * @internal
 */
async function fetchBriefingPackStatus(
  jobId: string
): Promise<BriefingPackJobStatus> {
  // Call edge function to check status
  const { data: authData } = await supabase.auth.getSession();
  const token = authData.session?.access_token;

  if (!token) {
    throw new Error('Authentication required');
  }

  const response = await fetch(
    `${process.env.VITE_SUPABASE_URL}/functions/v1/briefing-packs/jobs/${jobId}/status`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Briefing pack job not found');
    }
    throw new Error('Failed to fetch briefing pack status');
  }

  return await response.json();
}

/**
 * Hook to poll briefing pack generation job status
 *
 * @description
 * Polls the briefing pack generation job status every 2 seconds while the job is
 * pending or generating. Automatically stops polling when the job completes or fails,
 * and invokes the appropriate callback.
 *
 * Features:
 * - Automatic polling with 2-second intervals
 * - Auto-stop polling on completion/failure
 * - Optional callbacks for completed/failed states
 * - Progress tracking (0-100%)
 * - Cache management (5-minute garbage collection)
 * - Computed state flags (isPolling, isCompleted, isFailed)
 *
 * @param options - Hook options with jobId, enabled flag, and callbacks
 * @returns Status information and computed state flags
 *
 * @example
 * // Basic polling with callbacks
 * const { status, progress, briefingPack, isPolling } = useBriefingPackStatus({
 *   jobId: 'job-uuid-123',
 *   onCompleted: (pack) => {
 *     console.log('Download:', pack.file_url);
 *   },
 *   onFailed: (error) => {
 *     console.error('Failed:', error);
 *   }
 * });
 *
 * @example
 * // Display progress UI
 * const { progress, estimatedCompletionSeconds, isPolling } = useBriefingPackStatus({
 *   jobId: jobId,
 * });
 * {isPolling && (
 *   <ProgressBar value={progress} />
 *   <p>ETA: {estimatedCompletionSeconds}s</p>
 * )}
 *
 * @example
 * // Conditional polling
 * const { status } = useBriefingPackStatus({
 *   jobId: jobId || '',
 *   enabled: !!jobId, // Only poll when jobId exists
 * });
 */
export function useBriefingPackStatus(
  options: UseBriefingPackStatusOptions
) {
  const {
    jobId,
    enabled = true,
    onCompleted,
    onFailed,
  } = options;

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['briefing-pack-job', jobId],
    queryFn: () => fetchBriefingPackStatus(jobId),
    enabled: enabled && !!jobId,
    refetchInterval: (query) => {
      const status = query.state.data?.status;

      // Stop polling when completed or failed
      if (status === 'completed' || status === 'failed') {
        // Trigger callbacks
        if (status === 'completed' && query.state.data?.briefing_pack && onCompleted) {
          onCompleted(query.state.data.briefing_pack);
        } else if (status === 'failed' && query.state.data?.error && onFailed) {
          onFailed(query.state.data.error);
        }

        return false; // Stop polling
      }

      // Poll every 2 seconds while generating
      return 2000;
    },
    staleTime: 0, // Always consider stale to enable polling
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
  });

  const status = data?.status || 'pending';
  const isPolling = status === 'pending' || status === 'generating';
  const isCompleted = status === 'completed';
  const isFailed = status === 'failed';

  return {
    status: data?.status || 'pending',
    progress: data?.progress,
    error: data?.error,
    briefingPack: data?.briefing_pack,
    estimatedCompletionSeconds: data?.estimated_completion_seconds,
    metadata: data?.metadata,
    isLoading,
    isError,
    queryError: error as Error | null,
    isPolling,
    isCompleted,
    isFailed,
    refetch,
  };
}
