/**
 * Intake Entity Links API Client
 * Feature: 024-intake-entity-linking
 *
 * Typed API client wrapper for intake entity linking operations.
 * Handles authentication, error handling, and response parsing.
 */

import { createClient } from '@supabase/supabase-js';
import type {
  EntityLink,
  CreateLinkRequest,
  UpdateLinkRequest,
  BatchCreateLinksRequest,
  ReorderLinksRequest,
  LinkAuditLog,
  EntitySearchResult,
  EntityType,
} from '../../../backend/src/types/intake-entity-links.types';
import type {
  AILinkSuggestion,
  GenerateSuggestionsRequest,
  AcceptSuggestionRequest,
  SuggestionGenerationResult,
} from '../../../backend/src/types/ai-suggestions.types';

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

const FUNCTIONS_BASE_URL = `${supabaseUrl}/functions/v1`;

/**
 * API Response types
 */
export interface APISuccessResponse<T> {
  success: true;
  data: T;
  message?: string;
}

export interface APIErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Array<{
      field?: string;
      issue: string;
    }>;
  };
}

export type APIResponse<T> = APISuccessResponse<T> | APIErrorResponse;

/**
 * API Error class
 */
export class EntityLinksAPIError extends Error {
  code: string;
  details?: Array<{ field?: string; issue: string }>;

  constructor(error: APIErrorResponse['error']) {
    super(error.message);
    this.name = 'EntityLinksAPIError';
    this.code = error.code;
    this.details = error.details;
  }
}

/**
 * Helper function to make authenticated requests
 */
