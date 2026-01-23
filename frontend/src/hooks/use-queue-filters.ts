/**
 * Queue Filters Hook
 * @module hooks/use-queue-filters
 * @feature 032-unified-work-management
 *
 * State management hook for waiting queue filters with localStorage persistence.
 *
 * @description
 * This module provides comprehensive filter management for waiting queue views:
 * - Local state management with React hooks
 * - Automatic localStorage persistence with 7-day expiration
 * - Multi-criteria filtering (priority, aging, type, assignee, status)
 * - Sorting and pagination support
 * - TanStack Query integration for filtered data fetching
 * - User preference loading and saving via backend API
 * - Automatic cache invalidation on filter changes
 *
 * Filters are persisted locally to preserve user preferences across sessions
 * and synced to the backend for cross-device consistency.
 *
 * @example
 * // Basic usage
 * const { filters, updateFilter, clearFilters } = useQueueFilters();
 * updateFilter('priority', ['high', 'urgent']);
 *
 * @example
 * // Fetch filtered data
 * const { filters } = useQueueFilters();
 * const { data } = useFilteredAssignments(filters);
 *
 * @example
 * // Load user preferences from backend
 * const { data: preferences } = useFilterPreferences();
 */

import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

/** localStorage key for filter persistence */
const STORAGE_KEY = 'waiting-queue-filters';

/** Filter expiration in days */
const EXPIRATION_DAYS = 7;

/**
 * Filter criteria for waiting queue queries
 */
export interface FilterCriteria {
  priority?: ('low' | 'medium' | 'high' | 'urgent')[];
  aging?: ('0-2' | '3-6' | '7+')[];
  type?: ('dossier' | 'ticket' | 'position' | 'task')[];
  assignee?: string;
  status?: 'pending' | 'assigned';
  sort_by?: 'assigned_at_asc' | 'assigned_at_desc' | 'priority_asc' | 'priority_desc';
  page?: number;
  page_size?: number;
}

/**
 * Stored filter structure with timestamp for expiration
 */
interface StoredFilters {
  filters: FilterCriteria;
  timestamp: number;
}

/**
 * Load filters from localStorage with automatic expiration
 *
 * @description
 * Retrieves filters from localStorage and validates expiration timestamp.
 * Filters older than EXPIRATION_DAYS are automatically removed.
 *
 * @returns Parsed filter criteria or empty object if expired/invalid
 */
function loadFiltersFromStorage(): FilterCriteria {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return {};

    const parsed: StoredFilters = JSON.parse(stored);
    const age = Date.now() - parsed.timestamp;
    const maxAge = EXPIRATION_DAYS * 24 * 60 * 60 * 1000;

    // Expire old filters
    if (age > maxAge) {
      localStorage.removeItem(STORAGE_KEY);
      return {};
    }

    return parsed.filters;
  } catch {
    return {};
  }
}

/**
 * Save filters to localStorage with current timestamp
 *
 * @description
 * Persists filter criteria to localStorage with a timestamp for expiration tracking.
 * Handles errors gracefully without throwing.
 *
 * @param filters - Filter criteria to persist
 */
function saveFiltersToStorage(filters: FilterCriteria): void {
  try {
    const data: StoredFilters = {
      filters,
      timestamp: Date.now()
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save filters to localStorage:', error);
  }
}

/**
 * Hook for managing waiting queue filter state
 *
 * @description
 * Manages filter state with automatic localStorage persistence and provides
 * helper functions for updating filters. Filters are automatically synced to
 * localStorage on every change and loaded on mount with expiration validation.
 *
 * Provides:
 * - Current filter state
 * - updateFilter: Update single filter field
 * - updateFilters: Update multiple filter fields
 * - clearFilters: Reset all filters and invalidate queries
 * - resetFilters: Set specific filter values
 * - filterCount: Number of active filters (excluding page, page_size, sort_by)
 * - hasFilters: Boolean indicating if any filters are active
 *
 * @returns Filter state and management functions
 *
 * @example
 * // Basic filter management
 * const { filters, updateFilter, hasFilters } = useQueueFilters();
 * updateFilter('priority', ['urgent', 'high']);
 * if (hasFilters) {
 *   // Show "Clear filters" button
 * }
 *
 * @example
 * // Bulk update
 * const { updateFilters } = useQueueFilters();
 * updateFilters({
 *   priority: ['urgent'],
 *   type: ['ticket'],
 *   status: 'pending',
 * });
 */
export function useQueueFilters() {
  const [filters, setFilters] = useState<FilterCriteria>(loadFiltersFromStorage);
  const queryClient = useQueryClient();

  // Sync filters to localStorage on change
  useEffect(() => {
    saveFiltersToStorage(filters);
  }, [filters]);

  /**
   * Update specific filter
   */
  const updateFilter = useCallback((key: keyof FilterCriteria, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  }, []);

  /**
   * Update multiple filters at once
   */
  const updateFilters = useCallback((newFilters: Partial<FilterCriteria>) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters
    }));
  }, []);

  /**
   * Clear all filters
   */
  const clearFilters = useCallback(() => {
    setFilters({});
    localStorage.removeItem(STORAGE_KEY);

    // Invalidate queries to refetch without filters
    queryClient.invalidateQueries({ queryKey: ['waiting-queue-assignments'] });
  }, [queryClient]);

  /**
   * Reset to specific filters
   */
  const resetFilters = useCallback((newFilters: FilterCriteria) => {
    setFilters(newFilters);
  }, []);

  /**
   * Count active filters
   */
  const filterCount = Object.keys(filters).filter(
    key => key !== 'page' && key !== 'page_size' && key !== 'sort_by' && filters[key as keyof FilterCriteria] !== undefined
  ).length;

  /**
   * Check if any filters are active
   */
  const hasFilters = filterCount > 0;

  return {
    filters,
    updateFilter,
    updateFilters,
    clearFilters,
    resetFilters,
    filterCount,
    hasFilters
  };
}

