/**
 * Geographic Visualization Hook
 * Feature: geographic-visualization
 *
 * Provides data fetching and state management for the interactive world map:
 * - Fetches country engagement metrics
 * - Fetches relationship flows
 * - Handles filtering by time, region, relationship type
 * - Caches and refetches data efficiently
 */

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type {
  GeoVisualizationFilters,
  GeoVisualizationResponse,
  CountryEngagementMetrics,
  RelationshipFlow,
  MapConnection,
  GeoVisualizationSummary,
  DEFAULT_GEO_FILTERS,
} from '@/types/geographic-visualization.types'
import { useState, useCallback, useMemo } from 'react'

// Query keys
const GEO_VIZ_KEYS = {
  all: ['geographic-visualization'] as const,
  data: (filters: Partial<GeoVisualizationFilters>) =>
    [...GEO_VIZ_KEYS.all, 'data', filters] as const,
  countries: (filters: Partial<GeoVisualizationFilters>) =>
    [...GEO_VIZ_KEYS.all, 'countries', filters] as const,
  relationships: (filters: Partial<GeoVisualizationFilters>) =>
    [...GEO_VIZ_KEYS.all, 'relationships', filters] as const,
  summary: (filters: Partial<GeoVisualizationFilters>) =>
    [...GEO_VIZ_KEYS.all, 'summary', filters] as const,
}

// Default filters
const defaultFilters: GeoVisualizationFilters = {
  timeRange: '90d',
  relationshipTypes: [],
  engagementTypes: [],
  regions: [],
  countries: [],
  intensityThreshold: 'none',
  showRelationshipFlows: true,
  showEngagementHeatmap: true,
  showRegionalGroupings: false,
}

/**
 * Fetch geographic visualization data from Edge Function
 */
