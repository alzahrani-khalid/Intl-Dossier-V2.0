/**
 * useUnifiedKanban - Hook for fetching and managing Kanban data
 * Feature: 034-unified-kanban
 *
 * Provides:
 * - Fetch work items grouped by column
 * - Status update mutations with optimistic updates
 * - Real-time subscriptions
 *
 * IMPORTANT: Status values written to the database must match enum definitions:
 * - ticket_status: draft, submitted, triaged, assigned, in_progress, converted, closed, merged
 * - task_status: pending, in_progress, completed, cancelled
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'
import { mapStatusToColumnKey } from '@/components/unified-kanban/utils/column-definitions'
import type {
  KanbanContextType,
  KanbanColumnMode,
  WorkSource,
  WorkItem,
  WorkItemAssignee,
  KanbanData,
} from '@/types/work-item.types'

// ============================================
// Status Validation Constants
// ============================================

/**
 * Valid ticket_status enum values from database
 * @see supabase/migrations/20250129001_create_intake_tickets_table.sql
 */
const VALID_TICKET_STATUSES = [
  'draft',
  'submitted',
  'triaged',
  'assigned',
  'in_progress',
  'converted',
  'closed',
  'merged',
] as const

type TicketStatus = (typeof VALID_TICKET_STATUSES)[number]

/**
 * Validates if a status is a valid ticket_status enum value
 */
function isValidTicketStatus(status: string): status is TicketStatus {
  return VALID_TICKET_STATUSES.includes(status as TicketStatus)
}

// ============================================
// Types
// ============================================

interface UseUnifiedKanbanOptions {
  contextType: KanbanContextType
  contextId?: string
  columnMode?: KanbanColumnMode
  sourceFilter?: WorkSource[]
  limitPerColumn?: number
  enabled?: boolean
}

interface KanbanRpcRow {
  id: string
  source: string
  title: string
  title_ar: string | null
  description: string | null
  priority: string
  status: string
  workflow_stage: string | null
  column_key: string
  tracking_type: string
  deadline: string | null
  is_overdue: boolean
  days_until_due: number | null
  assignee_id: string | null
  assignee_name: string | null
  assignee_avatar_url: string | null
  dossier_id: string | null
  engagement_id: string | null
  created_at: string
  updated_at: string
  metadata: Record<string, unknown>
}

// ============================================
// Query Keys
// ============================================

export const kanbanKeys = {
  all: ['unified-kanban'] as const,
  list: (params: UseUnifiedKanbanOptions) => [...kanbanKeys.all, 'list', params] as const,
}

// ============================================
// Data Transformation
// ============================================

function transformRpcRowToWorkItem(row: KanbanRpcRow): WorkItem {
  const assignee: WorkItemAssignee | null = row.assignee_id
    ? {
        id: row.assignee_id,
        name: row.assignee_name || 'Unknown',
        avatar_url: row.assignee_avatar_url,
      }
    : null

  return {
    id: row.id,
    source: row.source as WorkSource,
    title: row.title,
    title_ar: row.title_ar || undefined,
    description: row.description,
    priority: row.priority as WorkItem['priority'],
    status: row.status as WorkItem['status'],
    workflow_stage: row.workflow_stage as WorkItem['workflow_stage'],
    column_key: row.column_key,
    tracking_type: row.tracking_type as WorkItem['tracking_type'],
    deadline: row.deadline,
    is_overdue: row.is_overdue,
    days_until_due: row.days_until_due,
    assignee,
    dossier_id: row.dossier_id,
    engagement_id: row.engagement_id,
    created_at: row.created_at,
    updated_at: row.updated_at,
    metadata: row.metadata as WorkItem['metadata'],
  }
}

function groupItemsByColumn(items: WorkItem[]): Record<string, WorkItem[]> {
  const grouped: Record<string, WorkItem[]> = {}

  items.forEach((item) => {
    const key = item.column_key
    if (!grouped[key]) {
      grouped[key] = []
    }
    grouped[key].push(item)
  })

  return grouped
}

