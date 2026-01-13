/**
 * Feature: kanban-task-board
 *
 * Full-featured Kanban Task Board with:
 * - Drag-and-drop between columns
 * - Swimlanes (by assignee or priority)
 * - WIP (Work In Progress) limits with warnings
 * - Bulk operations (multi-select, bulk move, bulk assign)
 * - Real-time collaboration
 * - Mobile-first responsive design
 * - RTL support for Arabic
 */

import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { useTranslation } from 'react-i18next'
import { useCallback, useMemo } from 'react'
import { useAuth } from '@/hooks/useAuth'
import {
  useUnifiedKanban,
  useUnifiedKanbanStatusUpdate,
  useUnifiedKanbanRealtime,
} from '@/hooks/useUnifiedKanban'
import { EnhancedKanbanBoard } from '@/components/unified-kanban'
import { Button } from '@/components/ui/button'
import { List } from 'lucide-react'
import type {
  KanbanColumnMode,
  WorkSource,
  WorkItem,
  SwimlaneMode,
  WipLimits,
} from '@/types/work-item.types'

// URL search params schema
const kanbanSearchSchema = z.object({
  mode: z.enum(['status', 'priority', 'tracking_type']).optional().default('status'),
  sources: z
    .string()
    .optional()
    .transform((val) => (val ? (val.split(',') as WorkSource[]) : undefined)),
  swimlane: z.enum(['none', 'assignee', 'priority']).optional().default('none'),
  wipInProgress: z.coerce.number().optional().default(5),
  wipReview: z.coerce.number().optional().default(3),
})

export type KanbanSearchParams = z.infer<typeof kanbanSearchSchema>

export const Route = createFileRoute('/_protected/kanban')({
  component: KanbanTaskBoardPage,
  validateSearch: (search) => kanbanSearchSchema.parse(search),
})

function KanbanTaskBoardPage() {
  const { t, i18n } = useTranslation('unified-kanban')
  const isRTL = i18n.language === 'ar'
  const { user } = useAuth()
  const { mode, sources, swimlane, wipInProgress, wipReview } = Route.useSearch()

  // Parse sources from URL
  const sourceFilter = sources as WorkSource[] | undefined

  // Build WIP limits from URL params
  const wipLimits: WipLimits = useMemo(
    () => ({
      in_progress: wipInProgress,
      review: wipReview,
    }),
    [wipInProgress, wipReview],
  )

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

  // Handle swimlane mode change
  const handleSwimlaneChange = useCallback(
    (newSwimlane: SwimlaneMode) => {
      const params = new URLSearchParams()
      params.set('mode', mode)
      params.set('swimlane', newSwimlane)
      params.set('wipInProgress', String(wipInProgress))
      params.set('wipReview', String(wipReview))
      window.location.href = `/kanban?${params.toString()}`
    },
    [mode, wipInProgress, wipReview],
  )

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
  const handleItemClick = useCallback((item: WorkItem) => {
    switch (item.source) {
      case 'task':
        // Navigate using window.location for cross-route navigation
        window.location.href = `/tasks/${item.id}`
        break
      case 'commitment':
        window.location.href = '/commitments'
        break
      case 'intake':
        window.location.href = `/intake/tickets/${item.id}`
        break
    }
  }, [])

  // Navigate to list view
  const handleSwitchToList = useCallback(() => {
    window.location.href = '/my-work'
  }, [])

  return (
    <div className="flex flex-col h-full" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Top bar with view toggle */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b bg-background">
        <div className="flex items-center gap-3">
          <h1 className="text-xl sm:text-2xl font-bold">{t('title')}</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSwitchToList}
            className="flex items-center gap-2"
          >
            <List className="h-4 w-4" />
            <span className="hidden sm:inline">{t('viewModes.list')}</span>
          </Button>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 overflow-hidden">
        <EnhancedKanbanBoard
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
          swimlaneMode={swimlane as SwimlaneMode}
          onSwimlaneChange={handleSwimlaneChange}
          wipLimits={wipLimits}
          enableBulkOperations
          enableWipWarnings
          className="h-full"
        />
      </div>
    </div>
  )
}
