/**
 * Commitment Deliverables Service
 * Feature: Interactive timeline for breaking commitments into trackable milestones
 *
 * API client for CRUD operations on commitment deliverables with progress tracking
 * and template-based bulk creation.
 */

import { supabase } from '@/lib/supabase'
import { COLUMNS } from '@/lib/query-columns'
import type {
  CommitmentDeliverable,
  CreateCommitmentDeliverableInput,
  UpdateCommitmentDeliverableInput,
  BulkCreateDeliverablesInput,
  CommitmentDeliverableStatus,
} from '@/types/commitment-deliverable.types'

// Re-export types for convenience
export type {
  CommitmentDeliverable,
  CreateCommitmentDeliverableInput,
  UpdateCommitmentDeliverableInput,
}

/**
 * Fetch all deliverables for a commitment
 *
 * @param commitmentId - UUID of the commitment
 * @returns Array of deliverables sorted by sort_order
 */
export async function getCommitmentDeliverables(
  commitmentId: string,
): Promise<CommitmentDeliverable[]> {
  const { data, error } = await supabase
    .from('commitment_deliverables')
    .select(COLUMNS.COMMITMENT_DELIVERABLES.LIST)
    .eq('commitment_id', commitmentId)
    .order('sort_order', { ascending: true })
    .order('due_date', { ascending: true })

  if (error) {
    throw new Error(`Failed to fetch deliverables: ${error.message}`)
  }

  return (data ?? []) as CommitmentDeliverable[]
}

/**
 * Get a single deliverable by ID
 *
 * @param deliverableId - UUID of the deliverable
 * @returns Deliverable details
 */
export async function getCommitmentDeliverable(
  deliverableId: string,
): Promise<CommitmentDeliverable> {
  const { data, error } = await supabase
    .from('commitment_deliverables')
    .select(COLUMNS.COMMITMENT_DELIVERABLES.LIST)
    .eq('id', deliverableId)
    .single()

  if (error) {
    throw new Error(`Failed to fetch deliverable: ${error.message}`)
  }

  if (!data) {
    throw new Error('Deliverable not found')
  }

  return data as CommitmentDeliverable
}

/**
 * Create a new deliverable for a commitment
 *
 * @param input - Deliverable creation data
 * @returns Created deliverable
 */
export async function createCommitmentDeliverable(
  input: CreateCommitmentDeliverableInput,
): Promise<CommitmentDeliverable> {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('User must be authenticated to create a deliverable')
  }

  // Get max sort_order for this commitment
  const { data: maxSortData } = await supabase
    .from('commitment_deliverables')
    .select('sort_order')
    .eq('commitment_id', input.commitment_id)
    .order('sort_order', { ascending: false })
    .limit(1)
    .single()

  const nextSortOrder = input.sort_order ?? (maxSortData?.sort_order ?? -1) + 1

  const { data, error } = await supabase
    .from('commitment_deliverables')
    .insert({
      commitment_id: input.commitment_id,
      title_en: input.title_en,
      title_ar: input.title_ar ?? null,
      description_en: input.description_en ?? null,
      description_ar: input.description_ar ?? null,
      deliverable_type: input.deliverable_type,
      status: 'not_started',
      due_date: input.due_date,
      progress: 0,
      weight: input.weight ?? 1,
      sort_order: nextSortOrder,
      notes: input.notes ?? null,
      created_by: user.id,
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create deliverable: ${error.message}`)
  }

  return data as CommitmentDeliverable
}

/**
 * Bulk create deliverables from template
 *
 * @param input - Bulk creation data
 * @returns Created deliverables
 */
export async function bulkCreateDeliverables(
  input: BulkCreateDeliverablesInput,
): Promise<CommitmentDeliverable[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('User must be authenticated to create deliverables')
  }

  const deliverablesToInsert = input.deliverables.map((d, index) => ({
    commitment_id: input.commitment_id,
    title_en: d.title_en,
    title_ar: d.title_ar ?? null,
    description_en: d.description_en ?? null,
    description_ar: d.description_ar ?? null,
    deliverable_type: d.deliverable_type,
    status: 'not_started' as const,
    due_date: d.due_date,
    progress: 0,
    weight: d.weight ?? 1,
    sort_order: d.sort_order ?? index,
    notes: d.notes ?? null,
    created_by: user.id,
  }))

  const { data, error } = await supabase
    .from('commitment_deliverables')
    .insert(deliverablesToInsert)
    .select()

  if (error) {
    throw new Error(`Failed to create deliverables: ${error.message}`)
  }

  return (data ?? []) as CommitmentDeliverable[]
}

/**
 * Update an existing deliverable
 *
 * @param deliverableId - UUID of the deliverable
 * @param input - Fields to update
 * @returns Updated deliverable
 */
export async function updateCommitmentDeliverable(
  deliverableId: string,
  input: UpdateCommitmentDeliverableInput,
): Promise<CommitmentDeliverable> {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('User must be authenticated to update a deliverable')
  }

  // Handle completed_at based on status
  const updateData: Record<string, unknown> = {
    ...input,
    updated_by: user.id,
  }

  if (input.status === 'completed') {
    updateData.completed_at = new Date().toISOString()
    updateData.progress = 100
  } else if (input.status && input.status !== 'completed') {
    updateData.completed_at = null
  }

  const { data, error } = await supabase
    .from('commitment_deliverables')
    .update(updateData)
    .eq('id', deliverableId)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to update deliverable: ${error.message}`)
  }

  return data as CommitmentDeliverable
}

