/**
 * Bulk Selection Hook
 * @module hooks/use-bulk-selection
 * @feature 014-full-assignment-detail
 *
 * Lightweight React hook for managing multi-select state with a 100-item limit.
 *
 * @description
 * Provides a simple, optimized selection state manager for any list of items.
 * Uses Set for O(1) lookup performance and enforces a configurable maximum.
 *
 * Features:
 * - Set-based storage for optimal performance
 * - 100-item selection limit (configurable via MAX_SELECTION constant)
 * - Selection helpers: toggle, selectAll, clear
 * - Selection status flags: canSelectMore, maxReached
 * - Memoized return value for stable references
 *
 * Use cases:
 * - Assignment bulk operations
 * - Document multi-select
 * - Any list with bulk actions
 *
 * @example
 * // Basic usage in assignment list
 * const selection = useBulkSelection();
 *
 * const handleSelect = (id) => {
 *   selection.toggleSelection(id);
 * };
 *
 * const handleSelectAll = () => {
 *   selection.selectAll(assignments.map(a => a.id));
 * };
 *
 * @example
 * // Prevent over-selection
 * if (selection.maxReached) {
 *   toast.warning('Maximum 100 items can be selected');
 * }
 *
 * @example
 * // Clear after bulk operation
 * await performBulkAction(Array.from(selection.selectedIds));
 * selection.clearSelection();
 */

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
 * Hook for managing bulk selection state
 *
 * @description
 * Maintains a Set of selected item IDs with a maximum limit.
 * Provides helper methods for common selection operations.
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
 * @returns Selection state and methods
 */
export function useBulkSelection(): UseBulkSelectionResult {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const selectedCount = selectedIds.size;
  const canSelectMore = selectedCount < MAX_SELECTION;
  const maxReached = selectedCount >= MAX_SELECTION;

  /**
   * Check if an item is currently selected
   * @param id - Item ID to check
   * @returns True if item is in selection
   */
  const isSelected = useCallback(
    (id: string): boolean => {
      return selectedIds.has(id);
    },
    [selectedIds]
  );

  /**
   * Toggle selection state for a single item
   * @description Adds item if not selected, removes if selected. Prevents selection if max limit reached.
   * @param id - Item ID to toggle
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
   * @description Selects up to MAX_SELECTION items from the list. Replaces current selection.
   * @param ids - Array of all item IDs to select
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
   * @description Resets selection to empty state
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
