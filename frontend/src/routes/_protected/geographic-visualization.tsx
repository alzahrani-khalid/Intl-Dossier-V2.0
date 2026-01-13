/**
 * Geographic Visualization Route
 * Feature: geographic-visualization
 */

import { createFileRoute } from '@tanstack/react-router'
import { GeographicVisualizationPage } from '@/pages/geographic-visualization/GeographicVisualizationPage'
import type { TimeRange } from '@/types/geographic-visualization.types'

// Search params schema
interface GeoVisualizationSearchParams {
  timeRange?: TimeRange
  regions?: string[]
  relationshipTypes?: string[]
  view?: 'map' | 'list'
}

export const Route = createFileRoute('/_protected/geographic-visualization')({
  validateSearch: (search: Record<string, unknown>): GeoVisualizationSearchParams => {
    const timeRange = search.timeRange as string | undefined
    const regions = search.regions as string[] | undefined
    const relationshipTypes = search.relationshipTypes as string[] | undefined
    const view = search.view as string | undefined

    return {
      timeRange: ['7d', '30d', '90d', '365d', 'custom'].includes(timeRange || '')
        ? (timeRange as TimeRange)
        : undefined,
      regions: Array.isArray(regions) ? regions : undefined,
      relationshipTypes: Array.isArray(relationshipTypes) ? relationshipTypes : undefined,
      view: ['map', 'list'].includes(view || '') ? (view as 'map' | 'list') : undefined,
    }
  },
  component: GeographicVisualizationRoute,
})

function GeographicVisualizationRoute() {
  return <GeographicVisualizationPage />
}
