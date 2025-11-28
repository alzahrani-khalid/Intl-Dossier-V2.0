/**
 * Work Item Filters Bar Component
 * Search, Tracking Type filter, Sort options
 * Mobile-first, RTL-compatible
 */
import { useTranslation } from 'react-i18next';
import { Search, SlidersHorizontal, ArrowUpDown, ChevronDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import type { TrackingType, WorkItemSortBy, SortOrder } from '@/types/unified-work.types';
import { cn } from '@/lib/utils';
import { useState, useCallback } from 'react';
import { useDebouncedCallback } from 'use-debounce';

interface WorkItemFiltersBarProps {
  trackingType?: TrackingType;
  onTrackingTypeChange: (type: TrackingType | undefined) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  sortBy: WorkItemSortBy;
  sortOrder: SortOrder;
  onSortChange: (sortBy: WorkItemSortBy, sortOrder: SortOrder) => void;
}

export function WorkItemFiltersBar({
  trackingType,
  onTrackingTypeChange,
  searchQuery,
  onSearchChange,
  sortBy,
  sortOrder,
  onSortChange,
}: WorkItemFiltersBarProps) {
  const { t, i18n } = useTranslation('my-work');
  const isRTL = i18n.language === 'ar';
  const [localSearch, setLocalSearch] = useState(searchQuery);

  // Debounce search to avoid excessive API calls
  const debouncedSearch = useDebouncedCallback((value: string) => {
    onSearchChange(value);
  }, 300);

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setLocalSearch(value);
      debouncedSearch(value);
    },
    [debouncedSearch]
  );

  const trackingTypes: { id: TrackingType; label: string; color: string }[] = [
    {
      id: 'delivery',
      label: t('trackingType.delivery', 'Delivery'),
      color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    },
    {
      id: 'follow_up',
      label: t('trackingType.followUp', 'Follow-up'),
      color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
    },
    {
      id: 'sla',
      label: t('trackingType.sla', 'SLA'),
      color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
    },
  ];

  const sortOptions: { sortBy: WorkItemSortBy; sortOrder: SortOrder; label: string }[] = [
    { sortBy: 'deadline', sortOrder: 'asc', label: t('sort.deadlineAsc', 'Deadline (Earliest)') },
    { sortBy: 'deadline', sortOrder: 'desc', label: t('sort.deadlineDesc', 'Deadline (Latest)') },
    { sortBy: 'priority', sortOrder: 'desc', label: t('sort.priorityDesc', 'Priority (High to Low)') },
    { sortBy: 'priority', sortOrder: 'asc', label: t('sort.priorityAsc', 'Priority (Low to High)') },
    { sortBy: 'created_at', sortOrder: 'desc', label: t('sort.createdDesc', 'Newest First') },
    { sortBy: 'created_at', sortOrder: 'asc', label: t('sort.createdAsc', 'Oldest First') },
  ];

  const currentSort = sortOptions.find(
    (opt) => opt.sortBy === sortBy && opt.sortOrder === sortOrder
  );

  return (
    <div
      className="flex flex-col sm:flex-row gap-3 mb-4"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Search Input */}
      <div className="relative flex-1">
        <Search className={cn(
          'absolute top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground',
          isRTL ? 'end-3' : 'start-3'
        )} />
        <Input
          placeholder={t('search.placeholder', 'Search work items...')}
          value={localSearch}
          onChange={handleSearchChange}
          className={cn('h-10', isRTL ? 'pe-10 ps-3' : 'ps-10 pe-3')}
        />
      </div>

      {/* Tracking Type Filter */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="h-10 gap-2 whitespace-nowrap">
            <SlidersHorizontal className="h-4 w-4" />
            <span className="hidden sm:inline">{t('filters.trackingType', 'Type')}</span>
            {trackingType && (
              <Badge variant="secondary" className="ms-1">
                {trackingTypes.find((tt) => tt.id === trackingType)?.label}
              </Badge>
            )}
            <ChevronDown className="h-4 w-4 ms-1" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align={isRTL ? 'start' : 'end'} className="w-48">
          <DropdownMenuLabel>{t('filters.trackingType', 'Tracking Type')}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => onTrackingTypeChange(undefined)}>
            {t('filters.all', 'All Types')}
          </DropdownMenuItem>
          {trackingTypes.map((tt) => (
            <DropdownMenuItem
              key={tt.id}
              onClick={() => onTrackingTypeChange(tt.id)}
              className={cn(trackingType === tt.id && 'bg-accent')}
            >
              <Badge className={cn('me-2', tt.color)} variant="secondary">
                {tt.label}
              </Badge>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Sort Options */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="h-10 gap-2 whitespace-nowrap">
            <ArrowUpDown className="h-4 w-4" />
            <span className="hidden sm:inline">{t('sort.label', 'Sort')}</span>
            <ChevronDown className="h-4 w-4 ms-1" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align={isRTL ? 'start' : 'end'} className="w-56">
          <DropdownMenuLabel>{t('sort.label', 'Sort By')}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {sortOptions.map((opt, idx) => (
            <DropdownMenuItem
              key={idx}
              onClick={() => onSortChange(opt.sortBy, opt.sortOrder)}
              className={cn(
                currentSort?.sortBy === opt.sortBy &&
                  currentSort?.sortOrder === opt.sortOrder &&
                  'bg-accent'
              )}
            >
              {opt.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
