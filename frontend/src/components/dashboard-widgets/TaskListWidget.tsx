/**
 * TaskListWidget Component
 *
 * Displays a list of tasks/work items with grouping,
 * filtering, and sorting options. Supports RTL layout.
 */

import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  CheckCircle2,
  Circle,
  Clock,
  AlertTriangle,
  ChevronRight,
  FileText,
  Inbox,
  ListTodo,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Checkbox } from '@/components/ui/checkbox'
import type { TaskListWidgetConfig } from '@/types/dashboard-widget.types'

// Task item type (simplified from UnifiedWorkItem)
interface TaskItem {
  id: string
  title: string
  description?: string
  source: 'commitment' | 'task' | 'intake'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  deadline?: string
  isOverdue?: boolean
}

interface TaskListWidgetProps {
  config: TaskListWidgetConfig
  data: TaskItem[] | null
  isLoading?: boolean
  onTaskToggle?: (taskId: string, completed: boolean) => void
}

/**
 * Get icon for task source
 */
function getSourceIcon(source: TaskItem['source']) {
  switch (source) {
    case 'commitment':
      return FileText
    case 'task':
      return ListTodo
    case 'intake':
      return Inbox
    default:
      return Circle
  }
}

/**
 * Get color classes for source
 */
function getSourceColor(source: TaskItem['source']) {
  switch (source) {
    case 'commitment':
      return {
        bg: 'bg-blue-100 dark:bg-blue-900/30',
        text: 'text-blue-600 dark:text-blue-400',
      }
    case 'task':
      return {
        bg: 'bg-green-100 dark:bg-green-900/30',
        text: 'text-green-600 dark:text-green-400',
      }
    case 'intake':
      return {
        bg: 'bg-purple-100 dark:bg-purple-900/30',
        text: 'text-purple-600 dark:text-purple-400',
      }
    default:
      return {
        bg: 'bg-muted',
        text: 'text-muted-foreground',
      }
  }
}

/**
 * Get priority badge variant
 */
function getPriorityBadge(priority: TaskItem['priority']) {
  switch (priority) {
    case 'urgent':
      return { variant: 'destructive' as const, label: 'Urgent' }
    case 'high':
      return { variant: 'destructive' as const, label: 'High' }
    case 'medium':
      return { variant: 'secondary' as const, label: 'Medium' }
    case 'low':
      return { variant: 'outline' as const, label: 'Low' }
    default:
      return { variant: 'outline' as const, label: priority }
  }
}

/**
 * Format deadline date
 */
function formatDeadline(deadline: string, locale: string): string {
  const date = new Date(deadline)
  const now = new Date()
  const diffMs = date.getTime() - now.getTime()
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays < 0) {
    return new Intl.RelativeTimeFormat(locale, { numeric: 'auto' }).format(diffDays, 'day')
  } else if (diffDays === 0) {
    return new Intl.RelativeTimeFormat(locale, { numeric: 'auto' }).format(0, 'day')
  } else if (diffDays <= 7) {
    return new Intl.RelativeTimeFormat(locale, { numeric: 'auto' }).format(diffDays, 'day')
  } else {
    return date.toLocaleDateString(locale, { month: 'short', day: 'numeric' })
  }
}

/**
 * Single task item component
 */
