/**
 * After-Action API Client
 * Feature: 022-after-action-structured
 *
 * Typed API client wrapper for after-action CRUD operations.
 * Handles authentication, error handling, and response parsing.
 */

import { createClient } from '@supabase/supabase-js';
import type {
  AfterActionRecord,
  AfterActionCreateInput,
  AfterActionUpdateInput,
  EditRequestInput,
  EditApprovalInput,
} from '../../../backend/src/types/after-action.types';

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
export class AfterActionAPIError extends Error {
  code: string;
  details?: Array<{ field?: string; issue: string }>;

  constructor(error: APIErrorResponse['error']) {
    super(error.message);
    this.name = 'AfterActionAPIError';
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
    throw new AfterActionAPIError(data.error);
  }

  return data.data;
}

/**
 * List filters interface
 */
export interface AfterActionListFilters {
  dossier_id: string;
  status?: ('draft' | 'published' | 'edit_pending')[];
  created_by?: string;
  from_date?: string;
  to_date?: string;
  page?: number;
  limit?: number;
}

/**
 * List response interface
 */
export interface AfterActionListItem {
  id: string;
  engagement_id: string;
  title: string;
  status: 'draft' | 'published' | 'edit_pending';
  confidentiality_level: 'public' | 'internal' | 'confidential' | 'secret';
  created_by: string;
  created_at: string;
  published_at?: string;
  decisions_count: number;
  commitments_count: number;
  risks_count: number;
  attachments_count: number;
}

export interface AfterActionListResponse {
  items: AfterActionListItem[];
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
 * Publish response interface
 */
export interface PublishResponse {
  after_action: AfterActionRecord;
  created_tasks: Array<{
    id: string;
    commitment_id: string;
    description: string;
    owner_id: string;
    due_date: string;
    status: string;
  }>;
  notifications_sent: number;
}

/**
 * After-Action API Client
 */
export const afterActionAPI = {
  /**
   * Create a new draft after-action record
   */
  async create(data: AfterActionCreateInput): Promise<AfterActionRecord> {
    return fetchWithAuth<AfterActionRecord>('/after-action/create', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Update an existing draft after-action
   */
  async update(
    id: string,
    data: AfterActionUpdateInput
  ): Promise<AfterActionRecord> {
    return fetchWithAuth<AfterActionRecord>(`/after-action/update/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  /**
   * Publish a draft after-action and create tasks
   */
  async publish(
    id: string,
    version: number,
    sendNotifications = true
  ): Promise<PublishResponse> {
    return fetchWithAuth<PublishResponse>(`/after-action/publish/${id}`, {
      method: 'POST',
      body: JSON.stringify({
        _version: version,
        send_notifications: sendNotifications,
      }),
    });
  },

  /**
   * Request edit permission for a published record
   */
  async requestEdit(
    id: string,
    data: EditRequestInput
  ): Promise<{ after_action: AfterActionRecord; supervisor_notified: boolean }> {
    return fetchWithAuth(`/after-action/request-edit/${id}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Approve or reject an edit request (supervisor only)
   */
  async approveEdit(
    id: string,
    data: EditApprovalInput
  ): Promise<{
    after_action: AfterActionRecord;
    version_snapshot_created?: boolean;
    creator_notified: boolean;
  }> {
    return fetchWithAuth(`/after-action/approve-edit/${id}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * List after-actions for a dossier
   */
  async list(filters: AfterActionListFilters): Promise<AfterActionListResponse> {
    const params = new URLSearchParams();
    params.append('dossier_id', filters.dossier_id);

    if (filters.status && filters.status.length > 0) {
      params.append('status', filters.status.join(','));
    }
    if (filters.created_by) {
      params.append('created_by', filters.created_by);
    }
    if (filters.from_date) {
      params.append('from_date', filters.from_date);
    }
    if (filters.to_date) {
      params.append('to_date', filters.to_date);
    }
    if (filters.page) {
      params.append('page', filters.page.toString());
    }
    if (filters.limit) {
      params.append('limit', filters.limit.toString());
    }

    return fetchWithAuth<AfterActionListResponse>(
      `/after-action/list?${params.toString()}`,
      {
        method: 'GET',
      }
    );
  },

  /**
   * Get a single after-action with full details
   */
  async get(
    id: string,
    includeAttachments = true,
    includeVersionHistory = false
  ): Promise<AfterActionRecord> {
    const params = new URLSearchParams();
    params.append('include_attachments', includeAttachments.toString());
    params.append('include_version_history', includeVersionHistory.toString());

    return fetchWithAuth<AfterActionRecord>(
      `/after-action/get/${id}?${params.toString()}`,
      {
        method: 'GET',
      }
    );
  },

  /**
   * Delete a draft after-action
   */
  async delete(id: string): Promise<void> {
    await fetchWithAuth<void>(`/after-action/delete/${id}`, {
      method: 'DELETE',
    });
  },
};

/**
 * Export singleton instance
 */
export default afterActionAPI;
