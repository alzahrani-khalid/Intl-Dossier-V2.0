/**
 * Keyboard Navigation Hooks
 * Feature: 015-search-retrieval-spec
 * Task: T051
 * Enhanced with search-specific keyboard shortcuts
 */

import { useCallback, useEffect, useRef, useState, RefObject } from 'react';

export type UseKeyboardNavigationOptions = {
  itemCount: number;
  loop?: boolean;
};

export function useKeyboardNavigation({
  itemCount,
  loop = true,
}: UseKeyboardNavigationOptions) {
  const [index, setIndex] = useState(0);
  const containerRef = useRef<HTMLElement | null>(null);

  const clamp = useCallback(
    (i: number) => {
      if (loop) return (i + itemCount) % itemCount;
      return Math.max(0, Math.min(itemCount - 1, i));
    },
    [itemCount, loop]
  );

  const onKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown')
        setIndex((i) => clamp(i + 1));
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp')
        setIndex((i) => clamp(i - 1));
      if (e.key === 'Home') setIndex(0);
      if (e.key === 'End') setIndex(itemCount - 1);
    },
    [clamp, itemCount]
  );

  useEffect(() => {
    const cur = containerRef.current;
    if (!cur) return;
    const handler = (e: KeyboardEvent) => onKeyDown(e);
    cur.addEventListener('keydown', handler);
    return () => cur.removeEventListener('keydown', handler);
  }, [onKeyDown]);

  useEffect(() => {
    const cur = containerRef.current;
    if (!cur) return;
    const el = cur.querySelector<HTMLElement>(`[data-kbindex="${index}"]`);
    el?.focus();
  }, [index]);

  return { index, setIndex, containerRef };
}

/**
 * Search-specific keyboard navigation hook
 * Manages keyboard shortcuts:
 * - `/` to focus search input
 * - `Escape` to close suggestions
 * - `Enter` to submit search
 * - `↑/↓` to navigate suggestions
 * - `Tab` to cycle through tabs
 */
interface UseSearchKeyboardNavigationOptions {
  searchInputRef: RefObject<HTMLInputElement>;
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: () => void;
  onNavigate?: (direction: 'up' | 'down') => void;
  onSelect?: () => void;
  disabled?: boolean;
}

export function useSearchKeyboardNavigation({
  searchInputRef,
  isOpen,
  onClose,
  onSubmit,
  onNavigate,
  onSelect,
  disabled = false,
}: UseSearchKeyboardNavigationOptions) {
  const focusSearch = useCallback(() => {
    searchInputRef.current?.focus();
  }, [searchInputRef]);

  const closeDropdown = useCallback(() => {
    onClose();
  }, [onClose]);

  const selectSuggestion = useCallback(() => {
    if (onSelect) {
      onSelect();
    }
  }, [onSelect]);

  // Global keyboard event handler
  useEffect(() => {
    if (disabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      const isInputFocused =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable;

      // `/` key - Focus search input (only when not in input)
      if (event.key === '/' && !isInputFocused) {
        event.preventDefault();
        focusSearch();
        return;
      }

      // Handle keys when search input is focused or dropdown is open
      if (isInputFocused || isOpen) {
        switch (event.key) {
          case 'Escape':
            event.preventDefault();
            if (isOpen) {
              closeDropdown();
            } else {
              // Blur search input on second Escape
              searchInputRef.current?.blur();
            }
            break;

          case 'Enter':
            if (!event.shiftKey && !event.ctrlKey && !event.metaKey) {
              if (isOpen && onSelect) {
                event.preventDefault();
                selectSuggestion();
              } else if (onSubmit) {
                event.preventDefault();
                onSubmit();
              }
            }
            break;

          case 'ArrowDown':
            if (isOpen && onNavigate) {
              event.preventDefault();
              onNavigate('down');
            }
            break;

          case 'ArrowUp':
            if (isOpen && onNavigate) {
              event.preventDefault();
              onNavigate('up');
            }
            break;

          case 'Tab':
            // Allow default Tab behavior for accessibility
            // but close suggestions dropdown if open
            if (isOpen) {
              closeDropdown();
            }
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [
    disabled,
    isOpen,
    focusSearch,
    closeDropdown,
    selectSuggestion,
    onNavigate,
    onSubmit,
    onSelect,
    searchInputRef,
  ]);

  // Return utility functions
  return {
    focusSearch,
    closeDropdown,
    selectSuggestion,
  };
}

/**
 * Hook for managing Tab key navigation within a specific container
 */
export function useTabNavigation(containerRef: RefObject<HTMLElement>) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab' || !containerRef.current) return;

      const focusableElements = containerRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );

      const focusableArray = Array.from(focusableElements) as HTMLElement[];
      const firstElement = focusableArray[0];
      const lastElement = focusableArray[focusableArray.length - 1];

      // Trap focus within container
      if (event.shiftKey) {
        // Shift + Tab (backward)
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement?.focus();
        }
      } else {
        // Tab (forward)
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement?.focus();
        }
      }
    };

    const container = containerRef.current;
    container?.addEventListener('keydown', handleKeyDown);

    return () => {
      container?.removeEventListener('keydown', handleKeyDown);
    };
  }, [containerRef]);
}

