/**
 * Queue Filters Hook
 * @module domains/intake/hooks/useQueueFilters
 *
 * Hooks for waiting queue filter management.
 * API calls delegated to intake.repository.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState, useCallback, useEffect } from 'react'
import {
  getFilteredAssignments,
  getFilterPreferences,
  saveFilterPreferences as saveFilterPreferencesApi,
} from '../repositories/intake.repository'

export interface FilterCriteria {
  status?: string
  urgency?: string
  assignee?: string
  dateRange?: { from: string; to: string }
  search?: string
}

const STORAGE_KEY = 'queue-filters'

function loadFiltersFromStorage(): FilterCriteria {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch {
    // Ignore parse errors
  }
  return {}
}

function saveFiltersToStorage(filters: FilterCriteria): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filters))
  } catch {
    console.warn('Failed to save filters to storage')
  }
}

export function useQueueFilters(): {
  filters: FilterCriteria
  setFilter: (key: keyof FilterCriteria, value: unknown) => void
  clearFilters: () => void
  hasActiveFilters: boolean
} {
  const [filters, setFilters] = useState<FilterCriteria>(loadFiltersFromStorage)

  useEffect(() => {
    saveFiltersToStorage(filters)
  }, [filters])

  const setFilter = useCallback((key: keyof FilterCriteria, value: unknown) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }, [])

  const clearFilters = useCallback(() => {
    setFilters({})
  }, [])

  const hasActiveFilters = Object.values(filters).some((v) =>
    v !== undefined && v !== '' && v !== null,
  )

  return { filters, setFilter, clearFilters, hasActiveFilters }
}

export function useFilteredAssignments(filters: FilterCriteria): ReturnType<typeof useQuery> {
  const params = new URLSearchParams()
  if (filters.status) params.set('status', filters.status)
  if (filters.urgency) params.set('urgency', filters.urgency)
  if (filters.assignee) params.set('assignee', filters.assignee)
  if (filters.search) params.set('search', filters.search)
  if (filters.dateRange) {
    params.set('from', filters.dateRange.from)
    params.set('to', filters.dateRange.to)
  }

  return useQuery({
    queryKey: ['queue-filters', 'assignments', filters],
    queryFn: () => getFilteredAssignments(params),
    staleTime: 30 * 1000,
  })
}

function useFilterPreferences(): ReturnType<typeof useQuery> {
  return useQuery({
    queryKey: ['queue-filters', 'preferences'],
    queryFn: () => getFilterPreferences(),
    staleTime: 5 * 60 * 1000,
  })
}

function useSaveFilterPreferences(): ReturnType<typeof useMutation> {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: Record<string, unknown>) => saveFilterPreferencesApi(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['queue-filters', 'preferences'] })
    },
  })
}

export { useFilterPreferences, useSaveFilterPreferences }
