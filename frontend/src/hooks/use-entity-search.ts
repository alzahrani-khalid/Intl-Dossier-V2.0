/**
 * Entity Search Hook
 * Feature: 024-intake-entity-linking
 * Task: T044
 *
 * TanStack Query hook for entity search operations
 * with FR-001a ranking (AI confidence 50% + recency 30% + alphabetical 20%)
 */

import { useQuery } from '@tanstack/react-query';
import { useState, useCallback, useEffect } from 'react';
import {
  intakeEntityLinksAPI,
  type EntitySearchFilters,
} from '@/services/entity-links-api';
import type { EntitySearchResult } from '../../../backend/src/types/intake-entity-links.types';

/**
 * Debounced value hook
 */
function useDebouncedValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Query keys for cache management
 */
export const entitySearchKeys = {
  all: ['entity-search'] as const,
  searches: () => [...entitySearchKeys.all, 'search'] as const,
  search: (filters: EntitySearchFilters) =>
    [...entitySearchKeys.searches(), filters] as const,
};

/**
 * Entity search options
 */
export interface UseEntitySearchOptions {
  /** Debounce delay in milliseconds (default: 300ms) */
  debounceMs?: number;
  /** Minimum query length to trigger search (default: 2) */
  minQueryLength?: number;
  /** Enable the query (default: true) */
  enabled?: boolean;
  /** Results limit (default: 20) */
  limit?: number;
}

/**
 * Hook for entity search with debouncing
 */
export function useEntitySearch(
  filters: Omit<EntitySearchFilters, 'limit'>,
  options: UseEntitySearchOptions = {}
) {
  const {
    debounceMs = 300,
    minQueryLength = 2,
    enabled = true,
    limit = 20,
  } = options;

  // Debounce the search query
  const debouncedQuery = useDebouncedValue(filters.query || '', debounceMs);

  // Determine if search should be enabled
  const shouldSearch =
    enabled &&
    debouncedQuery.length >= minQueryLength;

  return useQuery({
    queryKey: entitySearchKeys.search({
      ...filters,
      query: debouncedQuery,
      limit,
    }),
    queryFn: () =>
      intakeEntityLinksAPI.searchEntities({
        ...filters,
        query: debouncedQuery,
        limit,
      }),
    enabled: shouldSearch,
    staleTime: 1000 * 60 * 5, // 5 minutes - entity data changes infrequently
    gcTime: 1000 * 60 * 10, // 10 minutes (formerly cacheTime)
  });
}

/**
 * Stateful entity search hook with local state management
 * Useful for search input components
 */
export function useEntitySearchState(
  initialFilters: Omit<EntitySearchFilters, 'query' | 'limit'> = {},
  options: UseEntitySearchOptions = {}
) {
  const [query, setQuery] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<EntitySearchFilters['entity_types']>(
    initialFilters.entity_types
  );

  const searchFilters: Omit<EntitySearchFilters, 'limit'> = {
    query,
    entity_types: selectedTypes,
    organization_id: initialFilters.organization_id,
    classification_level: initialFilters.classification_level,
    include_archived: initialFilters.include_archived ?? false,
  };

  const searchQuery = useEntitySearch(searchFilters, options);

  // Clear query handler
  const clearSearch = useCallback(() => {
    setQuery('');
  }, []);

  // Toggle entity type filter
  const toggleEntityType = useCallback(
    (entityType: string) => {
      setSelectedTypes((prev) => {
        if (!prev) return [entityType] as EntitySearchFilters['entity_types'];
        if (prev.includes(entityType as any)) {
          return prev.filter((t) => t !== entityType) as EntitySearchFilters['entity_types'];
        }
        return [...prev, entityType] as EntitySearchFilters['entity_types'];
      });
    },
    []
  );

  // Clear all filters
  const clearFilters = useCallback(() => {
    setQuery('');
    setSelectedTypes(undefined);
  }, []);

  return {
    // Query state
    query,
    setQuery,

    // Filter state
    selectedTypes,
    setSelectedTypes,
    toggleEntityType,

    // Actions
    clearSearch,
    clearFilters,

    // Search query result
    ...searchQuery,
  };
}

/**
 * Hook to get entity intakes (reverse lookup)
 * For displaying all intake tickets linked to an entity
 */
export function useEntityIntakes(
  entityType: string,
  entityId: string,
  filters?: {
    status?: string[];
    from_date?: string;
    to_date?: string;
    page?: number;
    limit?: number;
  }
) {
  return useQuery({
    queryKey: ['entity-intakes', entityType, entityId, filters],
    queryFn: () =>
      intakeEntityLinksAPI.getEntityIntakes(
        entityType as any,
        entityId,
        filters
      ),
    enabled: !!entityType && !!entityId,
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  });
}

/**
 * Type guard to check if results are available
 */
export function hasSearchResults(
  data: EntitySearchResult[] | undefined
): data is EntitySearchResult[] {
  return Array.isArray(data) && data.length > 0;
}

/**
 * Helper to format entity type for display
 */
export function formatEntityType(entityType: string): string {
  const typeMap: Record<string, string> = {
    dossier: 'Dossier',
    position: 'Position',
    mou: 'MOU',
    engagement: 'Engagement',
    assignment: 'Assignment',
    commitment: 'Commitment',
    intelligence_signal: 'Intelligence Signal',
    organization: 'Organization',
    country: 'Country',
    forum: 'Forum',
    working_group: 'Working Group',
    topic: 'Topic',
  };

  return typeMap[entityType] || entityType;
}
