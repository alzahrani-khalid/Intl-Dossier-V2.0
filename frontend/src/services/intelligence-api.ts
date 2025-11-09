/**
 * Intelligence API Service
 * Feature: 029-dynamic-country-intelligence
 *
 * Type-safe API client for intelligence operations.
 * Handles authentication, request/response validation, and error handling.
 *
 * @see specs/029-dynamic-country-intelligence/api-contracts/openapi.yaml
 */

import { supabase } from '@/lib/supabase';

// ============================================================================
// Type Definitions (mirrored from Zod schemas)
// ============================================================================

export type IntelligenceType = 'economic' | 'political' | 'security' | 'bilateral' | 'general';
export type RefreshStatus = 'fresh' | 'stale' | 'refreshing' | 'error' | 'expired';
export type Priority = 'low' | 'normal' | 'high';
export type Language = 'en' | 'ar';

export interface DataSourceMetadata {
  source: string;
  endpoint?: string;
  retrieved_at: string;
  confidence?: number;
}

export interface AnythingLLMMetadata {
  model?: string;
  tokens_used?: number;
  sources_cited?: string[];
}

export interface IntelligenceReport {
  id: string;
  entity_id: string;
  entity_type: 'country' | 'organization' | 'forum' | 'topic' | 'working_group';
  intelligence_type: IntelligenceType;
  title: string;
  title_ar?: string;
  content: string;
  content_ar?: string;
  confidence_score: number;
  refresh_status: RefreshStatus;
  cache_expires_at: string;
  cache_created_at: string;
  last_refreshed_at: string;
  is_expired: boolean;
  time_until_expiry_hours?: number;
  data_sources_metadata: DataSourceMetadata[];
  metrics?: Record<string, string> | null; // Key indicators (GDP growth, inflation, etc.)
  anythingllm_workspace_id?: string;
  anythingllm_query?: string;
  anythingllm_response_metadata?: AnythingLLMMetadata;
  version: number;
  created_at: string;
  updated_at: string;
}

export interface GetIntelligenceParams {
  entity_id: string;
  intelligence_type?: IntelligenceType;
  include_stale?: boolean;
  language?: Language;
}

export interface GetIntelligenceResponse {
  success: true;
  data: IntelligenceReport[];
  meta: {
    total_count: number;
    fresh_count: number;
    stale_count: number;
  };
}

export interface RefreshIntelligenceParams {
  entity_id: string;
  intelligence_types?: IntelligenceType[];
  force?: boolean;
  priority?: Priority;
}

export interface RefreshIntelligenceResponse {
  success: true;
  data: {
    refresh_id: string;
    status: 'initiated' | 'in_progress' | 'completed' | 'failed';
    entity_id: string;
    intelligence_types: IntelligenceType[];
    triggered_by: string;
    triggered_at: string;
    estimated_completion?: string;
  };
  message_en: string;
  message_ar: string;
}

export interface IntelligenceAPIError extends Error {
  status: number;
  code: string;
  message: string;
  message_ar?: string;
  details?: Record<string, unknown>;
  correlation_id?: string;
}

// ============================================================================
// API Configuration
// ============================================================================

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const FUNCTIONS_URL = `${SUPABASE_URL}/functions/v1`;

/**
 * Gets the current user's JWT token for API authentication
 */
async function getAuthToken(): Promise<string> {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error || !session) {
    throw new Error('Authentication required. Please log in.');
  }

  return session.access_token;
}

/**
 * Creates a standardized API error from response
 */
async function createAPIError(response: Response): Promise<IntelligenceAPIError> {
  let errorData;

  try {
    errorData = await response.json();
  } catch {
    errorData = {
      error: {
        code: 'UNKNOWN_ERROR',
        message_en: response.statusText || 'An unknown error occurred',
        message_ar: 'حدث خطأ غير معروف',
      },
    };
  }

  const error = new Error(errorData.error?.message_en || 'API request failed') as IntelligenceAPIError;
  error.status = response.status;
  error.code = errorData.error?.code || 'UNKNOWN_ERROR';
  error.message_ar = errorData.error?.message_ar;
  error.details = errorData.error?.details;
  error.correlation_id = errorData.error?.correlation_id;

  return error;
}

