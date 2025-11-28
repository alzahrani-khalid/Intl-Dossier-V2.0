/**
 * Commitments Service v1.1
 * Feature: 031-commitments-management
 *
 * API client for full CRUD operations on commitments with cursor-based pagination,
 * status management, and evidence upload capabilities.
 */

import { supabase } from '@/lib/supabase';
import type {
  Commitment,
  CommitmentFilters,
  CommitmentsListResponse,
  CommitmentStatusHistory,
  CreateCommitmentInput,
  UpdateCommitmentInput,
  UpdateCommitmentStatusInput,
  CancelCommitmentInput,
  PaginationCursor,
  EvidenceUploadResponse,
  EvidenceUrlResponse,
  CommitmentStatus,
  CommitmentPriority,
  DEFAULT_PAGE_SIZE,
} from '@/types/commitment.types';

// Re-export types for convenience
export type {
  Commitment,
  CommitmentFilters,
  CommitmentsListResponse,
  CommitmentStatusHistory,
  CreateCommitmentInput,
  UpdateCommitmentInput,
  PaginationCursor,
};

/**
 * Fetch commitments with cursor-based pagination and filters
 *
 * @param filters - Optional filters for querying commitments
 * @param cursor - Pagination cursor for infinite scroll
 * @param limit - Number of items per page (default: 20)
 * @returns Commitments list with pagination info
 */
export async function getCommitments(
  filters?: CommitmentFilters,
  cursor?: PaginationCursor,
  limit: number = 20
): Promise<CommitmentsListResponse> {
  let query = supabase
    .from('aa_commitments')
    .select('*', { count: 'exact' });

  // Apply entity filters
  if (filters?.dossierId) {
    query = query.eq('dossier_id', filters.dossierId);
  }

  if (filters?.ownerId) {
    query = query.or(`owner_user_id.eq.${filters.ownerId},owner_contact_id.eq.${filters.ownerId}`);
  }

  if (filters?.ownerType) {
    query = query.eq('owner_type', filters.ownerType);
  }

  // Apply status filters
  if (filters?.status && filters.status.length > 0) {
    query = query.in('status', filters.status);
  }

  if (filters?.priority && filters.priority.length > 0) {
    query = query.in('priority', filters.priority);
  }

  // Apply overdue filter
  if (filters?.overdue) {
    const today = new Date().toISOString().split('T')[0];
    query = query
      .lt('due_date', today)
      .not('status', 'in', '(completed,cancelled)');
  }

  // Apply date range filters
  if (filters?.dueDateFrom) {
    query = query.gte('due_date', filters.dueDateFrom);
  }

  if (filters?.dueDateTo) {
    query = query.lte('due_date', filters.dueDateTo);
  }

  // Apply search filter
  if (filters?.search) {
    query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
  }

  // Apply cursor-based pagination
  if (cursor) {
    query = query.or(
      `due_date.gt.${cursor.due_date},and(due_date.eq.${cursor.due_date},id.gt.${cursor.id})`
    );
  }

  // Order and limit
  query = query
    .order('due_date', { ascending: true })
    .order('id', { ascending: true })
    .limit(limit + 1); // Fetch one extra to check if there are more

  const { data, error, count } = await query;

  if (error) {
    throw new Error(`Failed to fetch commitments: ${error.message}`);
  }

  const commitments = data ?? [];
  const hasMore = commitments.length > limit;

  // Remove the extra item if present
  if (hasMore) {
    commitments.pop();
  }

  // Build next cursor from last item
  const lastItem = commitments[commitments.length - 1];
  const nextCursor: PaginationCursor | null = hasMore && lastItem
    ? { due_date: lastItem.due_date, id: lastItem.id }
    : null;

  return {
    commitments,
    totalCount: count ?? 0,
    nextCursor,
    hasMore,
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

  return data as Commitment;
}

/**
 * Create a new commitment
 *
 * @param input - Commitment creation data
 * @returns Created commitment
 */
export async function createCommitment(input: CreateCommitmentInput): Promise<Commitment> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User must be authenticated to create a commitment');
  }

  // Determine owner based on owner_type
  // - internal: owner_user_id = current user (or specified), owner_contact_id = null
  // - external: owner_contact_id = specified, owner_user_id = null
  const isInternal = input.owner_type === 'internal';
  const owner_user_id = isInternal ? (input.owner_user_id ?? user.id) : null;
  const owner_contact_id = isInternal ? null : (input.owner_contact_id ?? null);

  // Tracking mode is STRICTLY determined by owner type (per valid_tracking constraint)
  // - internal: MUST be 'automatic'
  // - external: MUST be 'manual'
  // Note: We override any input value to enforce the database constraint
  const tracking_mode = isInternal ? 'automatic' : 'manual';

  const { data, error } = await supabase
    .from('aa_commitments')
    .insert({
      dossier_id: input.dossier_id,
      after_action_id: input.after_action_id ?? null,
      title: input.title,
      description: input.description,
      due_date: input.due_date,
      owner_type: input.owner_type,
      owner_user_id,
      owner_contact_id,
      priority: input.priority ?? 'medium',
      status: input.status ?? 'pending',
      tracking_mode,
      proof_required: input.proof_required ?? false,
      created_by: user.id,
      updated_by: user.id,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create commitment: ${error.message}`);
  }

  return data as Commitment;
}

/**
 * Update an existing commitment
 *
 * @param commitmentId - UUID of the commitment
 * @param input - Fields to update
 * @returns Updated commitment
 */
export async function updateCommitment(
  commitmentId: string,
  input: UpdateCommitmentInput
): Promise<Commitment> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User must be authenticated to update a commitment');
  }

  const { data, error } = await supabase
    .from('aa_commitments')
    .update({
      ...input,
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    })
    .eq('id', commitmentId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update commitment: ${error.message}`);
  }

  return data as Commitment;
}

