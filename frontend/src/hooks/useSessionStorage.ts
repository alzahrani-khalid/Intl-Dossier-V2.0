/**
 * Session Storage Hooks
 * @module hooks/useSessionStorage
 * @feature 028-type-specific-dossier-pages
 *
 * React hooks for persisting state to browser sessionStorage with automatic
 * synchronization and cross-tab updates.
 *
 * @description
 * This module provides React hooks for managing sessionStorage persistence:
 * - Generic hook for any sessionStorage-backed state with TypeScript generics
 * - Automatic serialization/deserialization of complex objects via JSON
 * - Cross-tab synchronization via storage events
 * - SSR-safe with fallback for server-side rendering
 * - Specialized hook for collapsible sections with namespaced keys
 * - Session-scoped persistence (data clears when browser tab closes)
 *
 * @example
 * // Basic usage with boolean
 * const [isOpen, setIsOpen] = useSessionStorage('sidebar-open', false);
 *
 * @example
 * // Complex object with type safety
 * const [sections, setSections] = useSessionStorage<Record<string, boolean>>(
 *   'dossier-sections-country-123',
 *   { overview: true, positions: true }
 * );
 *
 * @example
 * // Collapsible sections for dossier pages
 * const [sections, toggleSection] = useCollapsibleSections(
 *   dossier.id,
 *   dossier.type,
 *   { overview: true, positions: true, intelligence: false }
 * );
 */

import { useState, useCallback, useEffect } from 'react';

/**
 * Hook to persist state in sessionStorage with automatic synchronization
 *
 * @description
 * Provides a useState-like interface that automatically persists to sessionStorage.
 * The stored value is scoped to the browser tab and clears when the tab closes.
 * Automatically syncs across tabs/windows via storage events and handles SSR.
 *
 * Key features:
 * - Automatic JSON serialization/deserialization
 * - Cross-tab synchronization (storage events)
 * - SSR-safe (returns initial value on server)
 * - Graceful error handling with console warnings
 * - Supports functional updates like useState
 *
 * @template T - The type of value to store (must be JSON-serializable)
 * @param key - Unique storage key (must be unique per component/context)
 * @param initialValue - Default value if no stored value exists
 * @returns Tuple of [storedValue, setValue] matching useState API
 *
 * @example
 * // Simple boolean toggle
 * const [isOpen, setIsOpen] = useSessionStorage('sidebar-open', false);
 * setIsOpen(!isOpen);
 *
 * @example
 * // Complex object with type safety
 * const [sections, setSections] = useSessionStorage<Record<string, boolean>>(
 *   'dossier-sections-country-123',
 *   { overview: true, positions: true }
 * );
 *
 * @example
 * // Functional update (like useState)
 * setSections(prev => ({ ...prev, newSection: true }));
 */
export function useSessionStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((val: T) => T)) => void] {
  // Initialize state from sessionStorage or use initial value
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue;
    }

    try {
      const item = window.sessionStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : initialValue;
    } catch (error) {
      console.warn(`Error reading sessionStorage key "${key}":`, error);
      return initialValue;
    }
  });

  // Update sessionStorage when value changes
  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      try {
        // Allow value to be a function (same API as useState)
        const valueToStore =
          value instanceof Function ? value(storedValue) : value;

        // Update React state
        setStoredValue(valueToStore);

        // Persist to sessionStorage
        if (typeof window !== 'undefined') {
          window.sessionStorage.setItem(key, JSON.stringify(valueToStore));
        }
      } catch (error) {
        console.warn(`Error setting sessionStorage key "${key}":`, error);
      }
    },
    [key, storedValue]
  );

  // Sync with sessionStorage changes from other tabs/windows
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue !== null) {
        try {
          setStoredValue(JSON.parse(e.newValue) as T);
        } catch (error) {
          console.warn(
            `Error syncing sessionStorage key "${key}":`,
            error
          );
        }
      }
    };

    // Listen for storage events (cross-tab synchronization)
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [key]);

  return [storedValue, setValue];
}

/**
 * Hook for managing collapsible section state with persistence
 *
 * @description
 * Specialized hook for managing expand/collapse state of UI sections (e.g., dossier
 * detail pages). Automatically persists state to sessionStorage with namespaced keys
 * to prevent collisions between different dossiers and types.
 *
 * Storage key format: `dossier-sections-{dossierType}-{dossierId}`
 *
 * @param dossierId - Unique dossier identifier (UUID)
 * @param dossierType - Dossier type for namespacing ('country', 'organization', etc.)
 * @param defaultSections - Default expanded state for each section ID
 * @returns Tuple of [sections, toggleSection, setSections]
 *   - sections: Current state of all sections (section ID → boolean)
 *   - toggleSection: Function to toggle a specific section by ID
 *   - setSections: Direct setter for batch updates
 *
 * @example
 * // Basic usage for dossier detail page
 * const [sections, toggleSection] = useCollapsibleSections(
 *   dossier.id,
 *   dossier.type,
 *   { overview: true, positions: true, intelligence: false }
 * );
 *
 * // Toggle a section
 * <button onClick={() => toggleSection('overview')}>
 *   {sections.overview ? 'Collapse' : 'Expand'}
 * </button>
 *
 * @example
 * // Batch update all sections
 * const [sections, toggleSection, setSections] = useCollapsibleSections(...);
 * setSections({ overview: true, positions: true, intelligence: true });
 */
export function useCollapsibleSections(
  dossierId: string,
  dossierType: string,
  defaultSections: Record<string, boolean>
): [
  Record<string, boolean>,
  (sectionId: string) => void,
  (sections: Record<string, boolean>) => void
] {
  const storageKey = `dossier-sections-${dossierType}-${dossierId}`;
  const [sections, setSections] = useSessionStorage<Record<string, boolean>>(
    storageKey,
    defaultSections
  );

  const toggleSection = useCallback(
    (sectionId: string) => {
      setSections((prev) => ({
        ...prev,
        [sectionId]: !prev[sectionId],
      }));
    },
    [setSections]
  );

  return [sections, toggleSection, setSections];
}