async function fetchGeoVisualizationData(
  endpoint: 'data' | 'countries' | 'relationships' | 'summary',
  filters: Partial<GeoVisualizationFilters>,
): Promise<GeoVisualizationResponse['data']> {
  const params = new URLSearchParams()
  params.set('endpoint', endpoint)

  if (filters.timeRange) params.set('timeRange', filters.timeRange)
  if (filters.customDateRange?.start) params.set('startDate', filters.customDateRange.start)
  if (filters.customDateRange?.end) params.set('endDate', filters.customDateRange.end)
  if (filters.relationshipTypes?.length)
    params.set('relationshipTypes', filters.relationshipTypes.join(','))
  if (filters.engagementTypes?.length)
    params.set('engagementTypes', filters.engagementTypes.join(','))
  if (filters.regions?.length) params.set('regions', filters.regions.join(','))
  if (filters.countries?.length) params.set('countries', filters.countries.join(','))

  const { data, error } = await supabase.functions.invoke('geographic-visualization', {
    body: null,
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  // Fallback: directly query the RPC function if edge function not deployed
  if (error) {
    console.warn('Edge function error, falling back to RPC:', error)
    return await fetchGeoVisualizationDataRPC(filters)
  }

  if (!data.success) {
    throw new Error(data.error?.message || 'Failed to fetch geographic data')
  }

  return data.data
}

/**
 * Fallback: fetch data directly via RPC
 */
async function fetchGeoVisualizationDataRPC(
  filters: Partial<GeoVisualizationFilters>,
): Promise<GeoVisualizationResponse['data']> {
  const { data, error } = await supabase.rpc('get_geographic_visualization_data', {
    p_time_range: filters.timeRange || '90d',
    p_start_date: filters.customDateRange?.start || null,
    p_end_date: filters.customDateRange?.end || null,
    p_relationship_types: filters.relationshipTypes?.length ? filters.relationshipTypes : null,
    p_engagement_types: filters.engagementTypes?.length ? filters.engagementTypes : null,
    p_regions: filters.regions?.length ? filters.regions : null,
    p_countries: filters.countries?.length ? filters.countries : null,
  })

  if (error) {
    throw new Error(error.message || 'Failed to fetch geographic data')
  }

  // Transform RPC data to match expected format
  const countries = data?.countries || []
  const relationships = data?.relationships || []

  // Calculate intensity for countries
  const maxEngagements = Math.max(
    ...countries.map((c: { totalEngagements?: number }) => c.totalEngagements || 0),
    1,
  )

  const enrichedCountries: CountryEngagementMetrics[] = countries.map(
    (country: {
      id: string
      iso_code_2: string
      name_en: string
      name_ar: string
      coordinates: { lat: number; lng: number }
      totalEngagements?: number
      recentEngagements?: number
      upcomingEngagements?: number
      lastEngagementDate?: string
      nextEngagementDate?: string
      engagementsByType?: Record<string, number>
    }) => ({
      countryId: country.id,
      iso_code_2: country.iso_code_2,
      name_en: country.name_en,
      name_ar: country.name_ar,
      coordinates: country.coordinates,
      totalEngagements: country.totalEngagements || 0,
      engagementsByType: country.engagementsByType || {},
      engagementsByStatus: {},
      intensity: calculateIntensity(country.totalEngagements || 0, maxEngagements),
      intensityScore: Math.round(((country.totalEngagements || 0) / maxEngagements) * 100),
      recentEngagements: country.recentEngagements || 0,
      upcomingEngagements: country.upcomingEngagements || 0,
      lastEngagementDate: country.lastEngagementDate,
      nextEngagementDate: country.nextEngagementDate,
    }),
  )

  // Create connections from relationships
  const connections: MapConnection[] = relationships.map(
    (rel: {
      source: { coordinates: { lat: number; lng: number }; name_en: string }
      target: { coordinates: { lat: number; lng: number }; name_en: string }
    }) => ({
      start: { ...rel.source.coordinates, label: rel.source.name_en },
      end: { ...rel.target.coordinates, label: rel.target.name_en },
    }),
  )

  return {
    countries: enrichedCountries,
    relationships,
    connections,
    summary: data?.summary,
    timeRange: data?.timeRange,
    generatedAt: data?.generatedAt || new Date().toISOString(),
  }
}

/**
 * Calculate intensity level from engagement count
 */
function calculateIntensity(
  count: number,
  maxCount: number,
): 'none' | 'low' | 'medium' | 'high' | 'very_high' {
  if (count === 0) return 'none'
  const ratio = count / Math.max(maxCount, 1)
  if (ratio >= 0.8) return 'very_high'
  if (ratio >= 0.5) return 'high'
  if (ratio >= 0.25) return 'medium'
  return 'low'
}

/**
 * Main hook for geographic visualization
 */
export function useGeographicVisualization(initialFilters?: Partial<GeoVisualizationFilters>) {
  const queryClient = useQueryClient()
  const [filters, setFilters] = useState<GeoVisualizationFilters>({
    ...defaultFilters,
    ...initialFilters,
  })

  // Fetch full visualization data
  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: GEO_VIZ_KEYS.data(filters),
    queryFn: () => fetchGeoVisualizationData('data', filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes cache
    retry: 2,
  })

  // Memoized derived data
  const countries = useMemo(() => data?.countries || [], [data?.countries])
  const relationships = useMemo(() => data?.relationships || [], [data?.relationships])
  const connections = useMemo(() => data?.connections || [], [data?.connections])
  const summary = useMemo(() => data?.summary, [data?.summary])

  // Filter connections based on visibility settings
  const visibleConnections = useMemo(() => {
    if (!filters.showRelationshipFlows) return []
    return connections
  }, [connections, filters.showRelationshipFlows])

  // Filter countries based on intensity threshold
  const visibleCountries = useMemo(() => {
    if (filters.intensityThreshold === 'none') return countries

    const thresholds = ['none', 'low', 'medium', 'high', 'very_high']
    const minIndex = thresholds.indexOf(filters.intensityThreshold)

    return countries.filter((country) => {
      const countryIndex = thresholds.indexOf(country.intensity)
      return countryIndex >= minIndex
    })
  }, [countries, filters.intensityThreshold])

  // Update filters
  const updateFilters = useCallback((newFilters: Partial<GeoVisualizationFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }))
  }, [])

  // Reset filters to default
  const resetFilters = useCallback(() => {
    setFilters(defaultFilters)
  }, [])

  // Invalidate and refetch
  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: GEO_VIZ_KEYS.all })
  }, [queryClient])

  // Get country by ISO code
  const getCountryByIso = useCallback(
    (isoCode: string) => {
      return countries.find((c) => c.iso_code_2 === isoCode)
    },
    [countries],
  )

  // Get relationships for a country
  const getCountryRelationships = useCallback(
    (countryId: string) => {
      return relationships.filter(
        (r) => r.source.countryId === countryId || r.target.countryId === countryId,
      )
    },
    [relationships],
  )

  return {
    // Data
    countries: visibleCountries,
    allCountries: countries,
    relationships,
    connections: visibleConnections,
    allConnections: connections,
    summary,
    timeRange: data?.timeRange,
    generatedAt: data?.generatedAt,

    // State
    filters,
    isLoading,
    isFetching,
    error: error as Error | null,

    // Actions
    updateFilters,
    resetFilters,
    refetch,
    invalidate,

    // Helpers
    getCountryByIso,
    getCountryRelationships,
  }
}

/**
 * Hook for just country data
 */
export function useCountryEngagementMetrics(filters?: Partial<GeoVisualizationFilters>) {
  return useQuery({
    queryKey: GEO_VIZ_KEYS.countries(filters || {}),
    queryFn: () => fetchGeoVisualizationData('countries', filters || {}),
    staleTime: 5 * 60 * 1000,
    select: (data) => data?.countries || [],
  })
}

/**
 * Hook for just relationship data
 */
export function useRelationshipFlows(filters?: Partial<GeoVisualizationFilters>) {
  return useQuery({
    queryKey: GEO_VIZ_KEYS.relationships(filters || {}),
    queryFn: () => fetchGeoVisualizationData('relationships', filters || {}),
    staleTime: 5 * 60 * 1000,
    select: (data) => ({
      relationships: data?.relationships || [],
      connections: data?.connections || [],
    }),
  })
}

/**
 * Hook for summary statistics
 */
export function useGeoVisualizationSummary(filters?: Partial<GeoVisualizationFilters>) {
  return useQuery({
    queryKey: GEO_VIZ_KEYS.summary(filters || {}),
    queryFn: () => fetchGeoVisualizationData('summary', filters || {}),
    staleTime: 5 * 60 * 1000,
    select: (data) => data?.summary,
  })
}

export default useGeographicVisualization
