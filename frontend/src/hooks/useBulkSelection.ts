import { useState, useCallback, useMemo } from 'react';

const MAX_SELECTION = 100;

export interface UseBulkSelectionResult {
  selectedIds: Set<string>;
  selectedCount: number;
  isSelected: (id: string) => boolean;
  toggleSelection: (id: string) => void;
  selectAll: (ids: string[]) => void;
  clearSelection: () => void;
  canSelectMore: boolean;
  maxReached: boolean;
}

/**
 * useBulkSelection - Hook for managing bulk selection state
 *
 * Features:
 * - Maintains set of selected assignment IDs
 * - Enforces max 100 items constraint
 * - Provides selection helpers (toggle, selectAll, clear)
 * - Optimized with Set for O(1) lookups
 *
 * Constraints:
 * - Maximum 100 items can be selected (per C-001)
 * - Selection state persists within component lifecycle only
 *
 * @returns {UseBulkSelectionResult} Selection state and methods
 */
export function useBulkSelection(): UseBulkSelectionResult {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const selectedCount = selectedIds.size;
  const canSelectMore = selectedCount < MAX_SELECTION;
  const maxReached = selectedCount >= MAX_SELECTION;

  /**
   * Check if an item is currently selected
   */
  const isSelected = useCallback(
    (id: string): boolean => {
      return selectedIds.has(id);
    },
    [selectedIds]
  );

  /**
   * Toggle selection state for a single item
   * Prevents selection if max limit reached
   */
  const toggleSelection = useCallback(
    (id: string) => {
      setSelectedIds((prev) => {
        const newSet = new Set(prev);

        if (newSet.has(id)) {
          // Remove if already selected
          newSet.delete(id);
        } else {
          // Add only if under max limit
          if (newSet.size < MAX_SELECTION) {
            newSet.add(id);
          } else {
            // Show warning toast or notification in component
            console.warn(
              `Maximum selection limit (${MAX_SELECTION}) reached. Cannot select more items.`
            );
          }
        }

        return newSet;
      });
    },
    []
  );

  /**
   * Select all items from provided list
   * Respects max limit by taking first MAX_SELECTION items
   */
  const selectAll = useCallback((ids: string[]) => {
    setSelectedIds((prev) => {
      // Take first MAX_SELECTION items
      const itemsToSelect = ids.slice(0, MAX_SELECTION);
      return new Set(itemsToSelect);
    });
  }, []);

  /**
   * Clear all selections
   */
  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  return useMemo(
    () => ({
      selectedIds,
      selectedCount,
      isSelected,
      toggleSelection,
      selectAll,
      clearSelection,
      canSelectMore,
      maxReached,
    }),
    [
      selectedIds,
      selectedCount,
      isSelected,
      toggleSelection,
      selectAll,
      clearSelection,
      canSelectMore,
      maxReached,
    ]
  );
}
