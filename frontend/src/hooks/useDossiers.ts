/**
 * TanStack Query hook for listing dossiers with filters
 *
 * Provides paginated dossier list with filtering capabilities
 * Query key: ['dossiers', filters]
 * Cache: staleTime 30s, cacheTime 5min
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { DossierFilters, DossierListResponse } from '../types/dossier';

// API base URL
const API_BASE_URL = import.meta.env.VITE_SUPABASE_URL + '/functions/v1';

// Helper to serialize filters for query key (ensures stable keys)
const serializeFilters = (filters?: DossierFilters) => {
  if (!filters) return undefined;
  // Sort keys to ensure consistent serialization
  const sorted: Record<string, any> = {};
  Object.keys(filters).sort().forEach(key => {
    const value = filters[key as keyof DossierFilters];
    if (value !== undefined && value !== null && value !== '') {
      sorted[key] = value;
    }
  });
  return sorted;
};

// Query keys
export const dossierKeys = {
  all: ['dossiers'] as const,
  lists: () => [...dossierKeys.all, 'list'] as const,
  list: (filters?: DossierFilters) => [...dossierKeys.lists(), serializeFilters(filters)] as const,
  details: () => [...dossierKeys.all, 'detail'] as const,
  detail: (id: string, includes?: string[]) => [...dossierKeys.details(), id, includes] as const,
  timeline: (id: string, filters?: any) => [...dossierKeys.all, 'timeline', id, filters] as const,
  briefs: (id: string) => [...dossierKeys.all, 'briefs', id] as const,
};

// Helper to get auth headers
const getAuthHeaders = async () => {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session?.access_token) {
    console.error('❌ No access token available!');
  }

  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session?.access_token}`,
  };
};

/**
 * Hook to list dossiers with filtering and pagination
 */
export const useDossiers = (filters?: DossierFilters) => {
  return useQuery({
    queryKey: dossierKeys.list(filters),
    queryFn: async (): Promise<DossierListResponse> => {
      const headers = await getAuthHeaders();
      const params = new URLSearchParams();

      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            if (Array.isArray(value)) {
              // For arrays like tags, serialize as repeated params
              value.forEach((v) => params.append(key, String(v)));
            } else {
              params.append(key, String(value));
            }
          }
        });
      }

      const response = await fetch(
        `${API_BASE_URL}/dossiers-list?${params.toString()}`,
        { headers }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message_en || 'Failed to fetch dossiers');
      }

      return response.json();
    },
    staleTime: 30_000, // 30 seconds
    gcTime: 5 * 60_000, // 5 minutes (formerly cacheTime)
  });
};