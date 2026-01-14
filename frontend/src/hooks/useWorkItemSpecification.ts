/**
 * Work Item Specification Hook
 *
 * Provides a React hook for building and using work item specifications
 * with TanStack Query integration.
 *
 * @module hooks/useWorkItemSpecification
 */

import { useMemo, useCallback, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import {
  WorkItemFilterSpecification,
  type WorkItemFilters,
  type WorkItem,
  overdueOnly,
  byDossier,
  assignedTo,
  filtersToQueryParams,
  queryParamsToFilters,
} from '@/lib/specifications/work-item.specification'
import { createBuilder } from '@/lib/specifications/builder'
import { applySpecification, applyQueryOptions } from '@/lib/specifications/supabase-adapter'
import type { Specification } from '@/lib/specifications/types'

// ============================================
// Query Keys
// ============================================

export const workItemSpecKeys = {
  all: ['work-items-spec'] as const,
  filtered: (spec: Specification<WorkItem> | null) =>
    [...workItemSpecKeys.all, 'filtered', spec?.describe() ?? 'none'] as const,
  byFilters: (filters: WorkItemFilters) =>
    [...workItemSpecKeys.all, 'by-filters', filtersToQueryParams(filters)] as const,
}

// ============================================
// Main Hook
// ============================================

/**
 * Hook for using work item specifications
 *
 * @example
 * ```tsx
 * const { specification, items, isLoading } = useWorkItemSpecification({
 *   sources: ['task', 'commitment'],
 *   statuses: ['pending', 'in_progress'],
 *   isOverdue: true,
 * });
 *
 * // Access the specification for additional filtering
 * const overdueItems = items?.filter(item => specification?.isSatisfiedBy(item));
 * ```
 */
export function useWorkItemSpecification(filters: WorkItemFilters = {}) {
  // Build the specification from filters
  const specification = useMemo(() => {
    return new WorkItemFilterSpecification(filters)
  }, [
    filters.sources?.join(','),
    filters.trackingTypes?.join(','),
    filters.statuses?.join(','),
    filters.priorities?.join(','),
    filters.isOverdue,
    filters.dossierId,
    filters.searchQuery,
    filters.assignedTo,
  ])

  // Query with specification
  const query = useQuery({
    queryKey: workItemSpecKeys.byFilters(filters),
    queryFn: async () => {
      // Build the base query
      let queryBuilder = supabase.from('unified_work_items').select('*')

      // Apply the specification to the query
      queryBuilder = applySpecification(queryBuilder, specification)

      // Apply ordering
      queryBuilder = applyQueryOptions(queryBuilder, {
        orderBy: 'deadline',
        orderDirection: 'asc',
        limit: 100,
      })

      const { data, error } = await queryBuilder

      if (error) {
        throw new Error(error.message)
      }

      return data as WorkItem[]
    },
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  })

  // Client-side filtering helper
  const filterLocally = useCallback(
    (items: WorkItem[]) => {
      return items.filter((item) => specification.isSatisfiedBy(item))
    },
    [specification],
  )

  return {
    specification,
    items: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    filterLocally,
  }
}

// ============================================
// Builder Hook
// ============================================

/**
 * Hook for building work item specifications with a fluent API
 *
 * @example
 * ```tsx
 * const { addFilter, removeFilter, clearFilters, specification, apply } = useWorkItemSpecificationBuilder();
 *
 * // Add filters
 * addFilter('source', ['task']);
 * addFilter('status', ['pending']);
 *
 * // Build and apply
 * const spec = specification();
 * const filtered = items.filter(item => spec.isSatisfiedBy(item));
 * ```
 */
export function useWorkItemSpecificationBuilder(initialFilters: WorkItemFilters = {}) {
  const [filters, setFilters] = useState<WorkItemFilters>(initialFilters)

  const addFilter = useCallback(
    <K extends keyof WorkItemFilters>(key: K, value: WorkItemFilters[K]) => {
      setFilters((prev) => ({ ...prev, [key]: value }))
    },
    [],
  )

  const removeFilter = useCallback(<K extends keyof WorkItemFilters>(key: K) => {
    setFilters((prev) => {
      const next = { ...prev }
      delete next[key]
      return next
    })
  }, [])

  const clearFilters = useCallback(() => {
    setFilters({})
  }, [])

  const specification = useCallback(() => {
    return new WorkItemFilterSpecification(filters)
  }, [filters])

  return {
    filters,
    setFilters,
    addFilter,
    removeFilter,
    clearFilters,
    specification,
  }
}

// ============================================
// Preset Specifications
// ============================================

/**
 * Preset specification for "My Tasks" view
 */
export function useMyTasksSpecification(userId: string) {
  const spec = useMemo(
    () =>
      createBuilder<WorkItem>()
        .whereIn('source', ['task'] as WorkItem['source'][])
        .whereIn('status', ['pending', 'in_progress'] as unknown as WorkItem['status'][])
        .where(assignedTo(userId))
        .build(),
    [userId],
  )

  return useWorkItemSpecificationWithSpec(spec)
}

/**
 * Preset specification for "Overdue Items" view
 */
export function useOverdueItemsSpecification(userId?: string) {
  const spec = useMemo(() => {
    const builder = createBuilder<WorkItem>().where(overdueOnly())

    if (userId) {
      builder.where(assignedTo(userId))
    }

    return builder.build()
  }, [userId])

  return useWorkItemSpecificationWithSpec(spec)
}

/**
 * Preset specification for "Due This Week" view
 */
export function useDueThisWeekSpecification(userId?: string) {
  const now = new Date()
  const endOfWeek = new Date(now)
  endOfWeek.setDate(now.getDate() + (7 - now.getDay()))

  const spec = useMemo(() => {
    const builder = createBuilder<WorkItem>()
      .whereNotNull('deadline' as keyof WorkItem)
      .whereLessThan('deadline' as keyof WorkItem, endOfWeek.toISOString() as WorkItem['deadline'])

    if (userId) {
      builder.where(assignedTo(userId))
    }

    return builder.build()
  }, [userId, endOfWeek.toISOString()])

  return useWorkItemSpecificationWithSpec(spec)
}

/**
 * Preset specification for items by dossier
 */
export function useDossierItemsSpecification(dossierId: string) {
  const spec = useMemo(() => byDossier(dossierId), [dossierId])
  return useWorkItemSpecificationWithSpec(spec)
}

// ============================================
// Helper Hook
// ============================================

function useWorkItemSpecificationWithSpec(specification: Specification<WorkItem>) {
  const query = useQuery({
    queryKey: workItemSpecKeys.filtered(specification),
    queryFn: async () => {
      let queryBuilder = supabase.from('unified_work_items').select('*')
      queryBuilder = applySpecification(queryBuilder, specification)
      queryBuilder = applyQueryOptions(queryBuilder, {
        orderBy: 'deadline',
        orderDirection: 'asc',
        limit: 100,
      })

      const { data, error } = await queryBuilder

      if (error) {
        throw new Error(error.message)
      }

      return data as WorkItem[]
    },
    staleTime: 30 * 1000,
  })

  const filterLocally = useCallback(
    (items: WorkItem[]) => {
      return items.filter((item) => specification.isSatisfiedBy(item))
    },
    [specification],
  )

  return {
    specification,
    items: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    filterLocally,
  }
}

// ============================================
// URL State Integration
// ============================================

/**
 * Hook for syncing work item specification with URL state
 */
export function useWorkItemSpecificationFromUrl(searchParams: URLSearchParams) {
  const filters = useMemo(() => {
    const params: Record<string, string> = {}
    searchParams.forEach((value, key) => {
      params[key] = value
    })
    return queryParamsToFilters(params)
  }, [searchParams.toString()])

  return useWorkItemSpecification(filters)
}

/**
 * Convert current filters to URL search params
 */
export function useFiltersToUrl(filters: WorkItemFilters) {
  return useMemo(() => {
    const params = filtersToQueryParams(filters)
    return new URLSearchParams(params)
  }, [
    filters.sources?.join(','),
    filters.trackingTypes?.join(','),
    filters.statuses?.join(','),
    filters.priorities?.join(','),
    filters.isOverdue,
    filters.dossierId,
    filters.searchQuery,
    filters.assignedTo,
  ])
}
