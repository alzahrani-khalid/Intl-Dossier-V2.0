/**
 * Search API Client
 * Part of: 026-unified-dossier-architecture implementation
 *
 * Typed API client for unified search operations across all dossier types.
 * Handles full-text search with weighted ranking, multilingual support, and clearance filtering.
 */

import { supabase } from '@/lib/supabase';
import type { DossierType } from './dossier-api';

// Get Supabase URL for Edge Functions
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

if (!supabaseUrl) {
  throw new Error('Missing VITE_SUPABASE_URL environment variable');
}

/**
 * Search Result Interface
 */
export interface SearchResult {
  id: string;
  type: DossierType;
  name_en: string;
  name_ar: string;
  description_en?: string;
  description_ar?: string;
  status: string;
  sensitivity_level: number;
  tags?: string[];
  relevance_score: number; // Search ranking score
  matched_fields: string[]; // Which fields matched the search
  created_at: string;
  updated_at: string;
}

/**
 * API Request types
 */
export interface SearchRequest {
  query: string;
  types?: DossierType[]; // Filter by specific dossier types
  status?: string[]; // Filter by status
  sensitivity_level_max?: number; // Maximum sensitivity level (RLS will enforce)
  tags?: string[]; // Filter by tags
  page?: number;
  page_size?: number;
  sort_by?: 'relevance' | 'created_at' | 'updated_at' | 'name_en' | 'name_ar';
  sort_order?: 'asc' | 'desc';
}

export interface SearchResponse {
  results: SearchResult[];
  total_count: number;
  page: number;
  page_size: number;
  query: string;
  search_time_ms: number; // Performance metric
}

export interface AutocompleteRequest {
  query: string;
  types?: DossierType[];
  limit?: number;
}

export interface AutocompleteResult {
  id: string;
  type: DossierType;
  name_en: string;
  name_ar: string;
  status: string;
}

export interface AutocompleteResponse {
  suggestions: AutocompleteResult[];
  query: string;
}

/**
 * Search Suggest Response (from search-suggest Edge Function)
 */
interface SearchSuggestItem {
  id: string;
  type: string;
  title_en: string;
  title_ar: string;
  preview_en: string;
  preview_ar: string;
  score: number;
  match_position: number;
}

interface SearchSuggestResponse {
  suggestions: SearchSuggestItem[];
  query: {
    original: string;
    normalized: string;
    language_detected: string;
  };
  took_ms: number;
  cache_hit: boolean;
  metadata: {
    total_suggestions: number;
    types_searched: string[];
  };
}

/**
 * API Error class
 */
export class SearchAPIError extends Error {
  code: string;
  status: number;
  details?: any;

  constructor(message: string, status: number, code: string, details?: any) {
    super(message);
    this.name = 'SearchAPIError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

/**
 * Helper function to get auth headers
 */
async function getAuthHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    throw new SearchAPIError('Not authenticated', 401, 'AUTH_REQUIRED');
  }

  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session.access_token}`,
  };
}

/**
 * Helper function to handle API responses
 */
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let error: any;
    try {
      error = await response.json();
    } catch {
      error = { message: response.statusText };
    }

    throw new SearchAPIError(
      error.message || 'API request failed',
      response.status,
      error.code || 'API_ERROR',
      error.details
    );
  }

  return response.json();
}

/**
 * Unified search across all dossier types
 */
export async function searchDossiers(
  request: SearchRequest
): Promise<SearchResponse> {
  const headers = await getAuthHeaders();
  const params = new URLSearchParams();

  // Add query parameters
  params.append('query', request.query);

  if (request.types && request.types.length > 0) {
    params.append('types', JSON.stringify(request.types));
  }

  if (request.status && request.status.length > 0) {
    params.append('status', JSON.stringify(request.status));
  }

  if (request.sensitivity_level_max !== undefined) {
    params.append('sensitivity_level_max', String(request.sensitivity_level_max));
  }

  if (request.tags && request.tags.length > 0) {
    params.append('tags', JSON.stringify(request.tags));
  }

  if (request.page !== undefined) {
    params.append('page', String(request.page));
  }

  if (request.page_size !== undefined) {
    params.append('page_size', String(request.page_size));
  }

  if (request.sort_by) {
    params.append('sort_by', request.sort_by);
  }

  if (request.sort_order) {
    params.append('sort_order', request.sort_order);
  }

  const url = `${supabaseUrl}/functions/v1/search?${params.toString()}`;
  const response = await fetch(url, {
    method: 'GET',
    headers,
  });

  return handleResponse<SearchResponse>(response);
}

/**
 * Autocomplete search for quick suggestions
 * Uses search-suggest Edge Function with 'q' parameter and 'type=dossiers'
 */
export async function autocompleteDossiers(
  request: AutocompleteRequest
): Promise<AutocompleteResponse> {
  const headers = await getAuthHeaders();
  const params = new URLSearchParams();

  // search-suggest uses 'q' parameter (not 'query')
  params.append('q', request.query);

  // Filter to dossiers type by default
  if (request.types && request.types.length > 0) {
    params.append('type', request.types.join(','));
  } else {
    params.append('type', 'dossiers');
  }

  if (request.limit !== undefined) {
    params.append('limit', String(request.limit));
  }

  // Use search-suggest endpoint (not search/autocomplete)
  const url = `${supabaseUrl}/functions/v1/search-suggest?${params.toString()}`;
  const response = await fetch(url, {
    method: 'GET',
    headers,
  });

  // Transform search-suggest response to AutocompleteResponse format
  const suggestResponse = await handleResponse<SearchSuggestResponse>(response);

  return {
    suggestions: suggestResponse.suggestions.map((s) => ({
      id: s.id,
      type: (s.type === 'dossier' ? 'country' : s.type) as DossierType, // Map 'dossier' to actual type
      name_en: s.title_en,
      name_ar: s.title_ar,
      status: 'active', // Default status since search-suggest doesn't return it
    })),
    query: suggestResponse.query.original,
  };
}

/**
 * Search within a specific dossier type
 */
export async function searchByType(
  type: DossierType,
  query: string,
  page?: number,
  page_size?: number
): Promise<SearchResponse> {
  return searchDossiers({
    query,
    types: [type],
    page,
    page_size,
  });
}

/**
 * Quick search (default sort by relevance, first page only)
 */
export async function quickSearch(query: string): Promise<SearchResponse> {
  return searchDossiers({
    query,
    page: 1,
    page_size: 10,
    sort_by: 'relevance',
    sort_order: 'desc',
  });
}