/**
 * Update commitment status with audit trail
 * The database trigger will automatically create a status history entry
 *
 * @param input - Status update data
 * @returns Updated commitment
 */
export async function updateCommitmentStatus(
  input: UpdateCommitmentStatusInput
): Promise<Commitment> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User must be authenticated to update status');
  }

  const updateData: Record<string, unknown> = {
    status: input.status,
    status_changed_at: new Date().toISOString(),
    updated_by: user.id,
    updated_at: new Date().toISOString(),
  };

  // If marking as completed, set completed_at
  if (input.status === 'completed') {
    updateData.completed_at = new Date().toISOString();
    if (input.notes) {
      updateData.completion_notes = input.notes;
    }
  }

  const { data, error } = await supabase
    .from('aa_commitments')
    .update(updateData)
    .eq('id', input.id)
    .select()
    .single();

  if (error) {
    // Check for status transition error
    if (error.message.includes('Cannot change status')) {
      throw new Error('INVALID_STATUS_TRANSITION: ' + error.message);
    }
    throw new Error(`Failed to update status: ${error.message}`);
  }

  return data as Commitment;
}

/**
 * Cancel a commitment with reason
 *
 * @param input - Cancellation data
 * @returns Updated commitment
 */
export async function cancelCommitment(input: CancelCommitmentInput): Promise<Commitment> {
  return updateCommitmentStatus({
    id: input.id,
    status: 'cancelled',
    notes: input.reason,
  });
}

/**
 * Get status history for a commitment
 *
 * @param commitmentId - UUID of the commitment
 * @returns Array of status history entries
 */
export async function getCommitmentStatusHistory(
  commitmentId: string
): Promise<CommitmentStatusHistory[]> {
  const { data, error } = await supabase
    .from('commitment_status_history')
    .select('*')
    .eq('commitment_id', commitmentId)
    .order('changed_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch status history: ${error.message}`);
  }

  return (data ?? []) as CommitmentStatusHistory[];
}

/**
 * Upload evidence file for a commitment
 *
 * @param commitmentId - UUID of the commitment
 * @param file - File to upload
 * @returns Upload response with proof_url
 */
export async function uploadEvidence(
  commitmentId: string,
  file: File
): Promise<EvidenceUploadResponse> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User must be authenticated to upload evidence');
  }

  // Generate unique file path
  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
  const filePath = `${commitmentId}/${fileName}`;

  // Upload to storage bucket
  const { error: uploadError } = await supabase.storage
    .from('commitment-evidence')
    .upload(filePath, file, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    throw new Error(`Failed to upload evidence: ${uploadError.message}`);
  }

  const evidence_submitted_at = new Date().toISOString();

  // Update commitment with proof_url
  const { error: updateError } = await supabase
    .from('aa_commitments')
    .update({
      proof_url: filePath,
      evidence_submitted_at,
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    })
    .eq('id', commitmentId);

  if (updateError) {
    throw new Error(`Failed to update commitment with evidence: ${updateError.message}`);
  }

  return {
    proof_url: filePath,
    evidence_submitted_at,
  };
}

/**
 * Get signed URL for evidence download
 *
 * @param proofUrl - Path to the evidence file in storage
 * @returns Signed URL response
 */
export async function getEvidenceUrl(proofUrl: string): Promise<EvidenceUrlResponse> {
  const { data, error } = await supabase.storage
    .from('commitment-evidence')
    .createSignedUrl(proofUrl, 3600); // 1 hour expiry

  if (error) {
    throw new Error(`Failed to get evidence URL: ${error.message}`);
  }

  return {
    signedUrl: data.signedUrl,
    expiresAt: new Date(Date.now() + 3600 * 1000).toISOString(),
  };
}

/**
 * Delete a commitment (soft delete by setting status to cancelled)
 * Note: Full deletion may be restricted by RLS policies
 *
 * @param commitmentId - UUID of the commitment
 * @param reason - Reason for deletion/cancellation
 */
export async function deleteCommitment(commitmentId: string, reason: string): Promise<void> {
  await cancelCommitment({ id: commitmentId, reason });
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get commitment status color for UI
 *
 * @param status - Commitment status
 * @returns Tailwind CSS color classes
 */
export function getCommitmentStatusColor(
  status: CommitmentStatus
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
  priority: CommitmentPriority
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
  status: CommitmentStatus
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

/**
 * Calculate days until due or days overdue
 *
 * @param dueDate - Commitment due date (ISO string)
 * @returns Positive for days until due, negative for days overdue
 */
export function getDaysUntilDue(dueDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);

  const diffTime = due.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}