function TaskItemComponent({
  task,
  locale,
  isRTL,
  onToggle,
}: {
  task: TaskItem
  locale: string
  isRTL: boolean
  onToggle?: (completed: boolean) => void
}) {
  const { t } = useTranslation('dashboard-widgets')
  const Icon = getSourceIcon(task.source)
  const sourceColors = getSourceColor(task.source)
  const priorityBadge = getPriorityBadge(task.priority)

  const isCompleted = task.status === 'completed'

  return (
    <div
      className={cn(
        'flex items-start gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg transition-colors',
        'hover:bg-muted/50 group',
        isCompleted && 'opacity-60',
      )}
    >
      {/* Checkbox */}
      <div className="pt-0.5">
        <Checkbox
          checked={isCompleted}
          onCheckedChange={(checked) => onToggle?.(checked as boolean)}
          className="h-4 w-4"
        />
      </div>

      {/* Source Icon */}
      <div className={cn('p-1.5 rounded shrink-0', sourceColors.bg)}>
        <Icon className={cn('h-3.5 w-3.5', sourceColors.text)} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <h4
          className={cn(
            'text-sm font-medium truncate',
            isCompleted && 'line-through text-muted-foreground',
          )}
        >
          {task.title}
        </h4>

        <div className="flex flex-wrap items-center gap-1.5 mt-1">
          {/* Source Badge */}
          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
            {t(`sources.${task.source}`)}
          </Badge>

          {/* Priority Badge (only for high/urgent) */}
          {(task.priority === 'high' || task.priority === 'urgent') && (
            <Badge variant={priorityBadge.variant} className="text-[10px] px-1.5 py-0">
              {t(`sortBy.${task.priority}`, priorityBadge.label)}
            </Badge>
          )}

          {/* Deadline */}
          {task.deadline && (
            <div
              className={cn(
                'flex items-center gap-0.5 text-[10px]',
                task.isOverdue ? 'text-destructive' : 'text-muted-foreground',
              )}
            >
              {task.isOverdue ? (
                <AlertTriangle className="h-3 w-3" />
              ) : (
                <Clock className="h-3 w-3" />
              )}
              <span>{formatDeadline(task.deadline, locale)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Chevron */}
      <ChevronRight
        className={cn(
          'h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0 self-center',
          isRTL && 'rotate-180',
        )}
      />
    </div>
  )
}

/**
 * Group header component
 */
function GroupHeader({ label, count }: { label: string; count: number }) {
  return (
    <div className="flex items-center justify-between px-2 py-1.5 bg-muted/50 rounded-lg mb-1">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
        {count}
      </Badge>
    </div>
  )
}

export function TaskListWidget({ config, data, isLoading, onTaskToggle }: TaskListWidgetProps) {
  const { t, i18n } = useTranslation('dashboard-widgets')
  const isRTL = i18n.language === 'ar'
  const locale = isRTL ? 'ar-SA' : 'en-US'

  const { settings } = config

  // Filter, sort, and group tasks
  const processedTasks = useMemo(() => {
    if (!data) return { items: [], groups: null }

    let tasks = [...data]

    // Filter by source
    if (settings.filterSource && settings.filterSource !== 'all') {
      tasks = tasks.filter((t) => t.source === settings.filterSource)
    }

    // Filter completed
    if (!settings.showCompleted) {
      tasks = tasks.filter((t) => t.status !== 'completed')
    }

    // Sort
    tasks.sort((a, b) => {
      switch (settings.sortBy) {
        case 'deadline':
          if (!a.deadline && !b.deadline) return 0
          if (!a.deadline) return 1
          if (!b.deadline) return -1
          return new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
        case 'priority':
          const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 }
          return priorityOrder[a.priority] - priorityOrder[b.priority]
        case 'created_at':
        default:
          return 0
      }
    })

    // Limit items
    tasks = tasks.slice(0, settings.maxItems)

    // Group if needed
    if (settings.groupBy !== 'none') {
      const groups: Record<string, TaskItem[]> = {}
      tasks.forEach((task) => {
        const key = task[settings.groupBy as keyof TaskItem] as string
        if (!groups[key]) groups[key] = []
        groups[key].push(task)
      })
      return { items: [], groups }
    }

    return { items: tasks, groups: null }
  }, [data, settings])

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="h-full space-y-2 animate-pulse">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-start gap-3 p-2">
            <div className="w-4 h-4 bg-muted rounded" />
            <div className="w-6 h-6 bg-muted rounded" />
            <div className="flex-1">
              <div className="h-4 w-3/4 bg-muted rounded mb-1" />
              <div className="h-3 w-1/2 bg-muted rounded" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  // Empty state
  const isEmpty = processedTasks.groups
    ? Object.keys(processedTasks.groups).length === 0
    : processedTasks.items.length === 0

  if (isEmpty) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-4">
        <CheckCircle2 className="h-8 w-8 text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">{t('emptyStates.noTasks')}</p>
      </div>
    )
  }

  return (
    <ScrollArea className="h-full">
      <div className="space-y-1">
        {processedTasks.groups
          ? // Grouped view
            Object.entries(processedTasks.groups).map(([groupKey, groupTasks]) => (
              <div key={groupKey} className="mb-3">
                <GroupHeader
                  label={t(`${settings.groupBy}.${groupKey}`, groupKey)}
                  count={groupTasks.length}
                />
                {groupTasks.map((task) => (
                  <TaskItemComponent
                    key={task.id}
                    task={task}
                    locale={locale}
                    isRTL={isRTL}
                    onToggle={(completed) => onTaskToggle?.(task.id, completed)}
                  />
                ))}
              </div>
            ))
          : // Flat list view
            processedTasks.items.map((task) => (
              <TaskItemComponent
                key={task.id}
                task={task}
                locale={locale}
                isRTL={isRTL}
                onToggle={(completed) => onTaskToggle?.(task.id, completed)}
              />
            ))}
      </div>
    </ScrollArea>
  )
}

export default TaskListWidget
