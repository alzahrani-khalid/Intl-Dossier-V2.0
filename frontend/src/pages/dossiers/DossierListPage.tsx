/**
 * DossierListPage Component (Enhanced)
 * Enhanced version with header stats cards and expandable dossier cards
 *
 * Features:
 * - Filterable header cards showing type statistics
 * - Expandable dossier cards with map/flag visualization
 * - Mobile-first responsive design
 * - RTL support with logical properties
 * - Smooth animations with Framer Motion
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, Link } from '@tanstack/react-router';
import { useDossiers, useDossierCounts } from '@/hooks/useDossier';
import { usePrefetchIntelligence } from '@/hooks/useIntelligence';
import { ExpandableDossierCard } from '@/components/Dossier/ExpandableDossierCard';
import { DossierTypeStatsCard, DossierTypeStatsCardSkeleton } from '@/components/Dossier/DossierTypeStatsCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  Check,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DossierType, DossierStatus, DossierFilters } from '@/services/dossier-api';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const DOSSIER_TYPES: DossierType[] = [
  'country',
  'organization',
  'forum',
  'engagement',
  'topic',
  'working_group',
  'person',
];

const DOSSIER_STATUSES: DossierStatus[] = ['active', 'inactive', 'archived'];

export function DossierListPage() {
  const { t, i18n } = useTranslation('dossier');
  const isRTL = i18n.language === 'ar';
  const navigate = useNavigate();

  // Filter state
  const [filters, setFilters] = useState<DossierFilters>({
    page: 1,
    page_size: 12,
    sort_by: 'updated_at',
    sort_order: 'desc',
    status: ['active'], // Default to showing only active dossiers
  });

  // Local state for search input (debounced)
  const [searchInput, setSearchInput] = useState('');

  // Track active expanded card
  const [activeCardId, setActiveCardId] = useState<string | null>(null);

  // Track status filter popover state
  const [statusFilterOpen, setStatusFilterOpen] = useState(false);

  // Fetch dossiers with filters
  const { data, isLoading, isError, error } = useDossiers(filters);

  // Fetch dossier counts for header cards
  const { data: counts, isLoading: countsLoading } = useDossierCounts();

  // Prefetch intelligence data on hover (T100 - Performance optimization)
  const prefetchIntelligence = usePrefetchIntelligence();

  const handleFilterChange = (key: keyof DossierFilters, value: unknown) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      page: 1, // Reset to first page when filters change
    }));
  };

  const handleSearch = () => {
    setFilters((prev) => ({
      ...prev,
      search: searchInput || undefined,
      page: 1,
    }));
  };

  const handleClearType = () => {
    setFilters((prev) => ({
      ...prev,
      type: undefined,
      page: 1,
    }));
  };

  const handleClearStatus = () => {
    setFilters((prev) => ({
      ...prev,
      status: undefined,
      page: 1,
    }));
  };

  const handleToggleStatus = (status: DossierStatus) => {
    setFilters((prev) => {
      const currentStatuses = Array.isArray(prev.status) ? prev.status : prev.status ? [prev.status] : [];
      
      if (currentStatuses.includes(status)) {
        // Remove status
        const newStatuses = currentStatuses.filter(s => s !== status);
        return {
          ...prev,
          status: newStatuses.length > 0 ? newStatuses : undefined,
          page: 1,
        };
      } else {
        // Add status
        return {
          ...prev,
          status: [...currentStatuses, status],
          page: 1,
        };
      }
    });
  };

  const handlePageChange = (newPage: number) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleViewDossier = (id: string, type?: DossierType) => {
    // Route to type-specific detail page based on dossier type
    switch (type) {
      case 'country':
        navigate({ to: '/dossiers/countries/$id', params: { id } });
        break;
      case 'organization':
        navigate({ to: '/dossiers/organizations/$id', params: { id } });
        break;
      case 'person':
        navigate({ to: '/dossiers/persons/$id', params: { id } });
        break;
      case 'engagement':
        navigate({ to: '/dossiers/engagements/$id', params: { id } });
        break;
      case 'forum':
        navigate({ to: '/dossiers/forums/$id', params: { id } });
        break;
      case 'working_group':
        navigate({ to: '/dossiers/working_groups/$id', params: { id } });
        break;
      case 'topic':
        navigate({ to: '/dossiers/topics/$id', params: { id } });
        break;
      default:
        // Fallback to countries route when type is unknown (should rarely happen)
        console.warn(`Unknown dossier type: ${type}, defaulting to countries route`);
        navigate({ to: '/dossiers/countries/$id', params: { id } });
    }
  };

  const handleEditDossier = (id: string) => {
    navigate({ to: '/dossiers/$id/edit', params: { id } });
  };

  const handleTypeCardClick = (type: DossierType) => {
    // Toggle filter: if already selected, clear it; otherwise set it
    if (filters.type === type) {
      handleFilterChange('type', undefined);
    } else {
      handleFilterChange('type', type);
    }
  };

  const totalPages = data ? Math.ceil(data.total / (filters.page_size || 12)) : 0;

  // Calculate stats for header cards
  const getTypeStats = (type: DossierType) => {
    const typeCount = counts?.[type];
    if (!typeCount) {
      return { count: 0, percentage: 0, activeCount: 0, inactiveCount: 0 };
    }

    // Calculate total active dossiers across all types for percentage
    const totalActive = counts
      ? Object.values(counts).reduce((sum, val) => sum + val.active, 0)
      : 0;
    const percentage = totalActive > 0 ? (typeCount.active / totalActive) * 100 : 0;

    return {
      count: typeCount.total,
      percentage,
      activeCount: typeCount.active,
      inactiveCount: typeCount.inactive,
    };
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8 sm:mb-10">
        <div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-start tracking-tight">
            {t('list.title')}
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground/80 text-start mt-2 sm:mt-3">
            {t('list.subtitle')}
          </p>
        </div>
        <Link to="/dossiers/create">
          <Button
            className={cn(
              "w-full sm:w-auto",
              "shadow-md hover:shadow-lg",
              "transition-all duration-200"
            )}
          >
            <Plus className={cn('h-5 w-5', isRTL ? 'ms-2' : 'me-2')} />
            {t('list.createNew')}
          </Button>
        </Link>
      </div>

      {/* Type Stats Header Cards */}
      <div className="mb-10">
        <h2 className="text-xl sm:text-2xl font-bold text-start mb-4 sm:mb-6">
          {t('list.typeOverview')}
        </h2>
        {countsLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-1.5 sm:gap-3 md:gap-4">
            {Array.from({ length: 7 }).map((_, i) => (
              <DossierTypeStatsCardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-1.5 sm:gap-3 md:gap-4">
            {DOSSIER_TYPES.map((type) => {
              const stats = getTypeStats(type);
              return (
                <DossierTypeStatsCard
                  key={type}
                  type={type}
                  totalCount={stats.count}
                  activeCount={stats.activeCount}
                  inactiveCount={stats.inactiveCount}
                  percentage={stats.percentage}
                  isSelected={filters.type === type}
                  onClick={() => handleTypeCardClick(type)}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Search and Filters Section */}
      <div className={cn(
        "rounded-3xl border border-black/5 p-5 sm:p-7 mb-8 space-y-6",
        "bg-white/60 backdrop-blur-xl",
        "shadow-[0_6px_20px_rgba(0,0,0,0.08),0_2px_6px_rgba(0,0,0,0.04)]"
      )}>
        {/* Search Bar */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className={cn(
                'absolute top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50',
                isRTL ? 'end-4' : 'start-4'
              )} />
              <Input
                placeholder={t('list.searchPlaceholder')}
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className={cn(
                  'h-12 w-full',
                  isRTL ? 'pe-11 ps-4' : 'ps-11 pe-4',
                  'bg-white/40 border border-black/5',
                  'rounded-2xl',
                  'text-sm placeholder:text-muted-foreground/40',
                  'shadow-[inset_0_2px_4px_rgba(0,0,0,0.06)]',
                  'focus-visible:bg-white/60 focus-visible:border-black/10',
                  'focus-visible:shadow-[inset_0_2px_6px_rgba(0,0,0,0.08)]',
                  'transition-all duration-150'
                )}
              />
            </div>
          </div>
          <Button
            onClick={handleSearch}
            className={cn(
              "w-full sm:w-auto px-6",
              "rounded-xl",
              "shadow-md hover:shadow-lg",
              "transition-all duration-200"
            )}
          >
            <Search className={cn('h-4 w-4', isRTL ? 'ms-2' : 'me-2')} />
            {t('list.search')}
          </Button>
        </div>

        {/* Filter Controls */}
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {/* Status Filter - Multiselect */}
            <div className="space-y-2">
              <Popover open={statusFilterOpen} onOpenChange={setStatusFilterOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={statusFilterOpen}
                    className={cn(
                      "h-12 justify-between w-full",
                      "bg-white/40 border border-black/5",
                      "rounded-xl",
                      "shadow-[inset_0_1px_3px_rgba(0,0,0,0.04)]",
                      "hover:bg-white/60 hover:border-black/10",
                      "transition-all duration-150"
                    )}
                  >
                    <span>
                      {filters.status && (Array.isArray(filters.status) ? filters.status : [filters.status]).length > 0
                        ? `${(Array.isArray(filters.status) ? filters.status : [filters.status]).length} status(es) selected`
                        : t('list.filterByStatus')}
                    </span>
                    <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[250px] p-0" align="start">
                  <Command>
                    <CommandInput placeholder={t('filter.search_status', 'Search statuses...')} />
                    <CommandList>
                      <CommandEmpty>{t('filter.no_status_found', 'No status found')}</CommandEmpty>
                      <CommandGroup>
                        {DOSSIER_STATUSES.map((status) => {
                          const currentStatuses = Array.isArray(filters.status) ? filters.status : filters.status ? [filters.status] : [];
                          const isSelected = currentStatuses.includes(status);
                          
                          return (
                            <CommandItem
                              key={status}
                              value={status}
                              onSelect={() => handleToggleStatus(status)}
                            >
                              <Check
                                className={cn(
                                  "me-2 h-4 w-4",
                                  isSelected ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {t(`status.${status}`)}
                            </CommandItem>
                          );
                        })}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              {/* Show selected statuses as badges */}
              {filters.status && (Array.isArray(filters.status) ? filters.status : [filters.status]).length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {(Array.isArray(filters.status) ? filters.status : [filters.status]).map((status) => (
                    <Badge key={status} variant="secondary" className="text-xs">
                      {t(`status.${status}`)}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Sort By */}
            <Select
              value={filters.sort_by}
              onValueChange={(value) => handleFilterChange('sort_by', value)}
            >
              <SelectTrigger className={cn(
                "h-12",
                "bg-white/40 border border-black/5",
                "rounded-xl",
                "shadow-[inset_0_1px_3px_rgba(0,0,0,0.04)]",
                "hover:bg-white/60 hover:border-black/10",
                "transition-all duration-150"
              )}>
                <SelectValue placeholder={t('list.sortBy')} />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="updated_at">{t('list.sortUpdated')}</SelectItem>
                <SelectItem value="created_at">{t('list.sortCreated')}</SelectItem>
                <SelectItem value="name_en">{t('list.sortNameEn')}</SelectItem>
                <SelectItem value="name_ar">{t('list.sortNameAr')}</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort Order */}
            <Select
              value={filters.sort_order}
              onValueChange={(value) => handleFilterChange('sort_order', value as 'asc' | 'desc')}
            >
              <SelectTrigger className={cn(
                "h-12",
                "bg-white/40 border border-black/5",
                "rounded-xl",
                "shadow-[inset_0_1px_3px_rgba(0,0,0,0.04)]",
                "hover:bg-white/60 hover:border-black/10",
                "transition-all duration-150"
              )}>
                <SelectValue placeholder={t('list.sortOrder')} />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="desc">{t('list.sortDesc')}</SelectItem>
                <SelectItem value="asc">{t('list.sortAsc')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

      </div>

      {/* Results Section */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 lg:gap-7">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-72 sm:h-80 rounded-2xl" />
          ))}
        </div>
      )}

      {isError && (
        <Alert
          variant="destructive"
          className={cn(
            "rounded-2xl border-destructive/20",
            "bg-destructive/5"
          )}
        >
          <AlertCircle className="h-5 w-5" />
          <AlertTitle className="text-base font-semibold">{t('list.errorTitle')}</AlertTitle>
          <AlertDescription className="text-sm">
            {error?.message || t('list.errorMessage')}
          </AlertDescription>
        </Alert>
      )}

      {!isLoading && !isError && data && (
        <>
          {/* Results Count */}
          {data.total > 0 && (
            <div className="flex items-center justify-between mb-6">
              <p className="text-sm font-medium text-muted-foreground/70 text-start">
                {t('list.showing', {
                  from: ((filters.page || 1) - 1) * (filters.page_size || 12) + 1,
                  to: Math.min((filters.page || 1) * (filters.page_size || 12), data.total),
                  total: data.total,
                })}
              </p>
            </div>
          )}

          {/* Expandable Dossiers Grid */}
          {data.data.length === 0 ? (
            <div className={cn(
              "text-center py-16 px-4",
              "rounded-2xl",
              "bg-white/40 border border-black/5"
            )}>
              <p className="text-muted-foreground text-base">{t('list.noDossiers')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 lg:gap-7 mb-10">
              {data.data.map((dossier) => (
                <ExpandableDossierCard
                  key={dossier.id}
                  dossier={dossier}
                  isActive={activeCardId === dossier.id}
                  onActivate={() => setActiveCardId(dossier.id)}
                  onDeactivate={() => setActiveCardId(null)}
                  onView={handleViewDossier}
                  onEdit={handleEditDossier}
                  onMouseEnter={() => prefetchIntelligence(dossier.id)}
                />
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className={cn(
              "flex flex-col sm:flex-row items-center justify-between gap-4",
              "pt-6 mt-2",
              "border-t border-black/5"
            )}>
              <p className="text-sm font-medium text-muted-foreground/70">
                {t('list.page', { current: filters.page || 1, total: totalPages })}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange((filters.page || 1) - 1)}
                  disabled={(filters.page || 1) === 1}
                  className={cn(
                    "px-4",
                    "rounded-xl",
                    "bg-white/40 border border-black/5",
                    "hover:bg-white/60 hover:border-black/10",
                    "disabled:opacity-40 disabled:cursor-not-allowed",
                    "shadow-sm hover:shadow-md",
                    "transition-all duration-150"
                  )}
                >
                  <ChevronLeft className={cn('h-4 w-4', isRTL && 'rotate-180')} />
                  <span className={cn('sm:inline hidden', isRTL ? 'me-2' : 'ms-2')}>
                    {t('list.previous')}
                  </span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange((filters.page || 1) + 1)}
                  disabled={(filters.page || 1) === totalPages}
                  className={cn(
                    "px-4",
                    "rounded-xl",
                    "bg-white/40 border border-black/5",
                    "hover:bg-white/60 hover:border-black/10",
                    "disabled:opacity-40 disabled:cursor-not-allowed",
                    "shadow-sm hover:shadow-md",
                    "transition-all duration-150"
                  )}
                >
                  <span className={cn('sm:inline hidden', isRTL ? 'ms-2' : 'me-2')}>
                    {t('list.next')}
                  </span>
                  <ChevronRight className={cn('h-4 w-4', isRTL && 'rotate-180')} />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
