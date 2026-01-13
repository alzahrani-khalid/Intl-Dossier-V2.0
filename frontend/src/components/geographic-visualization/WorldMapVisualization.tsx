/**
 * World Map Visualization Component
 * Feature: geographic-visualization
 *
 * Interactive world map displaying:
 * - Country engagement heatmaps
 * - Relationship flows between countries
 * - Regional groupings
 * - Interactive tooltips and click handlers
 */

import { useMemo, useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import WorldMap from '@/components/ui/world-map'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useGeographicVisualization } from '@/hooks/useGeographicVisualization'
import type {
  CountryEngagementMetrics,
  MapConnection,
  GeoVisualizationFilters,
  EngagementIntensity,
} from '@/types/geographic-visualization.types'
import {
  INTENSITY_COLORS,
  INTENSITY_LABELS,
  REGION_COLORS,
  REGION_LABELS,
  COUNTRY_COORDINATES,
} from '@/types/geographic-visualization.types'
import { Globe, MapPin, Activity, TrendingUp, Calendar } from 'lucide-react'

interface WorldMapVisualizationProps {
  initialFilters?: Partial<GeoVisualizationFilters>
  onCountryClick?: (country: CountryEngagementMetrics) => void
  showLegend?: boolean
  showSummaryCards?: boolean
  height?: string
  className?: string
}

