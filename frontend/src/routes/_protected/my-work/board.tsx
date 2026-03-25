/**
 * Feature 034: Unified Kanban Board - My Work Board View
 *
 * Kanban board view of the unified work items:
 * - Tasks (from tasks table)
 * - Commitments (from aa_commitments)
 * - Intake Tickets (from intake_tickets)
 *
 * Features:
 * - Drag and drop between columns
 * - Multiple column modes (Status, Priority, Tracking Type)
 * - Source filtering (Task, Commitment, Intake)
 * - Real-time updates
 * - Mobile-first, RTL-compatible design
 */

import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { z } from 'zod'
import { useCallback } from 'react'
import { useAuth } from '@/hooks/useAuth'
import {
  useUnifiedKanban,
  useUnifiedKanbanStatusUpdate,
  useUnifiedKanbanRealtime,
} from '@/hooks/useUnifiedKanban'
import { UnifiedKanbanBoard } from '@/components/unified-kanban'
import type { KanbanColumnMode, WorkSource, WorkItem } from '@/types/work-item.types'

// URL search params schema
const boardSearchSchema = z.object({
  mode: z.enum(['status', 'priority', 'tracking_type']).optional().default('status'),
  sources: z.array(z.enum(['commitment', 'task', 'intake'])).optional(),
})

type BoardSearchParams = z.infer<typeof boardSearchSchema>

export const Route = createFileRoute('/_protected/my-work/board')({
  component: MyWorkBoardPage,
  validateSearch: (search) => boardSearchSchema.parse(search),
})

function MyWorkBoardPage() {
const navigate = useNavigate()
  const { user } = useAuth()
  const { mode, sources } = Route.useSearch()

  // Parse sources from URL
  const sourceFilter = sources

  // Fetch kanban data
  const { items, isLoading, isError, refetch, isRefetching } = useUnifiedKanban({
    contextType: 'personal',
    columnMode: mode as KanbanColumnMode,
    sourceFilter,
  })

  // Status update mutation
  const statusMutation = useUnifiedKanbanStatusUpdate()

  // Real-time updates
  useUnifiedKanbanRealtime('personal', null, user?.id || '', !!user)

  // Handle status change from drag and drop
  const handleStatusChange = useCallback(
    async (itemId: string, source: WorkSource, newStatus: string, workflowStage?: string) => {
      await statusMutation.mutateAsync({
        itemId,
        source,
        newStatus,
        newWorkflowStage: workflowStage,
      })
    },
    [statusMutation],
  )

  // Handle item click - navigate to detail page
  const handleItemClick = useCallback(
    (item: WorkItem) => {
      switch (item.source) {
        case 'task':
          navigate({ to: '/my-work/assignments' })
          break
        case 'commitment':
          // Navigate to commitment detail if exists
          break
        case 'intake':
          navigate({ to: '/my-work/intake' })
          break
      }
    },
    [navigate],
  )

  return (
    <div className="flex flex-col h-full">
      <UnifiedKanbanBoard
        contextType="personal"
        columnMode={mode as KanbanColumnMode}
        sourceFilter={sourceFilter}
        items={items}
        isLoading={isLoading}
        isError={isError}
        onStatusChange={handleStatusChange}
        onItemClick={handleItemClick}
        onRefresh={() => refetch()}
        isRefreshing={isRefetching}
        showFilters
        showModeSwitch
        className="h-full"
      />
    </div>
  )
}
