/**
 * Engagement Kanban Hook (Domain)
 * @module domains/engagements/hooks/useEngagementKanban
 *
 * TanStack Query hook for engagement kanban board.
 * Delegates API calls to engagements.repository.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useMemo, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import * as engagementsRepo from '../repositories/engagements.repository'
import type { KanbanAssignment, KanbanColumns, SortOption, WorkflowStage } from '../types'

export type { KanbanAssignment, KanbanColumns, SortOption, WorkflowStage }

export function useEngagementKanban(
  engagementId: string,
  sortBy: SortOption = 'created_at',
): {
  assignments: KanbanAssignment[]
  columns: KanbanColumns | undefined
  stats: {
    total: number
    todo: number
    in_progress: number
    review: number
    done: number
    progressPercentage: number
  }
  handleDragEnd: (assignmentId: string, newStage: WorkflowStage) => void
  isLoading: boolean
  error: Error | null
} {
  const queryClient = useQueryClient()

  const {
    data: columns,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['engagement-kanban', engagementId, sortBy],
    queryFn: async (): Promise<KanbanColumns> => {
      return engagementsRepo.getEngagementKanban(engagementId, sortBy)
    },
    enabled: !!engagementId,
  })

  const assignments = useMemo(() => {
    if (!columns) return []
    return [
      ...(columns.todo || []),
      ...(columns.in_progress || []),
      ...(columns.review || []),
      ...(columns.done || []),
      ...(columns.cancelled || []),
    ]
  }, [columns])

  const stats = useMemo(() => {
    if (!columns) {
      return {
        total: 0,
        todo: 0,
        in_progress: 0,
        review: 0,
        done: 0,
        progressPercentage: 0,
      }
    }

    const total = assignments.length
    const done = columns.done?.length || 0
    const progressPercentage = total > 0 ? Math.round((done / total) * 100) : 0

    return {
      total,
      todo: columns.todo?.length || 0,
      in_progress: columns.in_progress?.length || 0,
      review: columns.review?.length || 0,
      done,
      progressPercentage,
    }
  }, [columns, assignments])

  const updateStageMutation = useMutation({
    mutationFn: async ({
      assignmentId,
      newStage,
    }: {
      assignmentId: string
      newStage: WorkflowStage
    }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('User not authenticated')
      }

      return engagementsRepo.updateWorkflowStage(assignmentId, newStage, user.id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['engagement-kanban', engagementId] })
    },
  })

  const handleDragEnd = useCallback(
    (assignmentId: string, newStage: WorkflowStage) => {
      updateStageMutation.mutate({ assignmentId, newStage })
    },
    [updateStageMutation],
  )

  return {
    assignments,
    columns,
    stats,
    handleDragEnd,
    isLoading,
    error: error as Error | null,
  }
}
