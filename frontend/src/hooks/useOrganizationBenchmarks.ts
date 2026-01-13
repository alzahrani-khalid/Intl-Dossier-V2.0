/**
 * useOrganizationBenchmarks Hook
 * Fetches anonymized aggregate statistics from similar organizations
 * to show data-driven preview before dashboard customization
 */

import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'

import { supabase } from '@/lib/supabase'
import type {
  OrganizationBenchmark,
  BenchmarkPreviewData,
  GetBenchmarksParams,
  GetBenchmarksResponse,
  CurrentOrganizationStats,
  OrganizationType,
} from '@/types/organization-benchmark.types'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL

// Query keys for caching
export const benchmarkKeys = {
  all: ['organization-benchmarks'] as const,
  benchmarks: (params?: GetBenchmarksParams) =>
    [...benchmarkKeys.all, 'benchmarks', params] as const,
  currentStats: () => [...benchmarkKeys.all, 'current-stats'] as const,
  previewData: () => [...benchmarkKeys.all, 'preview-data'] as const,
}

// Helper to get access token
async function getAccessToken(): Promise<string> {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session?.access_token) {
    throw new Error('Not authenticated')
  }
  return session.access_token
}

// Fetch benchmark data from the edge function
async function fetchBenchmarks(
  params?: GetBenchmarksParams,
): Promise<OrganizationBenchmark | null> {
  const accessToken = await getAccessToken()

  const queryParams = new URLSearchParams()
  if (params?.organizationType) {
    queryParams.set('organization_type', params.organizationType)
  }
  if (params?.region) {
    queryParams.set('region', params.region)
  }

  const response = await fetch(
    `${SUPABASE_URL}/functions/v1/organization-benchmarks?${queryParams.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    },
  )

  if (!response.ok) {
    // If the function doesn't exist yet, return mock data
    if (response.status === 404) {
      return getMockBenchmarkData()
    }
    const error = await response.json()
    throw new Error(error.error?.message_en || 'Failed to fetch benchmarks')
  }

  const data: GetBenchmarksResponse = await response.json()
  return data.data
}

// Fetch current organization stats
async function fetchCurrentStats(): Promise<CurrentOrganizationStats | null> {
  const accessToken = await getAccessToken()

  const response = await fetch(
    `${SUPABASE_URL}/functions/v1/organization-benchmarks?action=current-stats`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    },
  )

  if (!response.ok) {
    // If the function doesn't exist yet, return null
    if (response.status === 404) {
      return null
    }
    return null
  }

  const data = await response.json()
  return data.data
}

// Mock benchmark data for development and when API is not available
function getMockBenchmarkData(): OrganizationBenchmark {
  return {
    avgDossiers: 127,
    dossierRange: { min: 45, max: 250 },
    avgRelationships: 342,
    relationshipRange: { min: 120, max: 600 },
    avgActiveBriefs: 28,
    briefRange: { min: 10, max: 55 },
    avgMonthlyEngagements: 15,
    engagementRange: { min: 5, max: 35 },
    avgCommitments: 47,
    commitmentRange: { min: 15, max: 95 },
    avgMous: 23,
    mouRange: { min: 8, max: 45 },
    sampleSize: 42,
    organizationType: 'statistical_office',
    region: 'Middle East',
    lastUpdated: new Date().toISOString(),
  }
}

// Check if user has customized their dashboard (localStorage check)
function hasCustomizedDashboard(): boolean {
  const storedLayout = localStorage.getItem('dashboard-widget-layout')
  if (!storedLayout) return false

  try {
    const widgets = JSON.parse(storedLayout)
    // Consider customized if user has made any changes (added/removed widgets)
    // Default layout has 8 widgets
    return Array.isArray(widgets) && widgets.length !== 8
  } catch {
    return false
  }
}

// Check if preview should be shown
function shouldShowBenchmarkPreview(): boolean {
  // Don't show if user has dismissed the preview
  const dismissed = localStorage.getItem('dashboard-benchmark-preview-dismissed')
  if (dismissed === 'true') return false

  // Show if user hasn't customized their dashboard yet
  return !hasCustomizedDashboard()
}

/**
 * Hook to fetch organization benchmarks
 */
export function useOrganizationBenchmarks(params?: GetBenchmarksParams) {
  return useQuery({
    queryKey: benchmarkKeys.benchmarks(params),
    queryFn: () => fetchBenchmarks(params),
    staleTime: 1000 * 60 * 60, // 1 hour - benchmarks don't change often
    gcTime: 1000 * 60 * 60 * 24, // 24 hours
    retry: 1,
  })
}

/**
 * Hook to fetch current organization stats
 */
export function useCurrentOrganizationStats() {
  return useQuery({
    queryKey: benchmarkKeys.currentStats(),
    queryFn: fetchCurrentStats,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
    retry: 1,
  })
}

/**
 * Combined hook for benchmark preview data
 */
export function useBenchmarkPreview(): {
  data: BenchmarkPreviewData
  isLoading: boolean
  error: Error | null
  dismissPreview: () => void
} {
  const { i18n } = useTranslation()
  const isArabic = i18n.language === 'ar'

  const benchmarksQuery = useOrganizationBenchmarks({
    region: isArabic ? 'Middle East' : undefined,
  })

  const currentStatsQuery = useCurrentOrganizationStats()

  const dismissPreview = () => {
    localStorage.setItem('dashboard-benchmark-preview-dismissed', 'true')
    // Force re-render by clearing the cache
    window.dispatchEvent(new CustomEvent('benchmark-preview-dismissed'))
  }

  const shouldShow = shouldShowBenchmarkPreview()

  return {
    data: {
      isAvailable: !!benchmarksQuery.data,
      benchmarks: benchmarksQuery.data ?? null,
      currentStats: currentStatsQuery.data ?? null,
      hasCustomizedDashboard: hasCustomizedDashboard(),
      shouldShowPreview: shouldShow && !!benchmarksQuery.data,
    },
    isLoading: benchmarksQuery.isLoading,
    error: benchmarksQuery.error,
    dismissPreview,
  }
}

export default useBenchmarkPreview