export function WorldMapVisualization({
  initialFilters,
  onCountryClick,
  showLegend = true,
  showSummaryCards = true,
  height = 'h-[400px] sm:h-[500px] lg:h-[600px]',
  className = '',
}: WorldMapVisualizationProps) {
  const { t, i18n } = useTranslation('geographic-visualization')
  const isRTL = i18n.language === 'ar'

  const [selectedCountry, setSelectedCountry] = useState<CountryEngagementMetrics | null>(null)

  const { countries, connections, summary, isLoading, error, filters } =
    useGeographicVisualization(initialFilters)

  // Transform countries to map markers
  const markers = useMemo(() => {
    return countries
      .map((country) => {
        // Use stored coordinates or fallback to default
        const coords = country.coordinates?.lat
          ? country.coordinates
          : COUNTRY_COORDINATES[country.iso_code_2] || { lat: 0, lng: 0 }

        return {
          lat: coords.lat,
          lng: coords.lng,
          label: isRTL ? country.name_ar : country.name_en,
          color: INTENSITY_COLORS[country.intensity || 'none'],
          size: getMarkerSize(country.totalEngagements),
          intensity: country.intensityScore || 0,
          onClick: () => handleCountryClick(country),
        }
      })
      .filter((m) => m.lat !== 0 && m.lng !== 0) // Filter out countries without coordinates
  }, [countries, isRTL])

  // Transform connections to map dots format
  const dots = useMemo(() => {
    if (!filters.showRelationshipFlows) return []

    return connections
      .map((conn) => ({
        start: {
          lat: conn.start.lat,
          lng: conn.start.lng,
          label: conn.start.label,
        },
        end: {
          lat: conn.end.lat,
          lng: conn.end.lng,
          label: conn.end.label,
        },
      }))
      .filter((d) => d.start.lat !== 0 && d.start.lng !== 0 && d.end.lat !== 0 && d.end.lng !== 0)
  }, [connections, filters.showRelationshipFlows])

  // Handle country click
  const handleCountryClick = useCallback(
    (country: CountryEngagementMetrics) => {
      setSelectedCountry(country)
      onCountryClick?.(country)
    },
    [onCountryClick],
  )

  // Get marker size based on engagement count
  function getMarkerSize(count: number): 'small' | 'medium' | 'large' {
    if (count >= 10) return 'large'
    if (count >= 3) return 'medium'
    return 'small'
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center text-muted-foreground">
            <Globe className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>{t('error.loadFailed', 'Failed to load map data')}</p>
            <p className="text-sm mt-2">{error.message}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={`space-y-4 ${className}`} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Summary Cards */}
      {showSummaryCards && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
          <SummaryCard
            icon={<Globe className="h-4 w-4" />}
            label={t('summary.totalCountries', 'Countries')}
            value={summary?.totalCountries || 0}
            subValue={`${summary?.countriesWithEngagements || 0} ${t('summary.active', 'active')}`}
            isLoading={isLoading}
          />
          <SummaryCard
            icon={<Activity className="h-4 w-4" />}
            label={t('summary.engagements', 'Engagements')}
            value={summary?.totalEngagements || 0}
            isLoading={isLoading}
          />
          <SummaryCard
            icon={<TrendingUp className="h-4 w-4" />}
            label={t('summary.relationships', 'Relationships')}
            value={connections.length}
            isLoading={isLoading}
          />
          <SummaryCard
            icon={<MapPin className="h-4 w-4" />}
            label={t('summary.regions', 'Regions')}
            value={summary?.regionBreakdown?.length || 0}
            isLoading={isLoading}
          />
        </div>
      )}

      {/* Map Container */}
      <Card>
        <CardContent className={`p-0 ${height} relative overflow-hidden`}>
          {isLoading ? (
            <div className="absolute inset-0 flex items-center justify-center bg-muted/50">
              <div className="text-center">
                <Skeleton className="h-8 w-8 rounded-full mx-auto mb-2" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
          ) : (
            <WorldMap
              dots={dots}
              markers={markers}
              lineColor="#3B82F6"
              theme="light"
              showLabels={countries.length < 20}
              animateConnections={connections.length < 50}
              className="h-full"
            />
          )}

          {/* Legend */}
          {showLegend && !isLoading && (
            <div className="absolute bottom-2 start-2 sm:bottom-4 sm:start-4 bg-background/90 backdrop-blur-sm rounded-lg p-2 sm:p-3 border shadow-sm">
              <p className="text-xs font-medium mb-2">
                {t('legend.intensity', 'Engagement Intensity')}
              </p>
              <div className="flex flex-wrap gap-1 sm:gap-2">
                {(['low', 'medium', 'high', 'very_high'] as EngagementIntensity[]).map((level) => (
                  <div key={level} className="flex items-center gap-1">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: INTENSITY_COLORS[level] }}
                    />
                    <span className="text-[10px] sm:text-xs text-muted-foreground">
                      {isRTL ? INTENSITY_LABELS[level].ar : INTENSITY_LABELS[level].en}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Selected Country Info */}
          {selectedCountry && (
            <div className="absolute top-2 end-2 sm:top-4 sm:end-4 bg-background/95 backdrop-blur-sm rounded-lg p-3 sm:p-4 border shadow-lg max-w-xs">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="font-semibold text-sm sm:text-base">
                    {isRTL ? selectedCountry.name_ar : selectedCountry.name_en}
                  </h4>
                  <p className="text-xs text-muted-foreground">{selectedCountry.iso_code_2}</p>
                </div>
                <Badge variant="outline" className="text-[10px]">
                  {isRTL
                    ? INTENSITY_LABELS[selectedCountry.intensity].ar
                    : INTENSITY_LABELS[selectedCountry.intensity].en}
                </Badge>
              </div>
              <div className="mt-3 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">
                    {t('country.totalEngagements', 'Total Engagements')}
                  </span>
                  <span className="font-medium">{selectedCountry.totalEngagements}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">
                    {t('country.recentEngagements', 'Recent (30d)')}
                  </span>
                  <span className="font-medium">{selectedCountry.recentEngagements}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">
                    {t('country.upcomingEngagements', 'Upcoming')}
                  </span>
                  <span className="font-medium">{selectedCountry.upcomingEngagements}</span>
                </div>
                {selectedCountry.lastEngagementDate && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground pt-2 border-t">
                    <Calendar className="h-3 w-3" />
                    <span>
                      {t('country.lastEngagement', 'Last')}:{' '}
                      {new Date(selectedCountry.lastEngagementDate).toLocaleDateString(
                        isRTL ? 'ar-SA' : 'en-US',
                      )}
                    </span>
                  </div>
                )}
              </div>
              <button
                onClick={() => setSelectedCountry(null)}
                className="absolute top-2 end-2 text-muted-foreground hover:text-foreground"
                aria-label={t('close', 'Close')}
              >
                <span className="sr-only">{t('close', 'Close')}</span>
                &times;
              </button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Regional Breakdown */}
      {showSummaryCards && summary?.regionBreakdown && (
        <Card>
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-sm font-medium">
              {t('regions.title', 'Regional Breakdown')}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
              {summary.regionBreakdown.map((region) => (
                <div
                  key={region.region}
                  className="flex items-center gap-2 p-2 rounded-lg border bg-muted/30"
                >
                  <div
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{
                      backgroundColor: REGION_COLORS[region.region as keyof typeof REGION_COLORS],
                    }}
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-medium truncate">
                      {isRTL
                        ? REGION_LABELS[region.region as keyof typeof REGION_LABELS]?.ar
                        : REGION_LABELS[region.region as keyof typeof REGION_LABELS]?.en}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {region.countryCount} {t('regions.countries', 'countries')} |{' '}
                      {region.engagementCount} {t('regions.engagements', 'eng.')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// Summary Card Component
interface SummaryCardProps {
  icon: React.ReactNode
  label: string
  value: number | string
  subValue?: string
  isLoading?: boolean
}

function SummaryCard({ icon, label, value, subValue, isLoading }: SummaryCardProps) {
  return (
    <Card>
      <CardContent className="p-3 sm:p-4">
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-6 w-12" />
            <Skeleton className="h-3 w-20" />
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              {icon}
              <span className="text-xs">{label}</span>
            </div>
            <p className="text-lg sm:text-2xl font-bold">{value}</p>
            {subValue && <p className="text-[10px] sm:text-xs text-muted-foreground">{subValue}</p>}
          </>
        )}
      </CardContent>
    </Card>
  )
}

export default WorldMapVisualization
