/**
 * Task Contributors API Client
 * Part of: 025-unified-tasks-model implementation
 *
 * Typed API client for task contributor operations.
 * Handles authentication, error handling, and response parsing.
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from '../../../backend/src/types/database.types';

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

type TaskContributor = Database['public']['Tables']['task_contributors']['Row'];

/**
 * API Request types
 */
export interface AddContributorRequest {
  user_id: string;
  role?: string;
}

export interface AddMultipleContributorsRequest {
  user_ids: string[];
  role?: string;
}

/**
 * API Error class
 */
export class ContributorsAPIError extends Error {
  code: string;
  status: number;
  details?: any;

  constructor(message: string, status: number, code: string, details?: any) {
    super(message);
    this.name = 'ContributorsAPIError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

/**
 * Helper function to make authenticated requests
 */
async function fetchWithAuth<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    throw new ContributorsAPIError('Not authenticated', 401, 'UNAUTHORIZED');
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));

    throw new ContributorsAPIError(
      error.message || error.error || 'Request failed',
      response.status,
      error.code || 'UNKNOWN_ERROR',
      error
    );
  }

  return response.json();
}

/**
 * Contributors API Client
 */
export const contributorsAPI = {
  /**
   * Get contributors for a task
   */
  async getTaskContributors(taskId: string): Promise<TaskContributor[]> {
    const { data, error } = await supabase
      .from('task_contributors')
      .select('*')
      .eq('task_id', taskId)
      .is('removed_at', null)
      .order('added_at', { ascending: false });

    if (error) {
      throw new ContributorsAPIError(error.message, 500, error.code);
    }

    return data || [];
  },

  /**
   * Get contributor history for a task (including removed)
   */
  async getContributorHistory(taskId: string): Promise<TaskContributor[]> {
    const { data, error } = await supabase
      .from('task_contributors')
      .select('*')
      .eq('task_id', taskId)
      .order('added_at', { ascending: false });

    if (error) {
      throw new ContributorsAPIError(error.message, 500, error.code);
    }

    return data || [];
  },

  /**
   * Get tasks where user is a contributor
   */
  async getUserContributorTasks(userId: string): Promise<TaskContributor[]> {
    const { data, error } = await supabase
      .from('task_contributors')
      .select('*')
      .eq('user_id', userId)
      .is('removed_at', null)
      .order('added_at', { ascending: false });

    if (error) {
      throw new ContributorsAPIError(error.message, 500, error.code);
    }

    return data || [];
  },

  /**
   * Add a contributor to a task
   */
  async addContributor(taskId: string, request: AddContributorRequest): Promise<TaskContributor> {
    const url = `${supabaseUrl}/functions/v1/contributors-add`;
    const response = await fetchWithAuth<{ contributor: TaskContributor }>(url, {
      method: 'POST',
      body: JSON.stringify({
        task_id: taskId,
        ...request,
      }),
    });
    return response.contributor;
  },

  /**
   * Add multiple contributors to a task
   */
  async addMultipleContributors(
    taskId: string,
    request: AddMultipleContributorsRequest
  ): Promise<TaskContributor[]> {
    const contributors: TaskContributor[] = [];

    for (const userId of request.user_ids) {
      const contributor = await contributorsAPI.addContributor(taskId, {
        user_id: userId,
        role: request.role,
      });
      contributors.push(contributor);
    }

    return contributors;
  },

  /**
   * Remove a contributor from a task
   */
  async removeContributor(taskId: string, userId: string): Promise<void> {
    const url = `${supabaseUrl}/functions/v1/contributors-remove`;
    await fetchWithAuth<{ success: boolean }>(url, {
      method: 'POST',
      body: JSON.stringify({
        task_id: taskId,
        user_id: userId,
      }),
    });
  },

  /**
   * Remove multiple contributors from a task
   */
  async removeMultipleContributors(taskId: string, userIds: string[]): Promise<void> {
    for (const userId of userIds) {
      await contributorsAPI.removeContributor(taskId, userId);
    }
  },

  /**
   * Check if user is a contributor on a task
   */
  async isContributor(taskId: string, userId: string): Promise<boolean> {
    const { data } = await supabase
      .from('task_contributors')
      .select('id')
      .eq('task_id', taskId)
      .eq('user_id', userId)
      .is('removed_at', null)
      .maybeSingle();

    return !!data;
  },

  /**
   * Get contributor count for a task
   */
  async getContributorCount(taskId: string): Promise<number> {
    const { count, error } = await supabase
      .from('task_contributors')
      .select('*', { count: 'exact', head: true })
      .eq('task_id', taskId)
      .is('removed_at', null);

    if (error) {
      throw new ContributorsAPIError(error.message, 500, error.code);
    }

    return count || 0;
  },
};

export default contributorsAPI;
