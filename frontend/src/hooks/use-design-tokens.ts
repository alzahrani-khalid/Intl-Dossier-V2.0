/**
 * Design Tokens Hook
 * @module hooks/use-design-tokens
 * @feature 034-dossier-ui-polish
 *
 * TanStack Query hook for fetching and accessing design tokens from the backend API.
 *
 * @description
 * This module provides a hook for managing design tokens (colors, spacing, typography, etc.):
 * - Fetches tokens from the backend API with optional category and theme filtering
 * - Provides CSS variable accessor with fallback support
 * - Graceful error handling for unimplemented backend endpoints
 * - Type-safe token categories and values
 *
 * Design tokens enable consistent styling across the application and support theme switching.
 *
 * @example
 * // Fetch all tokens
 * const { tokens, isLoading } = useDesignTokens();
 *
 * @example
 * // Fetch tokens by category
 * const { tokens } = useDesignTokens({ category: 'color' });
 *
 * @example
 * // Access CSS variables
 * const { getVar } = useDesignTokens();
 * const primaryColor = getVar('--color-primary', '#0066CC');
 */

import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { DesignToken, DesignTokenCategory } from '../types/design-token'

interface UseDesignTokensOptions {
  category?: DesignTokenCategory
  theme?: string
  enabled?: boolean
}

interface TokensResponse {
  tokens: DesignToken[]
}

/**
 * Get CSS custom property value from document root
 *
 * @description
 * Internal utility to read CSS custom property values from the :root element.
 * Returns undefined if window is not available (SSR) or variable is not set.
 *
 * @param name - CSS variable name (e.g., '--color-primary')
 * @returns The trimmed variable value or undefined
 */
function getCssVar(name: string): string | undefined {
  if (typeof window === 'undefined') return undefined
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  return value || undefined
}

/**
 * Hook to fetch and access design tokens
 *
 * @description
 * Fetches design tokens from the backend API with optional filtering.
 * Provides a getVar utility for reading CSS variables with fallbacks.
 * Gracefully handles backend errors with retry logic.
 *
 * @param options - Configuration object with category, theme, and enabled flags
 * @returns Object containing tokens array, loading state, error, reload function, and getVar utility
 *
 * @example
 * // Fetch color tokens
 * const { tokens, isLoading, getVar } = useDesignTokens({ category: 'color' });
 *
 * @example
 * // Access CSS variable with fallback
 * const { getVar } = useDesignTokens();
 * const spacing = getVar('--spacing-md', '16px');
 */
export function useDesignTokens(options: UseDesignTokensOptions = {}) {
  const { category, theme, enabled = true } = options
  const queryKey = useMemo(() => ['design-tokens', { category, theme }], [category, theme])

  const { data, isLoading, refetch, error } = useQuery<TokensResponse>({
    queryKey,
    queryFn: async () => {
      const qs = new URLSearchParams()
      if (category) qs.set('category', category)
      if (theme) qs.set('theme', theme)
      const res = await fetch(`/api/design/tokens?${qs.toString()}`)
      if (!res.ok) throw new Error('Failed to load design tokens')
      return (await res.json()) as TokensResponse
    },
    enabled,
    // If the backend is not implemented yet, suppress errors and provide graceful fallback
    retry: (failureCount, err) => {
      // Only retry network errors once
      if ((err as any)?.message?.includes('Failed to load') && failureCount >= 1) return false
      return failureCount < 2
    },
  })

  const getVar = (cssVariable: string, fallback?: string): string | undefined =>
    getCssVar(cssVariable) ?? fallback

  return {
    tokens: data?.tokens ?? [],
    isLoading,
    error: error as Error | null,
    reload: refetch,
    getVar,
  }
}

