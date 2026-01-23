/**
 * Kanban Keyboard Shortcuts Hook
 * Feature: Add keyboard navigation to Kanban board
 *
 * Provides:
 * - J/K navigation between cards
 * - Number keys (1-4) for status transitions
 * - Enter to open card details
 * - Integration with global keyboard shortcuts system
 */

import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useKeyboardShortcuts } from './useKeyboardShortcuts'
import type { WorkflowStage } from '@/types/work-item.types'

export interface KanbanKeyboardShortcutsCallbacks {
  /** Navigate to the next card (down/forward) */
  onNavigateDown?: () => void
  /** Navigate to the previous card (up/backward) */
  onNavigateUp?: () => void
  /** Open the currently focused card */
  onOpenCard?: () => void
  /** Move focused card to a specific workflow stage */
  onMoveToStatus?: (stage: WorkflowStage) => void
}

/**
 * Hook to register Kanban-specific keyboard shortcuts
 *
 * @param callbacks - Object containing callback functions for various actions
 * @returns void
 *
 * @example
 * ```tsx
 * useKanbanKeyboardShortcuts({
 *   onNavigateDown: () => setFocusedIndex(prev => prev + 1),
 *   onNavigateUp: () => setFocusedIndex(prev => prev - 1),
 *   onOpenCard: () => openCardDetails(cards[focusedIndex]),
 *   onMoveToStatus: (stage) => moveCard(cards[focusedIndex], stage),
 * })
 * ```
 */
export function useKanbanKeyboardShortcuts(callbacks: KanbanKeyboardShortcutsCallbacks) {
  const { register } = useKeyboardShortcuts()
  const { t } = useTranslation('keyboard-shortcuts')

  useEffect(() => {
    const unregisters: (() => void)[] = []

    // J: Navigate Down (next card)
    if (callbacks.onNavigateDown) {
      unregisters.push(
        register({
          id: 'kanban-navigate-down',
          key: 'j',
          description: t('shortcuts.navigateDown', 'Navigate to next card'),
          category: 'navigation',
          action: callbacks.onNavigateDown,
          allowInInput: false,
          priority: 10, // Higher priority for Kanban-specific navigation
        }),
      )
    }

    // K: Navigate Up (previous card)
    if (callbacks.onNavigateUp) {
      unregisters.push(
        register({
          id: 'kanban-navigate-up',
          key: 'k',
          description: t('shortcuts.navigateUp', 'Navigate to previous card'),
          category: 'navigation',
          action: callbacks.onNavigateUp,
          allowInInput: false,
          priority: 10, // Higher priority for Kanban-specific navigation
        }),
      )
    }

    // Enter: Open focused card
    if (callbacks.onOpenCard) {
      unregisters.push(
        register({
          id: 'kanban-open-card',
          key: 'enter',
          description: t('shortcuts.openCard', 'Open card details'),
          category: 'actions',
          action: callbacks.onOpenCard,
          allowInInput: false,
          priority: 10,
        }),
      )
    }

    // Number keys 1-4: Move card to workflow stage
    if (callbacks.onMoveToStatus) {
      // 1: Move to Todo
      unregisters.push(
        register({
          id: 'kanban-move-to-todo',
          key: '1',
          description: t('shortcuts.moveToTodo', 'Move card to Todo'),
          category: 'actions',
          action: () => callbacks.onMoveToStatus?.('todo'),
          allowInInput: false,
          priority: 10,
        }),
      )

      // 2: Move to In Progress
      unregisters.push(
        register({
          id: 'kanban-move-to-in-progress',
          key: '2',
          description: t('shortcuts.moveToInProgress', 'Move card to In Progress'),
          category: 'actions',
          action: () => callbacks.onMoveToStatus?.('in_progress'),
          allowInInput: false,
          priority: 10,
        }),
      )

      // 3: Move to Review
      unregisters.push(
        register({
          id: 'kanban-move-to-review',
          key: '3',
          description: t('shortcuts.moveToReview', 'Move card to Review'),
          category: 'actions',
          action: () => callbacks.onMoveToStatus?.('review'),
          allowInInput: false,
          priority: 10,
        }),
      )

      // 4: Move to Done
      unregisters.push(
        register({
          id: 'kanban-move-to-done',
          key: '4',
          description: t('shortcuts.moveToDone', 'Move card to Done'),
          category: 'actions',
          action: () => callbacks.onMoveToStatus?.('done'),
          allowInInput: false,
          priority: 10,
        }),
      )
    }

    // Cleanup: Unregister all shortcuts on unmount
    return () => unregisters.forEach((u) => u())
  }, [register, t, callbacks])
}
