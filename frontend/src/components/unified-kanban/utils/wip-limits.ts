/**
 * WIP (Work In Progress) Limits Utilities
 * Feature: kanban-task-board
 *
 * Provides utilities for managing and validating WIP limits
 * on Kanban board columns.
 */

import type { WorkItem, WipLimits } from '@/types/work-item.types'

/**
 * WIP limit status
 */
export interface WipStatus {
  current: number
  limit: number | null
  isAtLimit: boolean
  isOverLimit: boolean
  percentage: number
}

/**
 * Check if a column is at or over its WIP limit
 */
export function checkWipLimit(
  columnKey: string,
  itemCount: number,
  wipLimits: WipLimits,
): WipStatus {
  const limit = wipLimits[columnKey]

  if (limit === undefined || limit === null || limit <= 0) {
    return {
      current: itemCount,
      limit: null,
      isAtLimit: false,
      isOverLimit: false,
      percentage: 0,
    }
  }

  return {
    current: itemCount,
    limit,
    isAtLimit: itemCount >= limit,
    isOverLimit: itemCount > limit,
    percentage: Math.min(100, Math.round((itemCount / limit) * 100)),
  }
}

/**
 * Check if adding an item to a column would exceed the WIP limit
 */
export function wouldExceedWipLimit(
  columnKey: string,
  currentCount: number,
  wipLimits: WipLimits,
): boolean {
  const limit = wipLimits[columnKey]
  if (limit === undefined || limit === null || limit <= 0) {
    return false
  }
  return currentCount >= limit
}

/**
 * Get WIP limit warning level
 */
export type WipWarningLevel = 'none' | 'approaching' | 'at_limit' | 'over_limit'

export function getWipWarningLevel(status: WipStatus): WipWarningLevel {
  if (status.limit === null) return 'none'
  if (status.isOverLimit) return 'over_limit'
  if (status.isAtLimit) return 'at_limit'
  if (status.percentage >= 80) return 'approaching'
  return 'none'
}

/**
 * Get WIP indicator color classes
 */
export function getWipIndicatorColor(level: WipWarningLevel): string {
  switch (level) {
    case 'over_limit':
      return 'text-red-600 bg-red-100'
    case 'at_limit':
      return 'text-amber-600 bg-amber-100'
    case 'approaching':
      return 'text-yellow-600 bg-yellow-100'
    default:
      return 'text-muted-foreground bg-muted'
  }
}

/**
 * Get WIP progress bar color
 */
export function getWipProgressColor(level: WipWarningLevel): string {
  switch (level) {
    case 'over_limit':
      return 'bg-red-500'
    case 'at_limit':
      return 'bg-amber-500'
    case 'approaching':
      return 'bg-yellow-500'
    default:
      return 'bg-primary'
  }
}

/**
 * Calculate WIP statistics for all columns
 */
export function calculateColumnWipStats(
  columns: Record<string, WorkItem[]>,
  wipLimits: WipLimits,
): Record<string, WipStatus> {
  const stats: Record<string, WipStatus> = {}

  Object.entries(columns).forEach(([columnKey, items]) => {
    stats[columnKey] = checkWipLimit(columnKey, items.length, wipLimits)
  })

  return stats
}

/**
 * Get columns that are at or over WIP limit
 */
export function getColumnsOverWip(
  columns: Record<string, WorkItem[]>,
  wipLimits: WipLimits,
): string[] {
  return Object.entries(columns)
    .filter(([columnKey, items]) => {
      const status = checkWipLimit(columnKey, items.length, wipLimits)
      return status.isAtLimit || status.isOverLimit
    })
    .map(([columnKey]) => columnKey)
}
