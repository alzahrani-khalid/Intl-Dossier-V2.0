/**
 * Swimlane Utilities for Unified Kanban Board
 * Feature: kanban-task-board
 *
 * Provides utilities for grouping work items into swimlanes
 * by assignee or priority.
 */

import type { WorkItem, SwimlaneMode, Swimlane, Priority } from '@/types/work-item.types'

/**
 * Priority display info
 */
const PRIORITY_INFO: Record<Priority, { title: string; titleAr: string }> = {
  urgent: { title: 'Urgent', titleAr: 'عاجل' },
  high: { title: 'High Priority', titleAr: 'أولوية عالية' },
  medium: { title: 'Medium Priority', titleAr: 'أولوية متوسطة' },
  low: { title: 'Low Priority', titleAr: 'أولوية منخفضة' },
}

/**
 * Group items into swimlanes based on the selected mode
 */
export function groupIntoSwimlanes(items: WorkItem[], mode: SwimlaneMode): Swimlane[] {
  if (mode === 'none') {
    return []
  }

  if (mode === 'assignee') {
    return groupByAssignee(items)
  }

  if (mode === 'priority') {
    return groupByPriority(items)
  }

  return []
}

/**
 * Group items by assignee
 */
function groupByAssignee(items: WorkItem[]): Swimlane[] {
  const grouped = new Map<string, WorkItem[]>()
  const unassigned: WorkItem[] = []

  items.forEach((item) => {
    if (item.assignee) {
      const key = item.assignee.id
      if (!grouped.has(key)) {
        grouped.set(key, [])
      }
      grouped.get(key)!.push(item)
    } else {
      unassigned.push(item)
    }
  })

  const swimlanes: Swimlane[] = []

  // Add assignee swimlanes sorted by name
  const sortedEntries = Array.from(grouped.entries()).sort((a, b) => {
    const nameA = items.find((i) => i.assignee?.id === a[0])?.assignee?.name || ''
    const nameB = items.find((i) => i.assignee?.id === b[0])?.assignee?.name || ''
    return nameA.localeCompare(nameB)
  })

  sortedEntries.forEach(([assigneeId, assigneeItems]) => {
    const firstItem = assigneeItems[0]
    if (!firstItem || !firstItem.assignee) return
    const assignee = firstItem.assignee
    swimlanes.push({
      id: assigneeId,
      title: assignee.name,
      titleAr: assignee.name_ar,
      items: assigneeItems,
      collapsed: false,
    })
  })

  // Add unassigned swimlane at the end
  if (unassigned.length > 0) {
    swimlanes.push({
      id: 'unassigned',
      title: 'Unassigned',
      titleAr: 'غير مسند',
      items: unassigned,
      collapsed: false,
    })
  }

  return swimlanes
}

/**
 * Group items by priority
 */
function groupByPriority(items: WorkItem[]): Swimlane[] {
  const grouped = new Map<Priority, WorkItem[]>()

  // Initialize all priority groups
  const priorities: Priority[] = ['urgent', 'high', 'medium', 'low']
  priorities.forEach((p) => grouped.set(p, []))

  items.forEach((item) => {
    const priority = item.priority || 'medium'
    grouped.get(priority)!.push(item)
  })

  const swimlanes: Swimlane[] = []

  // Add swimlanes in priority order
  priorities.forEach((priority) => {
    const priorityItems = grouped.get(priority)!
    if (priorityItems.length > 0) {
      swimlanes.push({
        id: priority,
        title: PRIORITY_INFO[priority].title,
        titleAr: PRIORITY_INFO[priority].titleAr,
        items: priorityItems,
        collapsed: false,
      })
    }
  })

  return swimlanes
}

/**
 * Get items for a specific swimlane and column
 */
export function getSwimlanColumnItems(swimlane: Swimlane, columnKey: string): WorkItem[] {
  return swimlane.items.filter((item) => item.column_key === columnKey)
}

/**
 * Get swimlane color based on priority (for priority swimlanes)
 */
export function getSwimlaneColor(swimlaneId: string): string {
  switch (swimlaneId) {
    case 'urgent':
      return 'border-s-red-500'
    case 'high':
      return 'border-s-orange-500'
    case 'medium':
      return 'border-s-yellow-500'
    case 'low':
      return 'border-s-slate-400'
    default:
      return 'border-s-blue-500'
  }
}

/**
 * Get swimlane background color
 */
export function getSwimlaneBackground(swimlaneId: string): string {
  switch (swimlaneId) {
    case 'urgent':
      return 'bg-red-50/50'
    case 'high':
      return 'bg-orange-50/50'
    case 'medium':
      return 'bg-yellow-50/50'
    case 'low':
      return 'bg-slate-50/50'
    case 'unassigned':
      return 'bg-muted/30'
    default:
      return 'bg-background'
  }
}
