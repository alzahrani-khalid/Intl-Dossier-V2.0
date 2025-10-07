/**
 * TanStack Query Hook: useBriefingPackStatus (T041)
 * Polls briefing pack job status with automatic refetch until completion
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

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

export interface BriefingPackJobStatus {
  status: 'pending' | 'generating' | 'completed' | 'failed';
  progress?: number; // 0-100
  error?: string;
  briefing_pack?: BriefingPack;
  estimated_completion_seconds?: number;
  metadata?: {
    retry_count?: number;
  };
}

export interface UseBriefingPackStatusOptions {
  jobId: string;
  enabled?: boolean;
  onCompleted?: (briefingPack: BriefingPack) => void;
  onFailed?: (error: string) => void;
}

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