// ============================================
// Main Hook
// ============================================

export function useUnifiedKanban(options: UseUnifiedKanbanOptions) {
  const {
    contextType,
    contextId,
    columnMode = 'status',
    sourceFilter,
    limitPerColumn = 50,
    enabled = true,
  } = options

  // Fetch kanban data
  const query = useQuery({
    queryKey: kanbanKeys.list(options),
    queryFn: async (): Promise<KanbanData> => {
      const { data, error } = await supabase.rpc('get_unified_work_kanban', {
        p_context_type: contextType,
        p_context_id: contextId || null,
        p_column_mode: columnMode,
        p_source_filter: sourceFilter?.length ? sourceFilter : null,
        p_limit_per_column: limitPerColumn,
      })

      if (error) {
        throw new Error(error.message)
      }

      const items = (data as KanbanRpcRow[]).map(transformRpcRowToWorkItem)
      const columns = groupItemsByColumn(items)

      // Get unique column keys and sort them
      const columnOrder = [...new Set(items.map((i) => i.column_key))]

      return {
        columns,
        columnOrder,
        totalCount: items.length,
        hasMore: {}, // TODO: Implement per-column pagination
      }
    },
    enabled,
    staleTime: 30 * 1000, // 30 seconds
    refetchOnWindowFocus: true,
  })

  // Flatten items for easier access
  const allItems = useMemo(() => {
    if (!query.data?.columns) return []
    return Object.values(query.data.columns).flat()
  }, [query.data?.columns])

  return {
    ...query,
    items: allItems,
    columns: query.data?.columns || {},
    columnOrder: query.data?.columnOrder || [],
    totalCount: query.data?.totalCount || 0,
  }
}

// ============================================
// Status Update Mutation Hook
// ============================================

interface StatusUpdateParams {
  itemId: string
  source: WorkSource
  newStatus: string
  newWorkflowStage?: string
}

/**
 * Maps column key to valid database status for intake tickets
 * Ensures we never write invalid statuses to the database
 */
function mapToValidIntakeStatus(columnKeyOrStatus: string): TicketStatus {
  // If it's already a valid status, return it
  if (isValidTicketStatus(columnKeyOrStatus)) {
    return columnKeyOrStatus
  }

  // Map kanban column keys to valid ticket_status values
  switch (columnKeyOrStatus) {
    case 'todo':
      return 'submitted'
    case 'in_progress':
      return 'in_progress'
    case 'done':
      // FIXED: Use 'converted' instead of 'resolved' (which doesn't exist)
      return 'converted'
    case 'cancelled':
      return 'closed'
    default:
      // Fallback to a safe default
      console.warn(
        `[useUnifiedKanban] Unknown status/column key: ${columnKeyOrStatus}, defaulting to 'submitted'`,
      )
      return 'submitted'
  }
}

