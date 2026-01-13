/**
 * Map Filter Controls Component
 * Feature: geographic-visualization
 *
 * Filter controls for the world map visualization:
 * - Time period selection
 * - Relationship type filtering
 * - Regional grouping
 * - Intensity threshold
 * - View mode toggles
 */

import { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { Checkbox } from '@/components/ui/checkbox'
import {
  CalendarDays,
  Filter,
  Globe,
  Network,
  Thermometer,
  RotateCcw,
  ChevronDown,
  Map,
} from 'lucide-react'
import type {
  GeoVisualizationFilters,
  CountryRegion,
  EngagementIntensity,
  MapViewMode,
} from '@/types/geographic-visualization.types'
import {
  REGION_LABELS,
  INTENSITY_LABELS,
  VIEW_MODE_LABELS,
} from '@/types/geographic-visualization.types'
import { RELATIONSHIP_TYPE_LABELS, type DossierRelationshipType } from '@/types/relationship.types'
import { TIME_RANGE_OPTIONS, type TimeRange } from '@/types/analytics.types'
import { format } from 'date-fns'
import { ar, enUS } from 'date-fns/locale'

interface MapFilterControlsProps {
  filters: GeoVisualizationFilters
  onFiltersChange: (filters: Partial<GeoVisualizationFilters>) => void
  onReset: () => void
  isLoading?: boolean
  compact?: boolean
  className?: string
}

export function MapFilterControls({
  filters,
  onFiltersChange,
  onReset,
  isLoading = false,
  compact = false,
  className = '',
}: MapFilterControlsProps) {
  const { t, i18n } = useTranslation('geographic-visualization')
  const isRTL = i18n.language === 'ar'

  // Time range options
  const timeRangeOptions = useMemo(
    () => [
      { value: '7d', label: t('filters.timeRange.7d', '7 Days') },
      { value: '30d', label: t('filters.timeRange.30d', '30 Days') },
      { value: '90d', label: t('filters.timeRange.90d', '90 Days') },
      { value: '365d', label: t('filters.timeRange.365d', '1 Year') },
      { value: 'custom', label: t('filters.timeRange.custom', 'Custom') },
    ],
    [t],
  )

  // Region options
  const regionOptions: { value: CountryRegion; label: string }[] = useMemo(
    () => [
      { value: 'africa', label: isRTL ? REGION_LABELS.africa.ar : REGION_LABELS.africa.en },
      { value: 'americas', label: isRTL ? REGION_LABELS.americas.ar : REGION_LABELS.americas.en },
      { value: 'asia', label: isRTL ? REGION_LABELS.asia.ar : REGION_LABELS.asia.en },
      { value: 'europe', label: isRTL ? REGION_LABELS.europe.ar : REGION_LABELS.europe.en },
      { value: 'oceania', label: isRTL ? REGION_LABELS.oceania.ar : REGION_LABELS.oceania.en },
    ],
    [isRTL],
  )

  // Intensity threshold options
  const intensityOptions: { value: EngagementIntensity; label: string }[] = useMemo(
    () => [
      { value: 'none', label: isRTL ? INTENSITY_LABELS.none.ar : INTENSITY_LABELS.none.en },
      { value: 'low', label: isRTL ? INTENSITY_LABELS.low.ar : INTENSITY_LABELS.low.en },
      { value: 'medium', label: isRTL ? INTENSITY_LABELS.medium.ar : INTENSITY_LABELS.medium.en },
      { value: 'high', label: isRTL ? INTENSITY_LABELS.high.ar : INTENSITY_LABELS.high.en },
      {
        value: 'very_high',
        label: isRTL ? INTENSITY_LABELS.very_high.ar : INTENSITY_LABELS.very_high.en,
      },
    ],
    [isRTL],
  )

  // Relationship type options
  const relationshipTypeOptions = useMemo(() => {
    return Object.entries(RELATIONSHIP_TYPE_LABELS).map(([value, labels]) => ({
      value: value as DossierRelationshipType,
      label: isRTL ? labels.ar : labels.en,
    }))
  }, [isRTL])

  // Handle time range change
  const handleTimeRangeChange = useCallback(
    (value: string) => {
      onFiltersChange({ timeRange: value as TimeRange })
    },
    [onFiltersChange],
  )

  // Handle region toggle
  const handleRegionToggle = useCallback(
    (region: CountryRegion, checked: boolean) => {
      const newRegions = checked
        ? [...filters.regions, region]
        : filters.regions.filter((r) => r !== region)
      onFiltersChange({ regions: newRegions })
    },
    [filters.regions, onFiltersChange],
  )

  // Handle relationship type toggle
  const handleRelationshipTypeToggle = useCallback(
    (type: DossierRelationshipType, checked: boolean) => {
      const newTypes = checked
        ? [...filters.relationshipTypes, type]
        : filters.relationshipTypes.filter((t) => t !== type)
      onFiltersChange({ relationshipTypes: newTypes })
    },
    [filters.relationshipTypes, onFiltersChange],
  )

  // Count active filters
  const activeFilterCount = useMemo(() => {
    let count = 0
    if (filters.timeRange !== '90d') count++
    if (filters.regions.length > 0) count++
    if (filters.relationshipTypes.length > 0) count++
    if (filters.intensityThreshold !== 'none') count++
    if (!filters.showRelationshipFlows) count++
    if (!filters.showEngagementHeatmap) count++
    return count
  }, [filters])

  if (compact) {
    return (
      <div className={`flex flex-wrap items-center gap-2 ${className}`} dir={isRTL ? 'rtl' : 'ltr'}>
        {/* Time Range */}
        <Select
          value={filters.timeRange}
          onValueChange={handleTimeRangeChange}
          disabled={isLoading}
        >
          <SelectTrigger className="w-[120px] h-9 text-xs">
            <CalendarDays className="h-3 w-3 me-1" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {timeRangeOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Filter Popover */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-9 text-xs gap-1">
              <Filter className="h-3 w-3" />
              {t('filters.filters', 'Filters')}
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="ms-1 h-4 px-1 text-[10px]">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align={isRTL ? 'end' : 'start'}>
            <div className="space-y-4">
              {/* Regions */}
              <div>
                <Label className="text-xs font-medium">{t('filters.regions', 'Regions')}</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {regionOptions.map((opt) => (
                    <label
                      key={opt.value}
                      className="flex items-center gap-1.5 text-xs cursor-pointer"
                    >
                      <Checkbox
                        checked={filters.regions.includes(opt.value)}
                        onCheckedChange={(checked) => handleRegionToggle(opt.value, !!checked)}
                      />
                      {opt.label}
                    </label>
                  ))}
                </div>
              </div>

              {/* Intensity Threshold */}
              <div>
                <Label className="text-xs font-medium">
                  {t('filters.minIntensity', 'Minimum Intensity')}
                </Label>
                <Select
                  value={filters.intensityThreshold}
                  onValueChange={(v) =>
                    onFiltersChange({ intensityThreshold: v as EngagementIntensity })
                  }
                >
                  <SelectTrigger className="mt-2 h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {intensityOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* View Toggles */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">
                    {t('filters.showFlows', 'Show Relationship Flows')}
                  </Label>
                  <Switch
                    checked={filters.showRelationshipFlows}
                    onCheckedChange={(checked) =>
                      onFiltersChange({ showRelationshipFlows: checked })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-xs">{t('filters.showHeatmap', 'Show Heatmap')}</Label>
                  <Switch
                    checked={filters.showEngagementHeatmap}
                    onCheckedChange={(checked) =>
                      onFiltersChange({ showEngagementHeatmap: checked })
                    }
                  />
                </div>
              </div>

              {/* Reset */}
              <Button variant="ghost" size="sm" className="w-full h-8 text-xs" onClick={onReset}>
                <RotateCcw className="h-3 w-3 me-1" />
                {t('filters.reset', 'Reset Filters')}
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    )
  }

  // Full filter layout
  return (
    <div className={`space-y-4 ${className}`} dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="flex flex-col sm:flex-row flex-wrap gap-3">
        {/* Time Range */}
        <div className="flex-1 min-w-[150px]">
          <Label className="text-xs font-medium mb-1.5 block">
            {t('filters.timeRange.label', 'Time Period')}
          </Label>
          <Select
            value={filters.timeRange}
            onValueChange={handleTimeRangeChange}
            disabled={isLoading}
          >
            <SelectTrigger className="h-9">
              <CalendarDays className="h-4 w-4 me-2 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {timeRangeOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Regions */}
        <div className="flex-1 min-w-[150px]">
          <Label className="text-xs font-medium mb-1.5 block">
            {t('filters.regions', 'Regions')}
          </Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full h-9 justify-between font-normal">
                <div className="flex items-center gap-2 truncate">
                  <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
                  {filters.regions.length === 0
                    ? t('filters.allRegions', 'All Regions')
                    : `${filters.regions.length} ${t('filters.selected', 'selected')}`}
                </div>
                <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56" align={isRTL ? 'end' : 'start'}>
              <div className="space-y-2">
                {regionOptions.map((opt) => (
                  <label key={opt.value} className="flex items-center gap-2 text-sm cursor-pointer">
                    <Checkbox
                      checked={filters.regions.includes(opt.value)}
                      onCheckedChange={(checked) => handleRegionToggle(opt.value, !!checked)}
                    />
                    {opt.label}
                  </label>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Relationship Types */}
        <div className="flex-1 min-w-[150px]">
          <Label className="text-xs font-medium mb-1.5 block">
            {t('filters.relationshipTypes', 'Relationship Types')}
          </Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full h-9 justify-between font-normal">
                <div className="flex items-center gap-2 truncate">
                  <Network className="h-4 w-4 text-muted-foreground shrink-0" />
                  {filters.relationshipTypes.length === 0
                    ? t('filters.allTypes', 'All Types')
                    : `${filters.relationshipTypes.length} ${t('filters.selected', 'selected')}`}
                </div>
                <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-64 max-h-64 overflow-y-auto"
              align={isRTL ? 'end' : 'start'}
            >
              <div className="space-y-2">
                {relationshipTypeOptions.map((opt) => (
                  <label key={opt.value} className="flex items-center gap-2 text-sm cursor-pointer">
                    <Checkbox
                      checked={filters.relationshipTypes.includes(opt.value)}
                      onCheckedChange={(checked) =>
                        handleRelationshipTypeToggle(opt.value, !!checked)
                      }
                    />
                    {opt.label}
                  </label>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Intensity Threshold */}
        <div className="flex-1 min-w-[150px]">
          <Label className="text-xs font-medium mb-1.5 block">
            {t('filters.minIntensity', 'Min. Intensity')}
          </Label>
          <Select
            value={filters.intensityThreshold}
            onValueChange={(v) => onFiltersChange({ intensityThreshold: v as EngagementIntensity })}
            disabled={isLoading}
          >
            <SelectTrigger className="h-9">
              <Thermometer className="h-4 w-4 me-2 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {intensityOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* View Toggles & Reset */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t">
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <Switch
              id="show-flows"
              checked={filters.showRelationshipFlows}
              onCheckedChange={(checked) => onFiltersChange({ showRelationshipFlows: checked })}
            />
            <Label htmlFor="show-flows" className="text-xs cursor-pointer">
              {t('filters.showFlows', 'Relationship Flows')}
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              id="show-heatmap"
              checked={filters.showEngagementHeatmap}
              onCheckedChange={(checked) => onFiltersChange({ showEngagementHeatmap: checked })}
            />
            <Label htmlFor="show-heatmap" className="text-xs cursor-pointer">
              {t('filters.showHeatmap', 'Engagement Heatmap')}
            </Label>
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          className="h-8 text-xs"
          onClick={onReset}
          disabled={activeFilterCount === 0}
        >
          <RotateCcw className="h-3 w-3 me-1" />
          {t('filters.reset', 'Reset')}
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="ms-1 h-4 px-1 text-[10px]">
              {activeFilterCount}
            </Badge>
          )}
        </Button>
      </div>
    </div>
  )
}

export default MapFilterControls
