/**
 * Commitments Service
 * Feature: 030-health-commitment
 *
 * API client for fetching and managing commitments from aa_commitments table
 */

import { supabase } from '@/lib/supabase';

/**
 * Commitment from aa_commitments table
 */
export interface Commitment {
  id: string;
  dossier_id: string;
  after_action_id: string | null;
  title: string;
  description: string | null;
  due_date: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'critical';
  owner_type: 'internal' | 'external';
  owner_id: string | null;
  tracking_mode: 'automatic' | 'manual';
  proof_required: boolean;
  completion_notes: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string;
}

/**
 * Commitment list filters
 */
export interface CommitmentFilters {
  dossierId?: string;
  status?: string[]; // Array of status values
  ownerId?: string;
  priority?: string[];
  overdue?: boolean;
  limit?: number;
  offset?: number;
}

/**
 * Commitment list response
 */
export interface CommitmentsListResponse {
  commitments: Commitment[];
  totalCount: number;
}

/**
 * Fetch commitments with optional filters
 *
 * @param filters - Optional filters for querying commitments
 * @returns Commitments list with total count
 */
export async function getCommitments(
  filters?: CommitmentFilters
): Promise<CommitmentsListResponse> {
  let query = supabase
    .from('aa_commitments')
    .select('*', { count: 'exact' });

  // Apply filters
  if (filters?.dossierId) {
    query = query.eq('dossier_id', filters.dossierId);
  }

  if (filters?.status && filters.status.length > 0) {
    query = query.in('status', filters.status);
  }

  if (filters?.ownerId) {
    query = query.eq('owner_id', filters.ownerId);
  }

  if (filters?.priority && filters.priority.length > 0) {
    query = query.in('priority', filters.priority);
  }

  if (filters?.overdue) {
    const today = new Date().toISOString().split('T')[0];
    query = query
      .lt('due_date', today)
      .not('status', 'in', '(completed,cancelled)');
  }

  // Pagination
  const limit = filters?.limit ?? 50;
  const offset = filters?.offset ?? 0;
  query = query.range(offset, offset + limit - 1);

  // Order by due date (upcoming first)
  query = query.order('due_date', { ascending: true });

  const { data, error, count } = await query;

  if (error) {
    throw new Error(`Failed to fetch commitments: ${error.message}`);
  }

  return {
    commitments: data ?? [],
    totalCount: count ?? 0,
  };
}

/**
 * Get a single commitment by ID
 *
 * @param commitmentId - UUID of the commitment
 * @returns Commitment details
 */
export async function getCommitment(commitmentId: string): Promise<Commitment> {
  const { data, error } = await supabase
    .from('aa_commitments')
    .select('*')
    .eq('id', commitmentId)
    .single();

  if (error) {
    throw new Error(`Failed to fetch commitment: ${error.message}`);
  }

  if (!data) {
    throw new Error('Commitment not found');
  }

  return data;
}

/**
 * Get commitment status color for UI
 *
 * @param status - Commitment status
 * @returns Tailwind CSS color class
 */
export function getCommitmentStatusColor(
  status: Commitment['status']
): string {
  switch (status) {
    case 'completed':
      return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20';
    case 'in_progress':
      return 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20';
    case 'pending':
      return 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20';
    case 'cancelled':
      return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/20';
    default:
      return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/20';
  }
}

/**
 * Get commitment priority color for UI
 *
 * @param priority - Commitment priority
 * @returns Tailwind CSS color class
 */
export function getCommitmentPriorityColor(
  priority: Commitment['priority']
): string {
  switch (priority) {
    case 'critical':
      return 'text-red-600 dark:text-red-400';
    case 'high':
      return 'text-orange-600 dark:text-orange-400';
    case 'medium':
      return 'text-yellow-600 dark:text-yellow-400';
    case 'low':
      return 'text-green-600 dark:text-green-400';
    default:
      return 'text-gray-600 dark:text-gray-400';
  }
}

/**
 * Check if commitment is overdue
 *
 * @param dueDate - Commitment due date (ISO string)
 * @param status - Commitment status
 * @returns True if overdue
 */
export function isCommitmentOverdue(
  dueDate: string,
  status: Commitment['status']
): boolean {
  if (status === 'completed' || status === 'cancelled') {
    return false;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);

  return due < today;
}
