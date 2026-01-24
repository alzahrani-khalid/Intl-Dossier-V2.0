/**
 * Navigation Utilities Hook
 * @module hooks/useNavigation
 *
 * Provides a simplified interface for programmatic navigation using TanStack Router.
 *
 * @description
 * This module wraps TanStack Router's navigation APIs to provide a consistent,
 * easy-to-use interface for common navigation operations:
 * - Programmatic route navigation with optional replace mode
 * - Browser history navigation (back/forward)
 * - Current route path tracking
 * - Navigation state queries (can go back/forward)
 *
 * @example
 * // Basic navigation
 * const { goTo, goBack, currentPath } = useNavigation();
 * goTo('/dossiers/123');
 *
 * @example
 * // Navigation with replace
 * const { goTo } = useNavigation();
 * goTo('/login', { replace: true }); // Replace current history entry
 *
 * @example
 * // Browser history navigation
 * const { goBack, goForward, canGoBack } = useNavigation();
 * if (canGoBack) {
 *   goBack();
 * }
 */

import { useNavigate, useRouter } from '@tanstack/react-router'
import { useCallback } from 'react'

/**
 * Hook for programmatic navigation and route management
 *
 * @description
 * Provides utilities for navigating between routes, managing browser history,
 * and tracking the current route. Built on top of TanStack Router with a
 * simplified API for common navigation patterns.
 *
 * @returns Navigation utilities object containing:
 * - `goTo`: Function to navigate to a specific route
 * - `goBack`: Function to navigate backward in history
 * - `goForward`: Function to navigate forward in history
 * - `canGoBack`: Boolean indicating if backward navigation is possible
 * - `currentPath`: String containing the current pathname
 *
 * @example
 * // Basic usage in a component
 * function MyComponent() {
 *   const { goTo, currentPath } = useNavigation();
 *
 *   return (
 *     <div>
 *       <p>Current: {currentPath}</p>
 *       <button onClick={() => goTo('/home')}>Go Home</button>
 *     </div>
 *   );
 * }
 *
 * @example
 * // Navigation with options
 * function LoginRedirect() {
 *   const { goTo } = useNavigation();
 *
 *   useEffect(() => {
 *     // Replace current entry to prevent back navigation to login
 *     goTo('/dashboard', { replace: true });
 *   }, []);
 * }
 *
 * @example
 * // Browser history controls
 * function HistoryButtons() {
 *   const { goBack, goForward, canGoBack } = useNavigation();
 *
 *   return (
 *     <div>
 *       <button onClick={goBack} disabled={!canGoBack}>Back</button>
 *       <button onClick={goForward}>Forward</button>
 *     </div>
 *   );
 * }
 */
export function useNavigation() {
  const navigate = useNavigate()
  const router = useRouter()

  /**
   * Navigate to a specific route
   *
   * @param to - The route path to navigate to
   * @param options - Navigation options
   * @param options.replace - If true, replace current history entry instead of pushing
   * @param options.state - Optional state to pass to the route
   */
  const goTo = useCallback(
    (to: string, options?: { replace?: boolean; state?: any }) => {
      navigate({ to, replace: options?.replace })
    },
    [navigate]
  )

  /**
   * Navigate backward in browser history
   */
  const goBack = useCallback(() => {
    router.history.back()
  }, [router.history])

  /**
   * Navigate forward in browser history
   */
  const goForward = useCallback(() => {
    router.history.forward()
  }, [router.history])

  /**
   * Whether backward navigation is possible
   */
  const canGoBack = router.history.length > 1

  return {
    goTo,
    goBack,
    goForward,
    canGoBack,
    currentPath: router.state.location.pathname,
  }
}