/**
 * Hook to fetch filtered assignments from waiting queue
 *
 * @description
 * Fetches assignments based on provided filter criteria via Edge Function.
 * Handles array filter parameters correctly (multiple values for same param).
 * Results are cached for 5 minutes to reduce server load.
 *
 * @param filters - Filter criteria to apply to the query
 * @returns TanStack Query result with filtered assignments
 *
 * @example
 * // Basic usage
 * const { filters } = useQueueFilters();
 * const { data, isLoading } = useFilteredAssignments(filters);
 *
 * @example
 * // Manual filter override
 * const { data } = useFilteredAssignments({
 *   priority: ['urgent', 'high'],
 *   type: ['ticket'],
 *   page: 1,
 *   page_size: 20,
 * });
 */
export function useFilteredAssignments(filters: FilterCriteria) {
  return useQuery({
    queryKey: ['waiting-queue-assignments', filters],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      // Build query string - handle arrays
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            // For arrays, add multiple params with the same key
            value.forEach(v => params.append(key, String(v)));
          } else {
            params.append(key, String(value));
          }
        }
      });

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/waiting-queue-filters/assignments?${params}`,
        {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch assignments');
      }

      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000 // 10 minutes
  });
}

/**
 * Hook to load user's saved filter preferences from backend
 *
 * @description
 * Fetches user's saved filter preferences from the backend for cross-device
 * synchronization. Results are cached indefinitely (staleTime: Infinity)
 * since preferences rarely change. Used for initializing filters on login.
 *
 * @returns TanStack Query result with user's filter preferences
 *
 * @example
 * // Load and apply saved preferences
 * const { data: preferences } = useFilterPreferences();
 * const { resetFilters } = useQueueFilters();
 * useEffect(() => {
 *   if (preferences) {
 *     resetFilters(preferences);
 *   }
 * }, [preferences, resetFilters]);
 */
export function useFilterPreferences() {
  return useQuery({
    queryKey: ['filter-preferences'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/waiting-queue-filters/preferences`,
        {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to load preferences');
      }

      return response.json();
    },
    staleTime: Infinity // Preferences rarely change
  });
}

/**
 * Hook to save user's filter preferences to backend
 *
 * @description
 * Mutation to persist user's filter preferences to the backend for cross-device
 * synchronization. On success, invalidates the filter-preferences query to
 * trigger a refetch. Useful for "Save preferences" button functionality.
 *
 * @returns TanStack Mutation result with mutate function
 *
 * @example
 * // Save current filters as preferences
 * const { filters } = useQueueFilters();
 * const { mutate: savePreferences, isPending } = useSaveFilterPreferences();
 * const handleSave = () => savePreferences(filters);
 *
 * @example
 * // With feedback
 * const { mutate } = useSaveFilterPreferences();
 * mutate(filters, {
 *   onSuccess: () => toast({ title: 'Preferences saved!' }),
 *   onError: (error) => toast({ title: 'Failed to save', variant: 'destructive' }),
 * });
 */
export function useSaveFilterPreferences() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (preferences: FilterCriteria) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/waiting-queue-filters/preferences`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ preferences })
        }
      );

      if (!response.ok) {
        throw new Error('Failed to save preferences');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['filter-preferences'] });
    }
  });
}