/**
 * Update deliverable status
 *
 * @param deliverableId - UUID of the deliverable
 * @param status - New status
 * @returns Updated deliverable
 */
export async function updateDeliverableStatus(
  deliverableId: string,
  status: CommitmentDeliverableStatus,
): Promise<CommitmentDeliverable> {
  return updateCommitmentDeliverable(deliverableId, { status })
}

/**
 * Update deliverable progress
 *
 * @param deliverableId - UUID of the deliverable
 * @param progress - New progress value (0-100)
 * @returns Updated deliverable
 */
export async function updateDeliverableProgress(
  deliverableId: string,
  progress: number,
): Promise<CommitmentDeliverable> {
  const clampedProgress = Math.max(0, Math.min(100, progress))

  // Auto-set status based on progress
  let status: CommitmentDeliverableStatus | undefined
  if (clampedProgress === 100) {
    status = 'completed'
  } else if (clampedProgress > 0) {
    status = 'in_progress'
  }

  return updateCommitmentDeliverable(deliverableId, {
    progress: clampedProgress,
    ...(status && { status }),
  })
}

/**
 * Delete a deliverable
 *
 * @param deliverableId - UUID of the deliverable
 */
export async function deleteCommitmentDeliverable(deliverableId: string): Promise<void> {
  const { error } = await supabase.from('commitment_deliverables').delete().eq('id', deliverableId)

  if (error) {
    throw new Error(`Failed to delete deliverable: ${error.message}`)
  }
}

/**
 * Reorder deliverables
 *
 * @param commitmentId - UUID of the commitment
 * @param orderedIds - Array of deliverable IDs in new order
 */
export async function reorderDeliverables(
  commitmentId: string,
  orderedIds: string[],
): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('User must be authenticated to reorder deliverables')
  }

  // Update sort_order for each deliverable
  const updates = orderedIds.map((id, index) =>
    supabase
      .from('commitment_deliverables')
      .update({ sort_order: index, updated_by: user.id })
      .eq('id', id)
      .eq('commitment_id', commitmentId),
  )

  const results = await Promise.all(updates)

  const failedUpdate = results.find((r) => r.error)
  if (failedUpdate?.error) {
    throw new Error(`Failed to reorder deliverables: ${failedUpdate.error.message}`)
  }
}

/**
 * Get commitment progress calculated from deliverables
 *
 * @param commitmentId - UUID of the commitment
 * @returns Progress percentage (0-100)
 */
export async function getCommitmentProgress(commitmentId: string): Promise<number> {
  const { data, error } = await supabase.rpc('calculate_commitment_progress', {
    p_commitment_id: commitmentId,
  })

  if (error) {
    // Fallback to manual calculation if RPC fails
    const deliverables = await getCommitmentDeliverables(commitmentId)

    if (deliverables.length === 0) return 0

    const activeDeliverables = deliverables.filter((d) => d.status !== 'cancelled')
    if (activeDeliverables.length === 0) return 0

    const totalWeight = activeDeliverables.reduce((sum, d) => sum + d.weight, 0)
    const weightedProgress = activeDeliverables.reduce((sum, d) => sum + d.weight * d.progress, 0)

    return Math.round(weightedProgress / totalWeight)
  }

  return data ?? 0
}

/**
 * Check if commitment has any deliverables
 *
 * @param commitmentId - UUID of the commitment
 * @returns True if commitment has deliverables
 */
export async function hasDeliverables(commitmentId: string): Promise<boolean> {
  const { count, error } = await supabase
    .from('commitment_deliverables')
    .select('id', { count: 'exact', head: true })
    .eq('commitment_id', commitmentId)

  if (error) {
    throw new Error(`Failed to check deliverables: ${error.message}`)
  }

  return (count ?? 0) > 0
}

/**
 * Get deliverables summary stats for a commitment
 *
 * @param commitmentId - UUID of the commitment
 * @returns Summary statistics
 */
export async function getDeliverablesSummary(commitmentId: string): Promise<{
  total: number
  completed: number
  inProgress: number
  notStarted: number
  blocked: number
  overdue: number
  progress: number
}> {
  const deliverables = await getCommitmentDeliverables(commitmentId)

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const stats = {
    total: deliverables.length,
    completed: 0,
    inProgress: 0,
    notStarted: 0,
    blocked: 0,
    overdue: 0,
    progress: 0,
  }

  if (deliverables.length === 0) return stats

  let totalWeight = 0
  let weightedProgress = 0

  for (const d of deliverables) {
    if (d.status === 'cancelled') continue

    switch (d.status) {
      case 'completed':
        stats.completed++
        break
      case 'in_progress':
        stats.inProgress++
        break
      case 'not_started':
        stats.notStarted++
        break
      case 'blocked':
        stats.blocked++
        break
    }

    // Check if overdue
    const dueDate = new Date(d.due_date)
    dueDate.setHours(0, 0, 0, 0)
    if (dueDate < today && d.status !== 'completed') {
      stats.overdue++
    }

    totalWeight += d.weight
    weightedProgress += d.weight * d.progress
  }

  stats.progress = totalWeight > 0 ? Math.round(weightedProgress / totalWeight) : 0

  return stats
}
