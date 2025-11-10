/**
 * TimelineFilters Component
 *
 * Comprehensive filter controls for timeline:
 * - Event type multi-select checkboxes
 * - Date range picker (presets + custom)
 * - Priority filter
 * - Status filter
 * - Full-text search
 * - Mobile-first responsive design
 * - RTL support
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Filter,
  Search,
  X,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Calendar as CalendarIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import type {
  TimelineFilters as ITimelineFilters,
  TimelineEventType,
  TimelinePriority,
  TimelineEventStatus,
  DateRangePreset,
} from '@/types/timeline.types';

interface TimelineFiltersProps {
  filters: ITimelineFilters;
  onFiltersChange: (filters: ITimelineFilters) => void;
  availableEventTypes: TimelineEventType[];
  defaultEventTypes: TimelineEventType[];
  showFilters: boolean;
  onToggleFilters: () => void;
  onRefresh: () => void;
  className?: string;
}

export function TimelineFilters({
  filters,
  onFiltersChange,
  availableEventTypes,
  defaultEventTypes,
  showFilters,
  onToggleFilters,
  onRefresh,
  className,
}: TimelineFiltersProps) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  const [searchInput, setSearchInput] = useState(filters.search_query || '');
  const [dateRangePreset, setDateRangePreset] = useState<DateRangePreset>('all_time');
  const [customDateFrom, setCustomDateFrom] = useState<Date | undefined>();
  const [customDateTo, setCustomDateTo] = useState<Date | undefined>();

  // Event type labels
  const eventTypeLabels: Record<TimelineEventType, { en: string; ar: string }> = {
    calendar: { en: 'Calendar Events', ar: 'أحداث التقويم' },
    interaction: { en: 'Interactions', ar: 'التفاعلات' },
    intelligence: { en: 'Intelligence Reports', ar: 'تقارير استخبارية' },
    document: { en: 'Documents', ar: 'المستندات' },
    mou: { en: 'MoUs', ar: 'مذكرات التفاهم' },
    position: { en: 'Positions', ar: 'المناصب' },
    relationship: { en: 'Relationships', ar: 'العلاقات' },
    commitment: { en: 'Commitments', ar: 'الالتزامات' },
    decision: { en: 'Decisions', ar: 'القرارات' },
  };

  // Handle event type toggle
  const handleEventTypeToggle = (eventType: TimelineEventType) => {
    const currentTypes = filters.event_types || defaultEventTypes;
    const newTypes = currentTypes.includes(eventType)
      ? currentTypes.filter((t) => t !== eventType)
      : [...currentTypes, eventType];

    onFiltersChange({
      ...filters,
      event_types: newTypes.length > 0 ? newTypes : defaultEventTypes,
    });
  };

  // Handle priority filter
  const handlePriorityChange = (priority: TimelinePriority | 'all') => {
    onFiltersChange({
      ...filters,
      priority: priority === 'all' ? undefined : [priority],
    });
  };

  // Handle status filter
  const handleStatusChange = (status: TimelineEventStatus | 'all') => {
    onFiltersChange({
      ...filters,
      status: status === 'all' ? undefined : [status],
    });
  };

  // Handle date range preset
  const handleDateRangePreset = (preset: DateRangePreset) => {
    setDateRangePreset(preset);

    const now = new Date();
    let dateFrom: string | undefined;
    let dateTo: string | undefined;

    switch (preset) {
      case 'last_7_days':
        dateFrom = new Date(now.setDate(now.getDate() - 7)).toISOString();
        break;
      case 'last_30_days':
        dateFrom = new Date(now.setDate(now.getDate() - 30)).toISOString();
        break;
      case 'last_90_days':
        dateFrom = new Date(now.setDate(now.getDate() - 90)).toISOString();
        break;
      case 'last_year':
        dateFrom = new Date(now.setFullYear(now.getFullYear() - 1)).toISOString();
        break;
      case 'all_time':
        dateFrom = undefined;
        dateTo = undefined;
        break;
      case 'custom':
        // User will set custom dates
        break;
    }

    if (preset !== 'custom') {
      onFiltersChange({
        ...filters,
        date_from: dateFrom,
        date_to: dateTo,
      });
    }
  };

  // Handle custom date range
  const handleCustomDateRange = () => {
    onFiltersChange({
      ...filters,
      date_from: customDateFrom?.toISOString(),
      date_to: customDateTo?.toISOString(),
    });
  };

  // Handle search
  const handleSearch = (query: string) => {
    setSearchInput(query);
    onFiltersChange({
      ...filters,
      search_query: query || undefined,
    });
  };

  // Reset all filters
  const handleResetFilters = () => {
    setSearchInput('');
    setDateRangePreset('all_time');
    setCustomDateFrom(undefined);
    setCustomDateTo(undefined);
    onFiltersChange({
      event_types: defaultEventTypes,
    });
  };

  // Count active filters
  const activeFiltersCount =
    (filters.event_types && filters.event_types.length !== defaultEventTypes.length ? 1 : 0) +
    (filters.priority ? 1 : 0) +
    (filters.status ? 1 : 0) +
    (filters.date_from || filters.date_to ? 1 : 0) +
    (filters.search_query ? 1 : 0);

  return (
    <div className={cn('space-y-4 mb-6', className)} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Filter Toggle & Search Bar */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className={cn('absolute top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground', isRTL ? 'end-3' : 'start-3')} />
          <Input
            type="text"
            placeholder={t('timeline.search_placeholder')}
            value={searchInput}
            onChange={(e) => handleSearch(e.target.value)}
            className={cn('min-h-11 sm:min-h-10', isRTL ? 'pe-9' : 'ps-9')}
          />
          {searchInput && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleSearch('')}
              className={cn('absolute top-1/2 -translate-y-1/2 h-7 w-7 p-0', isRTL ? 'start-1' : 'end-1')}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Filter Toggle Button */}
        <Button
          variant="outline"
          onClick={onToggleFilters}
          className="min-h-11 sm:min-h-10 justify-between"
        >
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            <span>{t('timeline.filters')}</span>
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="h-5 min-w-5 rounded-full px-1.5">
                {activeFiltersCount}
              </Badge>
            )}
          </div>
          {showFilters ? (
            <ChevronUp className={cn('h-4 w-4', isRTL ? 'me-2' : 'ms-2')} />
          ) : (
            <ChevronDown className={cn('h-4 w-4', isRTL ? 'me-2' : 'ms-2')} />
          )}
        </Button>

        {/* Refresh Button */}
        <Button
          variant="outline"
          size="icon"
          onClick={onRefresh}
          className="min-h-11 min-w-11 sm:min-h-10 sm:min-w-10"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>

      {/* Expandable Filter Panel */}
      {showFilters && (
        <div className="rounded-lg border bg-card p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Event Types */}
          <div className="space-y-3">
            <Label className="text-start block">{t('timeline.event_types')}</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {availableEventTypes.map((eventType) => (
                <div key={eventType} className="flex items-center gap-2">
                  <Checkbox
                    id={`event-type-${eventType}`}
                    checked={(filters.event_types || defaultEventTypes).includes(eventType)}
                    onCheckedChange={() => handleEventTypeToggle(eventType)}
                  />
                  <Label
                    htmlFor={`event-type-${eventType}`}
                    className="text-sm font-normal cursor-pointer text-start"
                  >
                    {isRTL ? eventTypeLabels[eventType].ar : eventTypeLabels[eventType].en}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Priority & Status Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Priority Filter */}
            <div className="space-y-2">
              <Label className="text-start block">{t('timeline.priority_filter')}</Label>
              <Select
                value={filters.priority?.[0] || 'all'}
                onValueChange={(value) => handlePriorityChange(value as TimelinePriority | 'all')}
              >
                <SelectTrigger className="min-h-11 sm:min-h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('timeline.all_priorities')}</SelectItem>
                  <SelectItem value="high">{t('timeline.priority.high')}</SelectItem>
                  <SelectItem value="medium">{t('timeline.priority.medium')}</SelectItem>
                  <SelectItem value="low">{t('timeline.priority.low')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Status Filter */}
            <div className="space-y-2">
              <Label className="text-start block">{t('timeline.status_filter')}</Label>
              <Select
                value={filters.status?.[0] || 'all'}
                onValueChange={(value) => handleStatusChange(value as TimelineEventStatus | 'all')}
              >
                <SelectTrigger className="min-h-11 sm:min-h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('timeline.all_statuses')}</SelectItem>
                  <SelectItem value="planned">{t('timeline.status.planned')}</SelectItem>
                  <SelectItem value="ongoing">{t('timeline.status.ongoing')}</SelectItem>
                  <SelectItem value="completed">{t('timeline.status.completed')}</SelectItem>
                  <SelectItem value="cancelled">{t('timeline.status.cancelled')}</SelectItem>
                  <SelectItem value="postponed">{t('timeline.status.postponed')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          {/* Date Range Filter */}
          <div className="space-y-3">
            <Label className="text-start block">{t('timeline.date_range')}</Label>

            {/* Preset Options */}
            <div className="flex flex-wrap gap-2">
              {[
                { value: 'last_7_days', label: t('timeline.last_7_days') },
                { value: 'last_30_days', label: t('timeline.last_30_days') },
                { value: 'last_90_days', label: t('timeline.last_90_days') },
                { value: 'last_year', label: t('timeline.last_year') },
                { value: 'all_time', label: t('timeline.all_time') },
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
                    {t('timeline.custom_range')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <div className="p-4 space-y-4">
                    <div className="space-y-2">
                      <Label>{t('timeline.from_date')}</Label>
                      <Calendar
                        mode="single"
                        selected={customDateFrom}
                        onSelect={setCustomDateFrom}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{t('timeline.to_date')}</Label>
                      <Calendar
                        mode="single"
                        selected={customDateTo}
                        onSelect={setCustomDateTo}
                      />
                    </div>
                    <Button
                      onClick={() => {
                        setDateRangePreset('custom');
                        handleCustomDateRange();
                      }}
                      className="w-full"
                    >
                      {t('timeline.apply_custom_range')}
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Reset Button */}
          {activeFiltersCount > 0 && (
            <>
              <Separator />
              <Button
                variant="outline"
                onClick={handleResetFilters}
                className="w-full min-h-11 sm:min-h-10"
              >
                <X className={cn('h-4 w-4', isRTL ? 'ms-2' : 'me-2')} />
                {t('timeline.reset_filters')}
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
