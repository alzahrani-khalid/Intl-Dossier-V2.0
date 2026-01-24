/**
 * Debounced Value Hook
 * @module hooks/useDebouncedValue
 *
 * React hook for debouncing rapidly changing values to prevent excessive updates
 * and API calls.
 *
 * @description
 * This module provides a simple debouncing hook for values:
 * - Delays updating the debounced value until input stabilizes
 * - Cancels pending updates if value changes before delay completes
 * - Configurable delay (defaults to 300ms)
 * - Type-safe with TypeScript generics
 * - Common use cases: search inputs, filters, form validation
 * - Reduces API calls, database queries, and expensive computations
 *
 * @example
 * // Search input debouncing
 * const [search, setSearch] = useState('');
 * const debouncedSearch = useDebouncedValue(search, 500);
 *
 * useEffect(() => {
 *   if (debouncedSearch) {
 *     fetchSearchResults(debouncedSearch);
 *   }
 * }, [debouncedSearch]);
 *
 * @example
 * // Filter debouncing
 * const [filters, setFilters] = useState({});
 * const debouncedFilters = useDebouncedValue(filters, 300);
 *
 * const { data } = useQuery({
 *   queryKey: ['items', debouncedFilters],
 *   queryFn: () => fetchItems(debouncedFilters)
 * });
 *
 * @example
 * // Form validation
 * const [email, setEmail] = useState('');
 * const debouncedEmail = useDebouncedValue(email, 400);
 *
 * useEffect(() => {
 *   validateEmail(debouncedEmail);
 * }, [debouncedEmail]);
 */

import { useState, useEffect } from 'react';

/**
 * Hook to debounce a rapidly changing value
 *
 * @description
 * Returns a debounced version of the input value that only updates after the value
 * has stopped changing for the specified delay. If the value changes again before
 * the delay completes, the timer resets.
 *
 * This is particularly useful for:
 * - Search inputs (wait for user to stop typing before searching)
 * - Filter controls (wait for user to finish adjusting before filtering)
 * - Form validation (wait for user to finish entering data)
 * - Expensive computations (delay recalculation until input stabilizes)
 * - API calls (reduce request frequency)
 *
 * The hook automatically cleans up pending timeouts when the component unmounts
 * or when the value changes.
 *
 * @template T - The type of value to debounce (can be any type)
 * @param value - The value to debounce (string, number, object, etc.)
 * @param delay - Debounce delay in milliseconds (default: 300ms)
 * @returns Debounced value that updates after delay period of no changes
 *
 * @example
 * // Basic search input debouncing
 * const [search, setSearch] = useState('');
 * const debouncedSearch = useDebouncedValue(search, 500);
 *
 * // Only triggers API call after user stops typing for 500ms
 * useEffect(() => {
 *   if (debouncedSearch) {
 *     searchAPI(debouncedSearch);
 *   }
 * }, [debouncedSearch]);
 *
 * <Input
 *   value={search}
 *   onChange={(e) => setSearch(e.target.value)}
 *   placeholder="Search..."
 * />
 *
 * @example
 * // Debounce complex filter object
 * const [filters, setFilters] = useState({ status: [], priority: [] });
 * const debouncedFilters = useDebouncedValue(filters, 300);
 *
 * const { data } = useWorkItems({
 *   filters: debouncedFilters, // Only refetch after 300ms of no filter changes
 * });
 *
 * @example
 * // Validation with custom delay
 * const [username, setUsername] = useState('');
 * const debouncedUsername = useDebouncedValue(username, 800);
 *
 * useEffect(() => {
 *   if (debouncedUsername.length >= 3) {
 *     checkUsernameAvailability(debouncedUsername);
 *   }
 * }, [debouncedUsername]);
 */
export function useDebouncedValue<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Set debounced value after delay
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Cleanup timeout if value changes before delay completes
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