export function useUnifiedKanbanStatusUpdate() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({ itemId, source, newStatus, newWorkflowStage }: StatusUpdateParams) => {
      // Update based on source type
      if (source === 'task') {
        const { data, error } = await supabase
          .from('tasks')
          .update({
            status: newStatus,
            workflow_stage: newWorkflowStage,
            updated_at: new Date().toISOString(),
          })
          .eq('id', itemId)
          .select()
          .single()

        if (error) throw error
        return data
      }

      if (source === 'commitment') {
        const { data, error } = await supabase
          .from('aa_commitments')
          .update({
            status: newStatus,
            updated_at: new Date().toISOString(),
          })
          .eq('id', itemId)
          .select()
          .single()

        if (error) throw error
        return data
      }

      if (source === 'intake') {
        // FIXED: Validate and map status to valid ticket_status enum value
        const validStatus = mapToValidIntakeStatus(newStatus)

        // Extra validation - ensure we're not writing an invalid status
        if (!isValidTicketStatus(validStatus)) {
          throw new Error(
            `Invalid intake ticket status: "${newStatus}" (mapped to "${validStatus}"). ` +
              `Valid statuses are: ${VALID_TICKET_STATUSES.join(', ')}`,
          )
        }

        const { data, error } = await supabase
          .from('intake_tickets')
          .update({
            status: validStatus,
            updated_at: new Date().toISOString(),
          })
          .eq('id', itemId)
          .select()
          .single()

        if (error) throw error
        return data
      }

      throw new Error('Unknown source type')
    },

    onMutate: async (variables) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: kanbanKeys.all })

      // Snapshot previous state
      const previousData = queryClient.getQueriesData({ queryKey: kanbanKeys.all })

      // Optimistically update the cache
      queryClient.setQueriesData({ queryKey: kanbanKeys.all }, (old: KanbanData | undefined) => {
        if (!old) return old

        // Find and update the item
        const newColumns = { ...old.columns }

        for (const columnKey of Object.keys(newColumns)) {
          const columnItems = newColumns[columnKey]
          if (!columnItems) continue

          const itemIndex = columnItems.findIndex((i) => i.id === variables.itemId)

          if (itemIndex !== -1) {
            // Remove from current column
            const [item] = columnItems.splice(itemIndex, 1)
            if (!item) continue

            // Update item status
            const updatedItem: WorkItem = {
              ...item,
              status: variables.newStatus as WorkItem['status'],
              workflow_stage:
                (variables.newWorkflowStage as WorkItem['workflow_stage']) || item.workflow_stage,
              column_key: mapStatusToColumnKey(
                item.source,
                variables.newStatus,
                variables.newWorkflowStage,
              ),
            }

            // Add to new column
            const newColumnKey = updatedItem.column_key
            if (!newColumns[newColumnKey]) {
              newColumns[newColumnKey] = []
            }
            newColumns[newColumnKey].push(updatedItem)

            break
          }
        }

        return {
          ...old,
          columns: newColumns,
        }
      })

      return { previousData }
    },

    onError: (error, _variables, context) => {
      // Rollback on error
      if (context?.previousData) {
        context.previousData.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data)
        })
      }

      toast({
        title: 'Failed to update status',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      })
    },

    onSettled: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: kanbanKeys.all })
    },
  })
}

// ============================================
// Realtime Subscription Hook
// ============================================

export function useUnifiedKanbanRealtime(
  contextType: KanbanContextType,
  contextId: string | null,
  userId: string,
  enabled = true,
) {
  const queryClient = useQueryClient()

  // Debounced invalidation
  const invalidateWithDebounce = useCallback(() => {
    // Use a simple debounce - invalidate after 300ms
    const timeoutId = setTimeout(() => {
      queryClient.invalidateQueries({ queryKey: kanbanKeys.all })
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [queryClient])

  // Set up subscriptions using useEffect (not useCallback!)
  useEffect(() => {
    if (!enabled) return

    const channels: ReturnType<typeof supabase.channel>[] = []

    // Subscribe to tasks
    const tasksChannel = supabase
      .channel('kanban-tasks')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
          filter: contextType === 'personal' ? `assignee_id=eq.${userId}` : undefined,
        },
        invalidateWithDebounce,
      )
      .subscribe()

    channels.push(tasksChannel)

    // Subscribe to commitments (use owner_user_id, not owner_id)
    const commitmentsChannel = supabase
      .channel('kanban-commitments')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'aa_commitments',
          filter: contextType === 'personal' ? `owner_user_id=eq.${userId}` : undefined,
        },
        invalidateWithDebounce,
      )
      .subscribe()

    channels.push(commitmentsChannel)

    // Subscribe to intake tickets
    const intakeChannel = supabase
      .channel('kanban-intake')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'intake_tickets',
          filter: contextType === 'personal' ? `assigned_to=eq.${userId}` : undefined,
        },
        invalidateWithDebounce,
      )
      .subscribe()

    channels.push(intakeChannel)

    // Cleanup function
    return () => {
      channels.forEach((channel) => {
        supabase.removeChannel(channel)
      })
    }
  }, [contextType, contextId, userId, enabled, invalidateWithDebounce])
}
