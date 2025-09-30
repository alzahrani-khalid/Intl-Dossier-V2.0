/**
 * TanStack Query hook for fetching dossier detail
 *
 * Provides dossier detail with optional includes (stats, owners, contacts, recent_briefs)
 * Query key: ['dossier', id, includes]
 * Cache: staleTime 30s
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { DossierDetailResponse } from '../types/dossier';
import { dossierKeys } from './useDossiers';

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
 * Hook to fetch dossier detail with optional includes
 */
export const useDossier = (
  dossierId: string,
  includes?: ('stats' | 'owners' | 'contacts' | 'recent_briefs')[]
) => {
  return useQuery({
    queryKey: dossierKeys.detail(dossierId, includes),
    queryFn: async (): Promise<DossierDetailResponse> => {
      const headers = await getAuthHeaders();
      const params = new URLSearchParams();

      if (includes && includes.length > 0) {
        params.append('include', includes.join(','));
      }

      const response = await fetch(
        `${API_BASE_URL}/dossiers-get?id=${dossierId}&${params.toString()}`,
        { headers }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message_en || 'Failed to fetch dossier');
      }

      return response.json();
    },
    enabled: !!dossierId,
    staleTime: 30_000, // 30 seconds
  });
};