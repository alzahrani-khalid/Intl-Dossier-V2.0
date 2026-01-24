/**
 * Keyboard Navigation Hooks
 * @module hooks/useKeyboardNavigation
 * @feature 015-search-retrieval-spec
 * @task T051
 *
 * Specialized keyboard navigation hooks for lists, search, and containers.
 *
 * @description
 * This module provides focused keyboard navigation utilities for specific UI patterns:
 * - Generic list/carousel navigation with arrow keys and Home/End
 * - Search-specific shortcuts (/, Escape, Enter, arrows)
 * - Tab navigation with focus trapping for modals and containers
 *
 * These hooks complement the global keyboard shortcut system by providing
 * context-specific navigation patterns that are common in UI components.
 *
 * @example
 * // Navigate through carousel items
 * function Carousel({ items }) {
 *   const { index, containerRef } = useKeyboardNavigation({
 *     itemCount: items.length,
 *     loop: true
 *   });
 *
 *   return (
 *     <div ref={containerRef} tabIndex={0}>
 *       {items[index]}
 *     </div>
 *   );
 * }
 *
 * @example
 * // Search with keyboard shortcuts
 * function SearchBar() {
 *   const inputRef = useRef(null);
 *   const [isOpen, setIsOpen] = useState(false);
 *
 *   useSearchKeyboardNavigation({
 *     searchInputRef: inputRef,
 *     isOpen,
 *     onClose: () => setIsOpen(false),
 *     onSubmit: handleSearch
 *   });
 *
 *   return <input ref={inputRef} />;
 * }
 */

import { useCallback, useEffect, useRef, useState, RefObject } from 'react';

export type UseKeyboardNavigationOptions = {
  /** Total number of items to navigate through */
  itemCount: number;
  /** Whether to loop around at start/end (default: true) */
  loop?: boolean;
};

/**
 * Hook for keyboard navigation through a list or carousel
 *
 * @description
 * Provides arrow key navigation through a collection of items. Automatically
 * manages focus by querying for elements with `data-kbindex` attribute.
 * Supports both looping (carousel) and bounded (list) navigation modes.
 *
 * Supported keys:
 * - ArrowRight/ArrowDown: Move to next item
 * - ArrowLeft/ArrowUp: Move to previous item
 * - Home: Jump to first item
 * - End: Jump to last item
 *
 * @param options - Configuration options
 * @param options.itemCount - Total number of items in the collection
 * @param options.loop - Whether to wrap around at boundaries (default: true)
 * @returns Navigation state object containing:
 * - `index`: Current item index (0-based)
 * - `setIndex`: Function to manually set the index
 * - `containerRef`: Ref to attach to the container element
 *
 * @example
 * // Carousel with looping
 * function ImageCarousel({ images }) {
 *   const { index, containerRef } = useKeyboardNavigation({
 *     itemCount: images.length,
 *     loop: true
 *   });
 *
 *   return (
 *     <div ref={containerRef} tabIndex={0} className="carousel">
 *       {images.map((img, i) => (
 *         <img
 *           key={i}
 *           data-kbindex={i}
 *           src={img}
 *           className={i === index ? 'active' : ''}
 *           tabIndex={i === index ? 0 : -1}
 *         />
 *       ))}
 *     </div>
 *   );
 * }
 *
 * @example
 * // List without looping
 * function MenuList({ items }) {
 *   const { index, setIndex, containerRef } = useKeyboardNavigation({
 *     itemCount: items.length,
 *     loop: false
 *   });
 *
 *   const handleClick = (i) => setIndex(i);
 *
 *   return (
 *     <ul ref={containerRef} tabIndex={0}>
 *       {items.map((item, i) => (
 *         <li
 *           key={i}
 *           data-kbindex={i}
 *           onClick={() => handleClick(i)}
 *           className={i === index ? 'selected' : ''}
 *         >
 *           {item.label}
 *         </li>
 *       ))}
 *     </ul>
 *   );
 * }
 */
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
 * Options for search keyboard navigation hook
 */
interface UseSearchKeyboardNavigationOptions {
  /** Ref to the search input element */
  searchInputRef: RefObject<HTMLInputElement>;
  /** Whether the suggestions dropdown is open */
  isOpen: boolean;
  /** Callback when dropdown should close */
  onClose: () => void;
  /** Optional callback when search is submitted (Enter) */
  onSubmit?: () => void;
  /** Optional callback when navigating suggestions (arrows) */
  onNavigate?: (direction: 'up' | 'down') => void;
  /** Optional callback when selecting a suggestion (Enter) */
  onSelect?: () => void;
  /** Whether keyboard shortcuts are disabled */
  disabled?: boolean;
}

