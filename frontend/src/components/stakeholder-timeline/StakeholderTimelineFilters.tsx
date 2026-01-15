/**
 * StakeholderTimelineFilters Component
 *
 * Filter controls for the stakeholder interaction timeline:
 * - Event type multi-select
 * - Date range picker
 * - Sentiment filter
 * - Direction filter
 * - Mobile-first responsive design
 * - RTL support
 */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Calendar as CalendarIcon, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import type {
  StakeholderTimelineFilters as IFilters,
  StakeholderInteractionType,
  InteractionSentiment,
  InteractionDirection,
  DateRangePreset,
} from '@/types/stakeholder-interaction.types'

interface StakeholderTimelineFiltersProps {
  filters: IFilters
  onFiltersChange: (filters: IFilters) => void
  availableEventTypes: string[]
  className?: string
}

export function StakeholderTimelineFilters({
  filters,
  onFiltersChange,
  availableEventTypes,
  className,
}: StakeholderTimelineFiltersProps) {
  const { t, i18n } = useTranslation('stakeholder-interactions')
  const isRTL = i18n.language === 'ar'

  const [dateRangePreset, setDateRangePreset] = useState<DateRangePreset>('all_time')
  const [customDateFrom, setCustomDateFrom] = useState<Date | undefined>()
  const [customDateTo, setCustomDateTo] = useState<Date | undefined>()

  // Handle event type toggle
  const handleEventTypeToggle = (eventType: string) => {
    const currentTypes = filters.event_types || []
    const newTypes = currentTypes.includes(eventType as StakeholderInteractionType)
      ? currentTypes.filter((t) => t !== eventType)
      : [...currentTypes, eventType as StakeholderInteractionType]

    onFiltersChange({
      ...filters,
      event_types: newTypes.length > 0 ? newTypes : undefined,
    })
  }

  // Handle sentiment change
  const handleSentimentChange = (sentiment: string) => {
    onFiltersChange({
      ...filters,
      sentiment: sentiment === 'all' ? undefined : (sentiment as InteractionSentiment),
    })
  }

  // Handle direction change
  const handleDirectionChange = (direction: string) => {
    onFiltersChange({
      ...filters,
      direction: direction === 'all' ? undefined : (direction as InteractionDirection),
    })
  }

  // Handle date range preset
  const handleDateRangePreset = (preset: DateRangePreset) => {
    setDateRangePreset(preset)

    const now = new Date()
    let dateFrom: string | undefined
    let dateTo: string | undefined

    switch (preset) {
      case 'last_7_days':
        dateFrom = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
        break
      case 'last_30_days':
        dateFrom = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()
        break
      case 'last_90_days':
        dateFrom = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString()
        break
      case 'last_year':
        dateFrom = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000).toISOString()
        break
      case 'all_time':
        dateFrom = undefined
        dateTo = undefined
        break
      case 'custom':
        // User will set custom dates
        break
    }

    if (preset !== 'custom') {
      onFiltersChange({
        ...filters,
        date_from: dateFrom,
        date_to: dateTo,
      })
    }
  }

  // Handle custom date range
  const handleCustomDateRange = () => {
    onFiltersChange({
      ...filters,
      date_from: customDateFrom?.toISOString(),
      date_to: customDateTo?.toISOString(),
    })
  }

  // Reset all filters
  const handleResetFilters = () => {
    setDateRangePreset('all_time')
    setCustomDateFrom(undefined)
    setCustomDateTo(undefined)
    onFiltersChange({})
  }

  // Check if any filters are active
  const hasActiveFilters =
    (filters.event_types && filters.event_types.length > 0) ||
    filters.sentiment ||
    filters.direction ||
    filters.date_from ||
    filters.date_to

  return (
    <div
      className={cn('rounded-lg border bg-card p-4 sm:p-6 space-y-4 sm:space-y-6', className)}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Event Types */}
      <div className="space-y-3">
        <Label className="text-start block font-medium">{t('filters.event_types')}</Label>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {availableEventTypes.map((eventType) => (
            <div key={eventType} className="flex items-center gap-2">
              <Checkbox
                id={`event-type-${eventType}`}
                checked={(filters.event_types || []).includes(
                  eventType as StakeholderInteractionType,
                )}
                onCheckedChange={() => handleEventTypeToggle(eventType)}
              />
              <Label
                htmlFor={`event-type-${eventType}`}
                className="text-sm font-normal cursor-pointer text-start"
              >
                {t(`types.${eventType}`)}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <Separator />

      {/* Sentiment & Direction Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Sentiment Filter */}
        <div className="space-y-2">
          <Label className="text-start block">{t('filters.sentiment')}</Label>
          <Select value={filters.sentiment || 'all'} onValueChange={handleSentimentChange}>
            <SelectTrigger className="min-h-11 sm:min-h-10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('filters.all_sentiments')}</SelectItem>
              <SelectItem value="positive">{t('sentiment.positive')}</SelectItem>
              <SelectItem value="neutral">{t('sentiment.neutral')}</SelectItem>
              <SelectItem value="negative">{t('sentiment.negative')}</SelectItem>
              <SelectItem value="mixed">{t('sentiment.mixed')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Direction Filter */}
        <div className="space-y-2">
          <Label className="text-start block">{t('filters.direction')}</Label>
          <Select value={filters.direction || 'all'} onValueChange={handleDirectionChange}>
            <SelectTrigger className="min-h-11 sm:min-h-10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('filters.all_directions')}</SelectItem>
              <SelectItem value="inbound">{t('direction.inbound')}</SelectItem>
              <SelectItem value="outbound">{t('direction.outbound')}</SelectItem>
              <SelectItem value="bidirectional">{t('direction.bidirectional')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Separator />

      {/* Date Range Filter */}
      <div className="space-y-3">
        <Label className="text-start block font-medium">{t('filters.date_range')}</Label>

        {/* Preset Options */}
        <div className="flex flex-wrap gap-2">
          {[
            { value: 'last_7_days', label: t('filters.last_7_days') },
            { value: 'last_30_days', label: t('filters.last_30_days') },
            { value: 'last_90_days', label: t('filters.last_90_days') },
            { value: 'last_year', label: t('filters.last_year') },
            { value: 'all_time', label: t('filters.all_time') },
          ].map((preset) => (
            <Button
              key={preset.value}
              variant={dateRangePreset === preset.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleDateRangePreset(preset.value as DateRangePreset)}
              className="min-h-9 sm:min-h-8"
            >
              {preset.label}
            </Button>
          ))}

          {/* Custom Date Range */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={dateRangePreset === 'custom' ? 'default' : 'outline'}
                size="sm"
                className="min-h-9 sm:min-h-8"
              >
                <CalendarIcon className={cn('h-4 w-4', isRTL ? 'ms-2' : 'me-2')} />
                {t('filters.custom_range')}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <div className="p-4 space-y-4">
                <div className="space-y-2">
                  <Label>{t('filters.from_date')}</Label>
                  <Calendar mode="single" selected={customDateFrom} onSelect={setCustomDateFrom} />
                </div>
                <div className="space-y-2">
                  <Label>{t('filters.to_date')}</Label>
                  <Calendar mode="single" selected={customDateTo} onSelect={setCustomDateTo} />
                </div>
                <Button
                  onClick={() => {
                    setDateRangePreset('custom')
                    handleCustomDateRange()
                  }}
                  className="w-full"
                >
                  {t('filters.apply_custom_range')}
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Reset Button */}
      {hasActiveFilters && (
        <>
          <Separator />
          <Button
            variant="outline"
            onClick={handleResetFilters}
            className="w-full min-h-11 sm:min-h-10"
          >
            <X className={cn('h-4 w-4', isRTL ? 'ms-2' : 'me-2')} />
            {t('filters.reset_filters')}
          </Button>
        </>
      )}
    </div>
  )
}
