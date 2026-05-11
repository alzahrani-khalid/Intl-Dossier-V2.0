import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

// Types based on API spec
export interface Attachment {
  id: string
  file_key: string
  file_name: string
  file_size: number
  mime_type: string
  uploaded_at: string
  uploaded_by: string
}

export interface Decision {
  id: string
  after_action_id: string
  description: string
  rationale?: string | null
  decision_maker: string
  decision_date: string
  created_at: string
}

export interface CreateDecision {
  description: string
  rationale?: string
  decision_maker: string
  decision_date: string
}

export interface Commitment {
  id: string
  after_action_id: string
  dossier_id: string
  description: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'overdue'
  owner_type: 'internal' | 'external'
  owner_user_id?: string | null
  owner_contact_id?: string | null
  tracking_mode: 'automatic' | 'manual'
  due_date: string
  completed_at?: string | null
  ai_confidence?: number | null
}

export interface CreateCommitment {
  description: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  owner_type: 'internal' | 'external'
  owner_user_id?: string
  owner_contact_email?: string
  owner_contact_name?: string
  due_date: string
  ai_confidence?: number
}

export interface Risk {
  id: string
  after_action_id: string
  description: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  likelihood: 'unlikely' | 'possible' | 'likely' | 'certain'
  mitigation_strategy?: string | null
  owner?: string | null
  ai_confidence?: number | null
}

export interface CreateRisk {
  description: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  likelihood: 'unlikely' | 'possible' | 'likely' | 'certain'
  mitigation_strategy?: string
  owner?: string
  ai_confidence?: number
}

export interface FollowUpAction {
  id: string
  after_action_id: string
  description: string
  assigned_to?: string | null
  target_date?: string | null
  completed: boolean
}

export interface CreateFollowUpAction {
  description: string
  assigned_to?: string
  target_date?: string
}

export interface AfterActionRecord {
  id: string
  engagement_id: string
  dossier_id: string
  title?: string
  publication_status: 'draft' | 'published' | 'edit_requested' | 'edit_approved' | 'edit_rejected'
  is_confidential: boolean
  attendees?: string[]
  notes?: string | null
  decisions?: Decision[]
  commitments?: Commitment[]
  risks?: Risk[]
  follow_up_actions?: FollowUpAction[]
  linked_tasks?: Array<{ id: string; title?: string; status?: string }>
  created_by: string
  created_by_name?: string
  created_at: string
  updated_by?: string | null
  updated_at: string
  published_by?: string | null
  published_by_name?: string
  published_at?: string | null
  version: number
  /** Internal optimistic update version counter */
  _version?: number
  attachments?: Attachment[]
  [key: string]: unknown
}

/**
 * AfterActionRecord enriched with engagement + dossier joins returned by the
 * `after-actions-list-all` Edge Function (Phase 42-01). The cross-dossier table
 * needs Engagement title + Dossier name without an extra round-trip.
 */
export interface AfterActionRecordWithJoins extends AfterActionRecord {
  engagement?: {
    id: string
    title_en: string
    title_ar: string
    engagement_date: string
  }
  dossier?: {
    id: string
    name_en: string
    name_ar: string
  }
}

export interface CreateAfterActionRequest {
  engagement_id: string
  is_confidential: boolean
  attendees?: string[]
  notes?: string
  decisions?: CreateDecision[]
  commitments?: CreateCommitment[]
  risks?: CreateRisk[]
  follow_up_actions?: CreateFollowUpAction[]
}

export interface UpdateAfterActionRequest extends CreateAfterActionRequest {
  version: number
  updated_at?: string
}

export interface ConflictError {
  error: 'CONFLICT'
  message: string
  serverUpdatedAt: string | null
}

export interface AfterActionVersion {
  id: string
  after_action_id: string
  version_number: number
  publication_status: 'draft' | 'published' | 'edit_requested' | 'edit_approved' | 'edit_rejected'
  is_confidential: boolean
  attendees?: string[]
  notes?: string | null
  decisions?: Decision[]
  commitments?: Commitment[]
  risks?: Risk[]
  follow_up_actions?: FollowUpAction[]
  created_by: string
  created_at: string
  superseded: boolean
}

// Fetch single after-action by ID
// WR-08: explicit `id !== undefined && id !== ''` guard satisfies
// strict-boolean-expressions; explicit return type added.
export function useAfterAction(id: string | undefined): UseQueryResult<AfterActionRecord, Error> {
  const isReady = id !== undefined && id !== ''
  return useQuery({
    queryKey: ['after-action', id],
    queryFn: async (): Promise<AfterActionRecord> => {
      // Unreachable when isReady is false (enabled gates the queryFn), but kept
      // as a defensive narrow so the type below holds without `as`.
      if (!isReady) throw new Error('After-action ID is required')

      const { data, error } = await supabase.functions.invoke('after-actions-get', {
        body: { id },
      })

      if (error) throw error
      return data as AfterActionRecord
    },
    enabled: isReady,
  })
}

