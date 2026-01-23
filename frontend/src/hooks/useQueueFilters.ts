/**
 * useQueueFilters Hook
 *
 * Manages filter state, persists to localStorage with 7-day expiration
 * Task: T082 [P] [US5]
 */

import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

const STORAGE_KEY = 'waiting-queue-filters';
const EXPIRATION_DAYS = 7;

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

interface StoredFilters {
  filters: FilterCriteria;
  timestamp: number;
}

/**
 * Load filters from localStorage with expiration check
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
 * Save filters to localStorage with timestamp
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
 * Main hook for managing queue filters
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
 * Fetch filtered assignments from API
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
 * Load user filter preferences from backend
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
 * Save user filter preferences to backend
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
