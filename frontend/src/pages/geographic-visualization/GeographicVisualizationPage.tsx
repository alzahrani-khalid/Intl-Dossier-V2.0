/**
 * Geographic Visualization Page
 * Feature: geographic-visualization
 *
 * Interactive world map page displaying:
 * - Country engagement heatmaps
 * - Relationship flows between countries
 * - Regional groupings
 * - Filtering by relationship type, time period, intensity
 */

import { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from '@tanstack/react-router'
import { WorldMapVisualization } from '@/components/geographic-visualization/WorldMapVisualization'
import { MapFilterControls } from '@/components/geographic-visualization/MapFilterControls'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useGeographicVisualization } from '@/hooks/useGeographicVisualization'
import type { CountryEngagementMetrics } from '@/types/geographic-visualization.types'
import {
  INTENSITY_COLORS,
  INTENSITY_LABELS,
  REGION_LABELS,
} from '@/types/geographic-visualization.types'
import {
  Globe,
  Map,
  List,
  ArrowRight,
  ExternalLink,
  TrendingUp,
  Activity,
  Calendar,
  ChevronRight,
} from 'lucide-react'

export function GeographicVisualizationPage() {
  const { t, i18n } = useTranslation('geographic-visualization')
  const isRTL = i18n.language === 'ar'
  const navigate = useNavigate()

  const [activeTab, setActiveTab] = useState<'map' | 'list'>('map')

  const {
    countries,
    allCountries,
    connections,
    summary,
    filters,
    isLoading,
    updateFilters,
    resetFilters,
  } = useGeographicVisualization()

  // Handle country click - navigate to country dossier
  const handleCountryClick = useCallback(
    (country: CountryEngagementMetrics) => {
      // Navigate to dossier page with country filter
      navigate({ to: '/dossiers', search: { type: 'country', countryId: country.countryId } })
    },
    [navigate],
  )

  // Sort countries by engagement count for list view
  const sortedCountries = [...allCountries].sort((a, b) => b.totalEngagements - a.totalEngagements)

  return (
    <div
      className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold flex items-center gap-2">
            <Globe className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
            {t('page.title', 'Geographic Visualization')}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t(
              'page.description',
              'Interactive map showing country relationships and engagement activity',
            )}
          </p>
        </div>

        {/* View Toggle */}
        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as 'map' | 'list')}
          className="w-auto"
        >
          <TabsList className="h-9">
            <TabsTrigger value="map" className="text-xs sm:text-sm gap-1.5 px-3">
              <Map className="h-4 w-4" />
              <span className="hidden sm:inline">{t('tabs.map', 'Map View')}</span>
            </TabsTrigger>
            <TabsTrigger value="list" className="text-xs sm:text-sm gap-1.5 px-3">
              <List className="h-4 w-4" />
              <span className="hidden sm:inline">{t('tabs.list', 'List View')}</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <MapFilterControls
            filters={filters}
            onFiltersChange={updateFilters}
            onReset={resetFilters}
            isLoading={isLoading}
          />
        </CardContent>
      </Card>

      {/* Main Content */}
      {activeTab === 'map' ? (
        <WorldMapVisualization
          initialFilters={filters}
          onCountryClick={handleCountryClick}
          showLegend={true}
          showSummaryCards={true}
          height="h-[350px] sm:h-[450px] lg:h-[550px]"
        />
      ) : (
        <div className="space-y-4">
          {/* Summary Stats for List View */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Globe className="h-4 w-4" />
                  <span className="text-xs">{t('summary.totalCountries', 'Countries')}</span>
                </div>
                <p className="text-2xl font-bold">{summary?.totalCountries || 0}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Activity className="h-4 w-4" />
                  <span className="text-xs">{t('summary.engagements', 'Engagements')}</span>
                </div>
                <p className="text-2xl font-bold">{summary?.totalEngagements || 0}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <TrendingUp className="h-4 w-4" />
                  <span className="text-xs">{t('summary.activeCountries', 'Active')}</span>
                </div>
                <p className="text-2xl font-bold">{summary?.countriesWithEngagements || 0}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Calendar className="h-4 w-4" />
                  <span className="text-xs">{t('summary.relationships', 'Relationships')}</span>
                </div>
                <p className="text-2xl font-bold">{connections.length}</p>
              </CardContent>
            </Card>
          </div>

          {/* Countries Table */}
          <Card>
            <CardHeader className="py-4">
              <CardTitle className="text-base">
                {t('list.title', 'Countries by Engagement')}
              </CardTitle>
              <CardDescription className="text-xs">
                {t('list.description', 'Click on a country to view its dossier')}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[200px]">{t('list.country', 'Country')}</TableHead>
                      <TableHead className="text-center">{t('list.region', 'Region')}</TableHead>
                      <TableHead className="text-center">
                        {t('list.engagements', 'Engagements')}
                      </TableHead>
                      <TableHead className="text-center">{t('list.recent', 'Recent')}</TableHead>
                      <TableHead className="text-center">
                        {t('list.upcoming', 'Upcoming')}
                      </TableHead>
                      <TableHead className="text-center">
                        {t('list.intensity', 'Intensity')}
                      </TableHead>
                      <TableHead className="w-[80px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedCountries.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                          {isLoading
                            ? t('list.loading', 'Loading countries...')
                            : t('list.noData', 'No countries found')}
                        </TableCell>
                      </TableRow>
                    ) : (
                      sortedCountries.map((country) => (
                        <TableRow
                          key={country.countryId}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => handleCountryClick(country)}
                        >
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className={`fi fi-${country.iso_code_2.toLowerCase()}`} />
                              <div>
                                <p className="font-medium text-sm">
                                  {isRTL ? country.name_ar : country.name_en}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {country.iso_code_2}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline" className="text-xs">
                              {/* Region would come from country data */}
                              {country.iso_code_2 in REGION_LABELS
                                ? isRTL
                                  ? 'آسيا'
                                  : 'Asia'
                                : '-'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <span className="font-semibold">{country.totalEngagements}</span>
                          </TableCell>
                          <TableCell className="text-center">
                            <span
                              className={
                                country.recentEngagements > 0
                                  ? 'text-green-600 font-medium'
                                  : 'text-muted-foreground'
                              }
                            >
                              {country.recentEngagements}
                            </span>
                          </TableCell>
                          <TableCell className="text-center">
                            <span
                              className={
                                country.upcomingEngagements > 0
                                  ? 'text-blue-600 font-medium'
                                  : 'text-muted-foreground'
                              }
                            >
                              {country.upcomingEngagements}
                            </span>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge
                              variant="outline"
                              className="text-[10px]"
                              style={{
                                backgroundColor: `${INTENSITY_COLORS[country.intensity]}20`,
                                borderColor: INTENSITY_COLORS[country.intensity],
                                color: INTENSITY_COLORS[country.intensity],
                              }}
                            >
                              {isRTL
                                ? INTENSITY_LABELS[country.intensity].ar
                                : INTENSITY_LABELS[country.intensity].en}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <ChevronRight className={`h-4 w-4 ${isRTL ? 'rotate-180' : ''}`} />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

export default GeographicVisualizationPage