// ============================================================================
// API Functions
// ============================================================================

/**
 * Fetches intelligence data for an entity
 *
 * @param params - Query parameters
 * @returns Intelligence reports with metadata
 * @throws IntelligenceAPIError on failure
 *
 * @example
 * ```ts
 * const intelligence = await getIntelligence({
 *   entity_id: '550e8400-e29b-41d4-a716-446655440000',
 *   intelligence_type: 'economic',
 *   language: 'en'
 * });
 * ```
 */
export async function getIntelligence(
  params: GetIntelligenceParams
): Promise<GetIntelligenceResponse> {
  try {
    const token = await getAuthToken();

    // Build query string
    const queryParams = new URLSearchParams({
      entity_id: params.entity_id,
      ...(params.intelligence_type && { intelligence_type: params.intelligence_type }),
      ...(params.include_stale !== undefined && {
        include_stale: String(params.include_stale),
      }),
      ...(params.language && { language: params.language }),
    });

    const response = await fetch(`${FUNCTIONS_URL}/intelligence-get?${queryParams}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw await createAPIError(response);
    }

    const data: GetIntelligenceResponse = await response.json();
    console.log('[Intelligence API] Fetched intelligence data:', {
      totalReports: data.data.length,
      reports: data.data.map(r => ({
        type: r.intelligence_type,
        confidenceScore: r.confidence_score,
        hasMetrics: !!r.metrics,
        metricsKeys: r.metrics ? Object.keys(r.metrics) : [],
        metricsValues: r.metrics,
        lastRefreshed: r.last_refreshed_at,
        createdAt: r.created_at,
      }))
    });
    console.log('[Intelligence API] Raw report sample (economic):', 
      data.data.find(r => r.intelligence_type === 'economic')
    );
    return data;
  } catch (error) {
    if (error instanceof Error && 'status' in error) {
      throw error as IntelligenceAPIError;
    }

    // Wrap unexpected errors
    const apiError = new Error('Failed to fetch intelligence data') as IntelligenceAPIError;
    apiError.status = 500;
    apiError.code = 'FETCH_ERROR';
    throw apiError;
  }
}

/**
 * Triggers manual intelligence refresh
 *
 * @param params - Refresh parameters
 * @returns Refresh operation status
 * @throws IntelligenceAPIError on failure (including 409 for concurrent refresh)
 *
 * @example
 * ```ts
 * const result = await refreshIntelligence({
 *   entity_id: '550e8400-e29b-41d4-a716-446655440000',
 *   intelligence_types: ['economic', 'political'],
 *   priority: 'high'
 * });
 * ```
 */
export async function refreshIntelligence(
  params: RefreshIntelligenceParams
): Promise<RefreshIntelligenceResponse> {
  try {
    console.log('[Intelligence API] Refresh requested with params:', params);
    const token = await getAuthToken();
    console.log('[Intelligence API] Token retrieved, making POST request to intelligence-refresh');

    // TEMPORARY: Using intelligence-refresh-v2 to bypass caching issues
    const response = await fetch(`${FUNCTIONS_URL}/intelligence-refresh-v2`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    console.log('[Intelligence API] Response received:', response.status, response.statusText);

    if (!response.ok) {
      console.error('[Intelligence API] Request failed with status:', response.status);
      throw await createAPIError(response);
    }

    const data: RefreshIntelligenceResponse = await response.json();
    console.log('[Intelligence API] Refresh completed successfully:', data);
    return data;
  } catch (error) {
    if (error instanceof Error && 'status' in error) {
      throw error as IntelligenceAPIError;
    }

    const apiError = new Error('Failed to refresh intelligence data') as IntelligenceAPIError;
    apiError.status = 500;
    apiError.code = 'REFRESH_ERROR';
    throw apiError;
  }
}

/**
 * Fetches a single intelligence report by entity and type
 *
 * Convenience function that wraps getIntelligence for single-type queries.
 *
 * @param entityId - Entity UUID
 * @param intelligenceType - Intelligence type to fetch
 * @param language - Preferred language
 * @returns Single intelligence report or undefined if not found
 *
 * @example
 * ```ts
 * const economicIntel = await getIntelligenceByType(
 *   '550e8400-e29b-41d4-a716-446655440000',
 *   'economic',
 *   'en'
 * );
 * ```
 */
export async function getIntelligenceByType(
  entityId: string,
  intelligenceType: IntelligenceType,
  language: Language = 'en'
): Promise<IntelligenceReport | undefined> {
  const response = await getIntelligence({
    entity_id: entityId,
    intelligence_type: intelligenceType,
    language,
  });

  return response.data[0];
}

/**
 * Fetches all intelligence types for an entity
 *
 * @param entityId - Entity UUID
 * @param language - Preferred language
 * @returns All intelligence reports for the entity
 *
 * @example
 * ```ts
 * const allIntelligence = await getAllIntelligence(
 *   '550e8400-e29b-41d4-a716-446655440000',
 *   'en'
 * );
 * ```
 */
export async function getAllIntelligence(
  entityId: string,
  language: Language = 'en'
): Promise<GetIntelligenceResponse> {
  return getIntelligence({
    entity_id: entityId,
    include_stale: true,
    language,
  });
}

/**
 * Refreshes a specific intelligence type
 *
 * Convenience function for selective refresh of a single type.
 *
 * @param entityId - Entity UUID
 * @param intelligenceType - Intelligence type to refresh
 * @param options - Optional refresh options
 * @returns Refresh operation status
 *
 * @example
 * ```ts
 * await refreshIntelligenceType(
 *   '550e8400-e29b-41d4-a716-446655440000',
 *   'economic',
 *   { priority: 'high', force: true }
 * );
 * ```
 */
export async function refreshIntelligenceType(
  entityId: string,
  intelligenceType: IntelligenceType,
  options?: {
    force?: boolean;
    priority?: Priority;
  }
): Promise<RefreshIntelligenceResponse> {
  return refreshIntelligence({
    entity_id: entityId,
    intelligence_types: [intelligenceType],
    force: options?.force,
    priority: options?.priority,
  });
}

/**
 * Checks if intelligence data is stale for an entity
 *
 * @param entityId - Entity UUID
 * @returns True if any intelligence is expired or stale
 *
 * @example
 * ```ts
 * const isStale = await isIntelligenceStale(
 *   '550e8400-e29b-41d4-a716-446655440000'
 * );
 *
 * if (isStale) {
 *   // Prompt user to refresh
 * }
 * ```
 */
export async function isIntelligenceStale(entityId: string): Promise<boolean> {
  try {
    const response = await getIntelligence({
      entity_id: entityId,
      include_stale: true,
    });

    return response.data.some(
      (report) => report.is_expired || report.refresh_status === 'stale'
    );
  } catch (error) {
    console.error('Failed to check intelligence staleness:', error);
    return false;
  }
}

/**
 * Gets intelligence types that need refresh
 *
 * @param entityId - Entity UUID
 * @returns Array of intelligence types with expired cache
 *
 * @example
 * ```ts
 * const staleTypes = await getStaleIntelligenceTypes(
 *   '550e8400-e29b-41d4-a716-446655440000'
 * );
 *
 * if (staleTypes.length > 0) {
 *   await refreshIntelligence({
 *     entity_id: entityId,
 *     intelligence_types: staleTypes
 *   });
 * }
 * ```
 */
export async function getStaleIntelligenceTypes(
  entityId: string
): Promise<IntelligenceType[]> {
  try {
    const response = await getIntelligence({
      entity_id: entityId,
      include_stale: true,
    });

    return response.data
      .filter((report) => report.is_expired || report.refresh_status === 'stale')
      .map((report) => report.intelligence_type);
  } catch (error) {
    console.error('Failed to get stale intelligence types:', error);
    return [];
  }
}