/**
 * Hook for search-specific keyboard navigation
 *
 * @description
 * Provides a complete set of keyboard shortcuts for search interfaces with
 * autocomplete/suggestions. Handles common search UX patterns:
 * - Quick focus with / key (like GitHub, Slack)
 * - Escape to dismiss suggestions or blur input
 * - Enter to select suggestion or submit search
 * - Arrow keys to navigate through suggestions
 * - Tab to dismiss suggestions while maintaining accessibility
 *
 * The hook intelligently handles context, only intercepting keys when
 * appropriate (e.g., / only works when not already in an input).
 *
 * @param options - Configuration options
 * @returns Utility functions object containing:
 * - `focusSearch`: Function to programmatically focus the search input
 * - `closeDropdown`: Function to programmatically close the suggestions
 * - `selectSuggestion`: Function to programmatically select current suggestion
 *
 * @example
 * // Complete search with suggestions
 * function SearchBar() {
 *   const inputRef = useRef<HTMLInputElement>(null);
 *   const [isOpen, setIsOpen] = useState(false);
 *   const [selectedIndex, setSelectedIndex] = useState(0);
 *
 *   const { focusSearch } = useSearchKeyboardNavigation({
 *     searchInputRef: inputRef,
 *     isOpen,
 *     onClose: () => setIsOpen(false),
 *     onSubmit: () => performSearch(inputRef.current?.value),
 *     onNavigate: (dir) => {
 *       if (dir === 'down') setSelectedIndex(i => i + 1);
 *       else setSelectedIndex(i => Math.max(0, i - 1));
 *     },
 *     onSelect: () => selectSuggestion(suggestions[selectedIndex])
 *   });
 *
 *   return (
 *     <>
 *       <input ref={inputRef} />
 *       {isOpen && <SuggestionsList />}
 *     </>
 *   );
 * }
 *
 * @example
 * // Simple search without suggestions
 * function QuickSearch() {
 *   const inputRef = useRef<HTMLInputElement>(null);
 *
 *   useSearchKeyboardNavigation({
 *     searchInputRef: inputRef,
 *     isOpen: false,
 *     onClose: () => {},
 *     onSubmit: handleSearch
 *   });
 * }
 *
 * @example
 * // Disabled during loading
 * useSearchKeyboardNavigation({
 *   searchInputRef,
 *   isOpen,
 *   onClose,
 *   disabled: isLoading
 * });
 */
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
 *
 * @description
 * Provides focus trapping within a container by intercepting Tab key events
 * and cycling focus through focusable elements. Essential for modal dialogs,
 * dropdown menus, and other overlay components to maintain keyboard accessibility.
 *
 * The hook automatically identifies all focusable elements within the container
 * (buttons, links, inputs, etc.) and creates a focus loop. Supports both
 * forward (Tab) and backward (Shift+Tab) navigation.
 *
 * @param containerRef - Ref to the container element that should trap focus
 *
 * @example
 * // Modal dialog with focus trapping
 * function Modal({ isOpen, onClose, children }) {
 *   const modalRef = useRef<HTMLDivElement>(null);
 *   useTabNavigation(modalRef);
 *
 *   if (!isOpen) return null;
 *
 *   return (
 *     <div ref={modalRef} role="dialog" aria-modal="true">
 *       <button onClick={onClose}>Close</button>
 *       {children}
 *       <button>OK</button>
 *     </div>
 *   );
 * }
 *
 * @example
 * // Dropdown menu with focus trap
 * function DropdownMenu({ isOpen }) {
 *   const menuRef = useRef<HTMLDivElement>(null);
 *   useTabNavigation(menuRef);
 *
 *   if (!isOpen) return null;
 *
 *   return (
 *     <div ref={menuRef}>
 *       <button>Option 1</button>
 *       <button>Option 2</button>
 *       <button>Option 3</button>
 *     </div>
 *   );
 * }
 *
 * @example
 * // Sidebar with multiple focusable elements
 * function Sidebar() {
 *   const sidebarRef = useRef<HTMLElement>(null);
 *   useTabNavigation(sidebarRef);
 *
 *   return (
 *     <aside ref={sidebarRef}>
 *       <input placeholder="Search..." />
 *       <a href="/home">Home</a>
 *       <a href="/profile">Profile</a>
 *       <button>Settings</button>
 *     </aside>
 *   );
 * }
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