// Fetch after-actions list across every dossier the caller can read via RLS.
// Backed by the `after-actions-list-all` Edge Function (Phase 42-01). Cache key
// `['after-actions', 'all', options]` is intentionally distinct from the
// per-dossier `['after-actions', dossierId, options]` so invalidations don't
// collide.
export function useAfterActionsAll(options?: {
  status?: 'draft' | 'published' | 'edit_requested' | 'edit_approved'
  limit?: number
  offset?: number
}): UseQueryResult<{ data: AfterActionRecordWithJoins[]; total: number }, Error> {
  return useQuery({
    queryKey: ['after-actions', 'all', options],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('after-actions-list-all', {
        body: { ...options },
      })

      if (error) throw error
      return data as { data: AfterActionRecordWithJoins[]; total: number }
    },
  })
}

// Create after-action mutation
// WR-08: explicit return type satisfies explicit-function-return-type.
export function useCreateAfterAction(): UseMutationResult<
  AfterActionRecord,
  Error,
  CreateAfterActionRequest
> {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (request: CreateAfterActionRequest): Promise<AfterActionRecord> => {
      const { data, error } = await supabase.functions.invoke('after-actions-create', {
        body: request,
      })

      if (error) throw error
      return data as AfterActionRecord
    },
    onSuccess: (data) => {
      // Invalidate after-actions list for the dossier
      queryClient.invalidateQueries({ queryKey: ['after-actions', data.dossier_id] })
      // CR-03: invalidate the cross-dossier list as well so the global
      // /after-actions page reflects the new record. Prefix-match key.
      queryClient.invalidateQueries({ queryKey: ['after-actions', 'all'] })
      // Invalidate engagement so its detail page reflects the new after-action
      queryClient.invalidateQueries({ queryKey: ['engagement', data.engagement_id] })
      // Set the single after-action in cache
      queryClient.setQueryData(['after-action', data.id], data)
    },
  })
}

// Update after-action mutation with optimistic locking via updated_at (D-41)
// WR-08: explicit return type added.
export function useUpdateAfterAction(
  id: string,
): UseMutationResult<
  AfterActionRecord,
  Error,
  UpdateAfterActionRequest,
  { previousAfterAction: AfterActionRecord | undefined }
> {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (request: UpdateAfterActionRequest): Promise<AfterActionRecord> => {
      const { data, error } = await supabase.functions.invoke('after-actions-update', {
        body: { id, ...request },
      })

      if (error != null) {
        // Check for 409 conflict response
        const parsed =
          typeof error.message === 'string'
            ? (() => {
                try {
                  return JSON.parse(error.message) as Record<string, unknown>
                } catch {
                  return null
                }
              })()
            : null
        if (
          parsed != null &&
          typeof parsed === 'object' &&
          'error' in parsed &&
          parsed.error === 'CONFLICT'
        ) {
          const conflictData: ConflictError = {
            error: 'CONFLICT',
            message: String(
              (parsed as Record<string, unknown>).message ??
                'This record was modified by another user.',
            ),
            serverUpdatedAt:
              ((parsed as Record<string, unknown>).serverUpdatedAt as string | null) ?? null,
          }
          const conflictErr = new Error(conflictData.message)
          ;(conflictErr as Error & { conflict: ConflictError }).conflict = conflictData
          throw conflictErr
        }
        // Check legacy conflict pattern
        if (
          typeof error.message === 'string' &&
          (error.message.includes('version') || error.message.includes('conflict'))
        ) {
          const conflictErr = new Error('Record was modified by another user. Please refresh.')
          ;(conflictErr as Error & { conflict: ConflictError }).conflict = {
            error: 'CONFLICT',
            message: 'Record was modified by another user.',
            serverUpdatedAt: null,
          }
          throw conflictErr
        }
        throw error
      }
      return data as AfterActionRecord
    },
    onMutate: async (newData) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['after-action', id] })

      // Snapshot previous value
      const previousAfterAction = queryClient.getQueryData<AfterActionRecord>(['after-action', id])

      // Optimistically update
      if (previousAfterAction != null) {
        queryClient.setQueryData(['after-action', id], {
          ...previousAfterAction,
          ...newData,
          version: newData.version + 1,
          updated_at: new Date().toISOString(),
        })
      }

      return { previousAfterAction }
    },
    onError: (_err, _newData, context) => {
      // Rollback on error
      if (context?.previousAfterAction != null) {
        queryClient.setQueryData(['after-action', id], context.previousAfterAction)
      }
    },
    onSuccess: (data) => {
      // Update cache with server data
      queryClient.setQueryData(['after-action', id], data)
      // Invalidate list
      queryClient.invalidateQueries({ queryKey: ['after-actions', data.dossier_id] })
      // CR-03: also invalidate cross-dossier list so /after-actions reflects the edit.
      queryClient.invalidateQueries({ queryKey: ['after-actions', 'all'] })
    },
  })
}

// Fetch version history for an after-action
// WR-08: explicit guard + explicit return type.
export function useAfterActionVersions(
  afterActionId: string | undefined,
): UseQueryResult<AfterActionVersion[], Error> {
  const isReady = afterActionId !== undefined && afterActionId !== ''
  return useQuery({
    queryKey: ['after-action-versions', afterActionId],
    queryFn: async (): Promise<AfterActionVersion[]> => {
      if (!isReady) throw new Error('After-action ID is required')

      const { data, error } = await supabase.functions.invoke('after-actions-versions', {
        body: { after_action_id: afterActionId },
      })

      if (error) throw error
      return data as AfterActionVersion[]
    },
    enabled: isReady,
  })
}
