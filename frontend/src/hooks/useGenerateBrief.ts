/**
 * TanStack Query mutation for generating briefs
 *
 * Generates executive brief via AI or returns fallback template
 * Timeout: 60s
 * On 201: Returns brief, shows success
 * On 503: Returns fallback template, switches to manual mode
 * On timeout: Shows fallback
 */

import { useMutation } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { Brief, BriefGenerationFallback } from '../types/dossier';

// API base URL
const API_BASE_URL = import.meta.env.VITE_SUPABASE_URL + '/functions/v1';

// Helper to get auth headers
const getAuthHeaders = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session?.access_token}`,
  };
};

/**
 * Request parameters for brief generation
 */
export interface GenerateBriefRequest {
  date_range_start?: string;
  date_range_end?: string;
  sections?: ('summary' | 'recent_activity' | 'commitments' | 'positions' | 'health')[];
}

/**
 * Response can be either successful brief or fallback
 */
export type GenerateBriefResponse =
  | { success: true; brief: Brief }
  | { success: false; fallback: BriefGenerationFallback };

/**
 * Custom error class for service unavailable
 */
export class ServiceUnavailableError extends Error {
  constructor(
    message: string,
    public fallback: BriefGenerationFallback
  ) {
    super(message);
    this.name = 'ServiceUnavailableError';
  }
}

/**
 * Hook to generate brief
 */
export const useGenerateBrief = (dossierId: string) => {
  return useMutation({
    mutationFn: async (data: GenerateBriefRequest): Promise<GenerateBriefResponse> => {
      const headers = await getAuthHeaders();
      const controller = new AbortController();

      // Set 60s timeout
      const timeoutId = setTimeout(() => controller.abort(), 60000);

      try {
        const response = await fetch(
          `${API_BASE_URL}/dossiers-briefs-generate`,
          {
            method: 'POST',
            headers,
            body: JSON.stringify({ id: dossierId, ...data }),
            signal: controller.signal,
          }
        );

        clearTimeout(timeoutId);

        // Success case
        if (response.ok) {
          const brief = await response.json();
          return { success: true, brief };
        }

        // Service unavailable - return fallback
        if (response.status === 503) {
          const fallbackData: BriefGenerationFallback = await response.json();
          throw new ServiceUnavailableError(
            fallbackData.error.message_en,
            fallbackData
          );
        }

        // Other errors
        const error = await response.json();
        throw new Error(error.error?.message_en || 'Failed to generate brief');
      } catch (err) {
        clearTimeout(timeoutId);

        // Handle abort (timeout)
        if (err instanceof Error && err.name === 'AbortError') {
          // Fetch fallback on timeout
          const fallbackResponse = await fetch(
            `${API_BASE_URL}/dossiers-briefs-generate`,
            {
              method: 'POST',
              headers,
              body: JSON.stringify({ id: dossierId, ...data, use_fallback: true }),
            }
          );

          if (fallbackResponse.status === 503) {
            const fallbackData: BriefGenerationFallback = await fallbackResponse.json();
            throw new ServiceUnavailableError('Brief generation timed out', fallbackData);
          }
        }

        throw err;
      }
    },
  });
};