async function fetchWithAuth<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(`${FUNCTIONS_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  const data: APIResponse<T> = await response.json();

  if (!data.success) {
    throw new EntityLinksAPIError(data.error);
  }

  return data.data;
}

/**
 * Entity search filters interface
 */
export interface EntitySearchFilters {
  query?: string;
  entity_types?: EntityType[];
  organization_id?: string;
  classification_level?: number;
  include_archived?: boolean;
  limit?: number;
}

/**
 * Entity intakes filters interface
 */
export interface EntityIntakesFilters {
  status?: string[];
  from_date?: string;
  to_date?: string;
  page?: number;
  limit?: number;
}

/**
 * Entity intakes response interface
 */
export interface EntityIntakesResponse {
  items: Array<{
    id: string;
    ticket_number: string;
    title: string;
    status: string;
    priority: string;
    link_type: string;
    linked_at: string;
    linked_by: string;
  }>;
  pagination: {
    page: number;
    limit: number;
    total_items: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

/**
 * Batch create response interface
 */
export interface BatchCreateResponse {
  created_links: EntityLink[];
  failed_links: Array<{
    index: number;
    error: string;
  }>;
}

/**
 * Intake Entity Links API Client
 */
export const intakeEntityLinksAPI = {
  /**
   * Create a new entity link
   */
  async createLink(
    intakeId: string,
    data: Omit<CreateLinkRequest, 'intake_id'>
  ): Promise<EntityLink> {
    return fetchWithAuth<EntityLink>(`/intake-links-create?intake_id=${intakeId}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Get all links for an intake
   */
  async getLinks(
    intakeId: string,
    includeDeleted = false
  ): Promise<EntityLink[]> {
    const params = new URLSearchParams();
    params.append('intake_id', intakeId);
    params.append('include_deleted', includeDeleted.toString());

    return fetchWithAuth<EntityLink[]>(
      `/intake-links-get?${params.toString()}`,
      {
        method: 'GET',
      }
    );
  },

  /**
   * Update an existing link
   */
  async updateLink(
    intakeId: string,
    linkId: string,
    data: UpdateLinkRequest
  ): Promise<EntityLink> {
    return fetchWithAuth<EntityLink>(
      `/intake-links-update?intake_id=${intakeId}&link_id=${linkId}`,
      {
        method: 'PUT',
        body: JSON.stringify(data),
      }
    );
  },

  /**
   * Delete a link (soft delete)
   */
  async deleteLink(intakeId: string, linkId: string): Promise<void> {
    await fetchWithAuth<void>(`/intake/${intakeId}/links/${linkId}`, {
      method: 'DELETE',
    });
  },

  /**
   * Restore a deleted link
   */
  async restoreLink(intakeId: string, linkId: string): Promise<EntityLink> {
    return fetchWithAuth<EntityLink>(
      `/intake/${intakeId}/links/${linkId}/restore`,
      {
        method: 'POST',
      }
    );
  },

  /**
   * Create multiple links in batch
   */
  async createBatchLinks(
    intakeId: string,
    data: Omit<BatchCreateLinksRequest, 'intake_id'>
  ): Promise<BatchCreateResponse> {
    return fetchWithAuth<BatchCreateResponse>(
      `/intake-links-batch?intake_id=${intakeId}`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
  },

  /**
   * Reorder links
   */
  async reorderLinks(
    intakeId: string,
    linkOrders: Array<{ link_id: string; link_order: number }>
  ): Promise<void> {
    await fetchWithAuth<void>(`/intake/${intakeId}/links/reorder`, {
      method: 'PUT',
      body: JSON.stringify({ link_orders: linkOrders }),
    });
  },

  /**
   * Search for entities to link
   */
  async searchEntities(
    filters: EntitySearchFilters
  ): Promise<EntitySearchResult[]> {
    const params = new URLSearchParams();

    if (filters.query) {
      params.append('q', filters.query); // Use 'q' as expected by Edge Function
    }
    if (filters.entity_types && filters.entity_types.length > 0) {
      params.append('entity_types', filters.entity_types.join(','));
    }
    if (filters.organization_id) {
      params.append('organization_id', filters.organization_id);
    }
    if (filters.classification_level !== undefined) {
      params.append(
        'classification_level',
        filters.classification_level.toString()
      );
    }
    if (filters.include_archived !== undefined) {
      params.append('include_archived', filters.include_archived.toString());
    }
    if (filters.limit) {
      params.append('limit', filters.limit.toString());
    }

    return fetchWithAuth<EntitySearchResult[]>(
      `/entities-search?${params.toString()}`,
      {
        method: 'GET',
      }
    );
  },

  /**
   * Get all intakes linked to an entity
   */
  async getEntityIntakes(
    entityType: EntityType,
    entityId: string,
    filters?: EntityIntakesFilters
  ): Promise<EntityIntakesResponse> {
    const params = new URLSearchParams();

    if (filters?.status && filters.status.length > 0) {
      params.append('status', filters.status.join(','));
    }
    if (filters?.from_date) {
      params.append('from_date', filters.from_date);
    }
    if (filters?.to_date) {
      params.append('to_date', filters.to_date);
    }
    if (filters?.page) {
      params.append('page', filters.page.toString());
    }
    if (filters?.limit) {
      params.append('limit', filters.limit.toString());
    }

    return fetchWithAuth<EntityIntakesResponse>(
      `/entities/${entityType}/${entityId}/intakes?${params.toString()}`,
      {
        method: 'GET',
      }
    );
  },

  /**
   * Get audit log for a link
   */
  async getAuditLog(intakeId: string, linkId: string): Promise<LinkAuditLog[]> {
    return fetchWithAuth<LinkAuditLog[]>(
      `/intake/${intakeId}/links/${linkId}/audit-log`,
      {
        method: 'GET',
      }
    );
  },

  /**
   * AI Suggestions namespace
   */
  ai: {
    /**
     * Generate AI link suggestions for an intake
     */
    async generateSuggestions(
      intakeId: string,
      options?: Omit<GenerateSuggestionsRequest, 'intake_id'>
    ): Promise<SuggestionGenerationResult> {
      return fetchWithAuth<SuggestionGenerationResult>(
        `/intake-links-suggestions?intake_id=${intakeId}`,
        {
          method: 'POST',
          body: JSON.stringify(options || {}),
        }
      );
    },

    /**
     * Accept an AI suggestion and create a link
     */
    async acceptSuggestion(
      intakeId: string,
      data: AcceptSuggestionRequest
    ): Promise<EntityLink> {
      return fetchWithAuth<EntityLink>(
        `/intake/${intakeId}/links/suggestions/accept`,
        {
          method: 'POST',
          body: JSON.stringify(data),
        }
      );
    },

    /**
     * Reject an AI suggestion
     */
    async rejectSuggestion(
      intakeId: string,
      suggestionId: string
    ): Promise<void> {
      await fetchWithAuth<void>(
        `/intake/${intakeId}/links/suggestions/${suggestionId}/reject`,
        {
          method: 'POST',
        }
      );
    },
  },
};

/**
 * Export singleton instance
 */
export default intakeEntityLinksAPI;

/**
 * Export with alternative names for convenience
 */
export const entityLinksApi = intakeEntityLinksAPI;
