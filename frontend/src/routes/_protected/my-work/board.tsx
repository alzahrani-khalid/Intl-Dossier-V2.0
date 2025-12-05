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
import { useTranslation } from 'react-i18next'
import { useCallback } from 'react'
import { useAuth } from '@/hooks/useAuth'
import {
  useUnifiedKanban,
  useUnifiedKanbanStatusUpdate,
  useUnifiedKanbanRealtime,
} from '@/hooks/useUnifiedKanban'
import { UnifiedKanbanBoard } from '@/components/unified-kanban'
import { Button } from '@/components/ui/button'
import { List } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { KanbanColumnMode, WorkSource, WorkItem } from '@/types/work-item.types'

// URL search params schema
const boardSearchSchema = z.object({
  mode: z.enum(['status', 'priority', 'tracking_type']).optional().default('status'),
  sources: z
    .string()
    .optional()
    .transform((val) => (val ? (val.split(',') as WorkSource[]) : undefined)),
})

export type BoardSearchParams = z.infer<typeof boardSearchSchema>

export const Route = createFileRoute('/_protected/my-work/board')({
  component: MyWorkBoardPage,
  validateSearch: (search) => boardSearchSchema.parse(search),
})

function MyWorkBoardPage() {
  const { t, i18n } = useTranslation('unified-kanban')
  const isRTL = i18n.language === 'ar'
  const navigate = useNavigate()
  const { user } = useAuth()
  const { mode, sources } = Route.useSearch()

  // Parse sources from URL
  const sourceFilter = sources as WorkSource[] | undefined

  // Fetch kanban data
  const { items, columns, totalCount, isLoading, isError, refetch, isRefetching } =
    useUnifiedKanban({
      contextType: 'personal',
      columnMode: mode as KanbanColumnMode,
      sourceFilter,
    })

  // Status update mutation
  const statusMutation = useUnifiedKanbanStatusUpdate()

  // Real-time updates
  useUnifiedKanbanRealtime('personal', null, user?.id || '', !!user)

  // Handle column mode change
  const handleColumnModeChange = useCallback(
    (newMode: KanbanColumnMode) => {
      navigate({
        to: '/my-work/board',
        search: { mode: newMode, sources: sourceFilter?.join(',') },
      })
    },
    [navigate, sourceFilter],
  )

  // Handle source filter change
  const handleSourceFilterChange = useCallback(
    (newSources: WorkSource[]) => {
      navigate({
        to: '/my-work/board',
        search: {
          mode: mode as KanbanColumnMode,
          sources: newSources.length > 0 ? newSources.join(',') : undefined,
        },
      })
    },
    [navigate, mode],
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

  // Navigate to list view
  const handleSwitchToList = useCallback(() => {
    navigate({ to: '/my-work' })
  }, [navigate])

  return (
    <div className="flex flex-col h-full" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Top bar with view toggle */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-2 border-b bg-background">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold">{t('context.personal')}</h1>
        </div>
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

      {/* Kanban Board */}
      <div className="flex-1 overflow-hidden">
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
    </div>
  )
}
