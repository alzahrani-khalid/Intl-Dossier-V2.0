/**
 * Custom hook for session storage persistence
 * Automatically syncs state with sessionStorage
 * Session-scoped persistence (clears on tab close)
 * Feature: 028-type-specific-dossier-pages
 */

import { useState, useCallback, useEffect } from 'react';

/**
 * Custom hook to persist state in sessionStorage
 *
 * @param key - Storage key (must be unique per component/context)
 * @param initialValue - Default value if no stored value exists
 * @returns [storedValue, setValue] - Current value and setter function
 *
 * @example
 * const [isOpen, setIsOpen] = useSessionStorage('sidebar-open', false);
 *
 * @example
 * const [sections, setSections] = useSessionStorage<Record<string, boolean>>(
 *   'dossier-sections-country-123',
 *   { overview: true, positions: true }
 * );
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
 * Hook for managing collapsible section state
 * Persists expand/collapse state per dossier and section
 *
 * @param dossierId - Unique dossier identifier
 * @param dossierType - Dossier type (for namespacing)
 * @param defaultSections - Default expanded state for each section
 * @returns [sections, toggleSection, setSections]
 *
 * @example
 * const [sections, toggleSection] = useCollapsibleSections(
 *   dossier.id,
 *   dossier.type,
 *   { overview: true, positions: true, intelligence: false }
 * );
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
