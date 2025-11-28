/**
 * useGlobalKeyboard Hook
 * Feature: 033-unified-work-creation-hub
 *
 * Registers global keyboard shortcuts for the application.
 * Primary: ⌘K (Mac) / Ctrl+K (Windows) to open work creation palette.
 */

import { useEffect, useCallback } from 'react';

export interface GlobalKeyboardOptions {
  /** Callback when ⌘K / Ctrl+K is pressed */
  onCreateNew?: () => void;
  /** Enable/disable the shortcuts */
  enabled?: boolean;
}

/**
 * Detect if running on macOS
 */
function isMac(): boolean {
  if (typeof navigator === 'undefined') return false;
  return navigator.platform.toUpperCase().indexOf('MAC') >= 0;
}

/**
 * Hook to register global keyboard shortcuts
 */
export function useGlobalKeyboard({
  onCreateNew,
  enabled = true,
}: GlobalKeyboardOptions) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      // Check for ⌘K (Mac) or Ctrl+K (Windows/Linux)
      const isCmdOrCtrl = isMac() ? event.metaKey : event.ctrlKey;

      if (isCmdOrCtrl && event.key === 'k') {
        // Prevent default browser behavior (e.g., Chrome's address bar focus)
        event.preventDefault();
        event.stopPropagation();

        // Don't trigger if user is typing in an input
        const activeElement = document.activeElement;
        const isTyping =
          activeElement instanceof HTMLInputElement ||
          activeElement instanceof HTMLTextAreaElement ||
          activeElement?.getAttribute('contenteditable') === 'true';

        // Allow ⌘K even in inputs if no text is selected
        // This gives power users quick access
        if (isTyping && (activeElement as HTMLInputElement).value) {
          // Only block if there's actual content
          return;
        }

        onCreateNew?.();
      }
    },
    [onCreateNew, enabled]
  );

  useEffect(() => {
    if (!enabled) return;

    // Use capture phase to handle before other handlers
    document.addEventListener('keydown', handleKeyDown, true);

    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [handleKeyDown, enabled]);
}

/**
 * Get keyboard shortcut display text
 */
export function getShortcutText(): string {
  return isMac() ? '⌘K' : 'Ctrl+K';
}

export default useGlobalKeyboard;
