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

function getCssVar(name: string): string | undefined {
  if (typeof window === 'undefined') return undefined
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  return value || undefined
}

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

