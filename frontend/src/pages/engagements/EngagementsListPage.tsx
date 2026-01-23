/**
 * Engagements List Page
 * Feature: engagements-entity-management
 *
 * Main page for viewing and managing engagement dossiers.
 * Mobile-first design with RTL support.
 */

import { useState, useMemo } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import {
  Plus,
  Search,
  Calendar,
  MapPin,
  Users,
  ChevronRight,
  Loader2,
  ShieldAlert,
  SlidersHorizontal,
  X,
  Video,
  Building2,
  Globe,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { ListEmptyState, SearchEmptyState } from '@/components/empty-states'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { useEngagements } from '@/hooks/useEngagements'
import type {
  EngagementSearchParams,
  EngagementType,
  EngagementCategory,
  EngagementStatus,
} from '@/types/engagement.types'
import {
  ENGAGEMENT_TYPE_LABELS,
  ENGAGEMENT_CATEGORY_LABELS,
  ENGAGEMENT_STATUS_LABELS,
} from '@/types/engagement.types'

export function EngagementsListPage() {
  const { t, i18n } = useTranslation('engagements')
  const isRTL = i18n.language === 'ar'
  const navigate = useNavigate()

  // Search & filter state
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<EngagementType | 'all'>('all')
  const [categoryFilter, setCategoryFilter] = useState<EngagementCategory | 'all'>('all')
  const [statusFilter, setStatusFilter] = useState<EngagementStatus | 'all'>('all')
  const [isFiltersOpen, setIsFiltersOpen] = useState(false)

  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = useState('')

  // Debounce search input
  useMemo(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearch(searchTerm)
    }, 300)
    return () => clearTimeout(timeout)
  }, [searchTerm])

  // Build search params
  const searchParams: EngagementSearchParams = useMemo(
    () => ({
      search: debouncedSearch || undefined,
      engagement_type: typeFilter !== 'all' ? typeFilter : undefined,
      engagement_category: categoryFilter !== 'all' ? categoryFilter : undefined,
      engagement_status: statusFilter !== 'all' ? statusFilter : undefined,
      limit: 50,
    }),
    [debouncedSearch, typeFilter, categoryFilter, statusFilter],
  )

  // Fetch engagements
  const { data, isLoading, isError, error } = useEngagements(searchParams)

  // Navigation handlers
  const handleCreateEngagement = () => {
    navigate({ to: '/engagements/create' })
  }

  const handleEngagementClick = (engagementId: string) => {
    navigate({ to: '/engagements/$engagementId', params: { engagementId } })
  }

  // Get status badge color
  const getStatusColor = (status: EngagementStatus) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500/10 text-green-600 border-green-200'
      case 'in_progress':
        return 'bg-blue-500/10 text-blue-600 border-blue-200'
      case 'confirmed':
        return 'bg-emerald-500/10 text-emerald-600 border-emerald-200'
      case 'planned':
        return 'bg-yellow-500/10 text-yellow-600 border-yellow-200'
      case 'postponed':
        return 'bg-orange-500/10 text-orange-600 border-orange-200'
      case 'cancelled':
        return 'bg-red-500/10 text-red-600 border-red-200'
      default:
        return 'bg-gray-500/10 text-gray-600 border-gray-200'
    }
  }

  // Get type icon
  const getTypeIcon = (type: EngagementType) => {
    switch (type) {
      case 'bilateral_meeting':
      case 'consultation':
        return <Users className="size-4" />
      case 'mission':
      case 'delegation':
      case 'official_visit':
        return <Globe className="size-4" />
      case 'summit':
        return <Building2 className="size-4" />
      default:
        return <Calendar className="size-4" />
    }
  }

  // Format date range
  const formatDateRange = (startDate: string, endDate: string) => {
    const start = new Date(startDate)
    const end = new Date(endDate)
    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' }
    const locale = isRTL ? 'ar-SA' : 'en-US'

    if (start.toDateString() === end.toDateString()) {
      return start.toLocaleDateString(locale, options)
    }
    return `${start.toLocaleDateString(locale, { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString(locale, options)}`
  }

  // Clear filters
  const clearFilters = () => {
    setSearchTerm('')
    setTypeFilter('all')
    setCategoryFilter('all')
    setStatusFilter('all')
    setIsFiltersOpen(false)
  }

  const hasActiveFilters =
    typeFilter !== 'all' || categoryFilter !== 'all' || statusFilter !== 'all'
  const activeFilterCount = [typeFilter, categoryFilter, statusFilter].filter(
    (f) => f !== 'all',
  ).length

  // Stats
  const totalEngagements = data?.pagination.total || 0

  // Engagement type options
  const engagementTypes: EngagementType[] = [
    'bilateral_meeting',
    'mission',
    'delegation',
    'summit',
    'working_group',
    'roundtable',
    'official_visit',
    'consultation',
    'other',
  ]

  // Engagement category options
  const engagementCategories: EngagementCategory[] = [
    'diplomatic',
    'statistical',
    'technical',
    'economic',
    'cultural',
    'educational',
    'research',
    'other',
  ]

  // Engagement status options
  const engagementStatuses: EngagementStatus[] = [
    'planned',
    'confirmed',
    'in_progress',
    'completed',
    'postponed',
    'cancelled',
  ]

  // Loading state
  if (isLoading && !data) {
    return (
      <div className="flex min-h-96 items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    )
  }

  // Error state
  if (isError) {
    return (
      <div className="flex min-h-96 flex-col items-center justify-center gap-4">
        <ShieldAlert className="size-12 text-destructive" />
        <div className="text-center">
          <h2 className="text-xl font-semibold text-foreground">
            {t('error.title', 'Failed to load engagements')}
          </h2>
          <p className="text-sm text-muted-foreground">
            {error?.message || t('error.message', 'An error occurred while fetching data')}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <header className="sticky top-0 z-10 border-b bg-background">
        <div className="container mx-auto p-4 sm:p-6 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-start text-2xl font-bold sm:text-3xl">
                {t('title', 'Engagements')}
              </h1>
              <p className="mt-1 text-start text-sm text-muted-foreground sm:text-base">
                {t('subtitle', 'Manage bilateral meetings, missions, and delegations')}
              </p>
            </div>

            <Button onClick={handleCreateEngagement} className="w-full sm:w-auto">
              <Plus className={`size-4 ${isRTL ? 'ms-2' : 'me-2'}`} />
              {t('actions.createEngagement', 'New Engagement')}
            </Button>
          </div>

          {/* Search and Filters */}
          <div className="mt-4 flex flex-col gap-3 sm:mt-6 sm:flex-row">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search
                className={`absolute top-1/2 size-4 -translate-y-1/2 text-muted-foreground ${isRTL ? 'end-3' : 'start-3'}`}
              />
              <Input
                placeholder={t('search.placeholder', 'Search engagements...')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`${isRTL ? 'pe-10' : 'ps-10'} h-11`}
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className={`absolute top-1/2 -translate-y-1/2 ${isRTL ? 'start-3' : 'end-3'}`}
                >
                  <X className="size-4 text-muted-foreground hover:text-foreground" />
                </button>
              )}
            </div>

            {/* Desktop Filters */}
            <div className="hidden gap-2 sm:flex">
              <Select
                value={typeFilter}
                onValueChange={(value) => setTypeFilter(value as EngagementType | 'all')}
              >
                <SelectTrigger className="h-11 w-[180px]">
                  <Calendar className="me-2 size-4 text-muted-foreground" />
                  <SelectValue placeholder={t('filters.type', 'Type')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('filters.allTypes', 'All types')}</SelectItem>
                  {engagementTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {isRTL ? ENGAGEMENT_TYPE_LABELS[type].ar : ENGAGEMENT_TYPE_LABELS[type].en}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={statusFilter}
                onValueChange={(value) => setStatusFilter(value as EngagementStatus | 'all')}
              >
                <SelectTrigger className="h-11 w-[160px]">
                  <SelectValue placeholder={t('filters.status', 'Status')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('filters.allStatuses', 'All statuses')}</SelectItem>
                  {engagementStatuses.map((status) => (
                    <SelectItem key={status} value={status}>
                      {isRTL
                        ? ENGAGEMENT_STATUS_LABELS[status].ar
                        : ENGAGEMENT_STATUS_LABELS[status].en}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <X className="me-1 size-4" />
                  {t('filters.clear', 'Clear')}
                </Button>
              )}
            </div>

            {/* Mobile Filters Sheet */}
            <Sheet open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
              <SheetTrigger asChild className="sm:hidden">
                <Button variant="outline" className="h-11">
                  <SlidersHorizontal className="me-2 size-4" />
                  {t('filters.title', 'Filters')}
                  {activeFilterCount > 0 && (
                    <Badge variant="secondary" className="ms-2">
                      {activeFilterCount}
                    </Badge>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent side={isRTL ? 'left' : 'right'}>
                <SheetHeader>
                  <SheetTitle>{t('filters.title', 'Filters')}</SheetTitle>
                </SheetHeader>
                <div className="mt-6 space-y-4">
                  {/* Type Filter */}
                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      {t('filters.type', 'Engagement Type')}
                    </label>
                    <Select
                      value={typeFilter}
                      onValueChange={(value) => setTypeFilter(value as EngagementType | 'all')}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{t('filters.allTypes', 'All types')}</SelectItem>
                        {engagementTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            {isRTL
                              ? ENGAGEMENT_TYPE_LABELS[type].ar
                              : ENGAGEMENT_TYPE_LABELS[type].en}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Category Filter */}
                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      {t('filters.category', 'Category')}
                    </label>
                    <Select
                      value={categoryFilter}
                      onValueChange={(value) =>
                        setCategoryFilter(value as EngagementCategory | 'all')
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">
                          {t('filters.allCategories', 'All categories')}
                        </SelectItem>
                        {engagementCategories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {isRTL
                              ? ENGAGEMENT_CATEGORY_LABELS[category].ar
                              : ENGAGEMENT_CATEGORY_LABELS[category].en}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Status Filter */}
                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      {t('filters.status', 'Status')}
                    </label>
                    <Select
                      value={statusFilter}
                      onValueChange={(value) => setStatusFilter(value as EngagementStatus | 'all')}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">
                          {t('filters.allStatuses', 'All statuses')}
                        </SelectItem>
                        {engagementStatuses.map((status) => (
                          <SelectItem key={status} value={status}>
                            {isRTL
                              ? ENGAGEMENT_STATUS_LABELS[status].ar
                              : ENGAGEMENT_STATUS_LABELS[status].en}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button variant="outline" className="flex-1" onClick={clearFilters}>
                      {t('filters.clear', 'Clear')}
                    </Button>
                    <Button className="flex-1" onClick={() => setIsFiltersOpen(false)}>
                      {t('filters.apply', 'Apply')}
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {/* Stats Summary */}
          <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="size-4" />
              {t('stats.total', '{{count}} engagements', { count: totalEngagements })}
            </span>
            {isLoading && <Loader2 className="size-4 animate-spin" />}
          </div>
        </div>
      </header>

      {/* Engagements List */}
      <main className="container mx-auto px-4 py-6 sm:px-6 lg:px-8">
        {data?.data.length === 0 ? (
          searchTerm || hasActiveFilters ? (
            <SearchEmptyState
              type="no-results"
              searchQuery={searchTerm}
              activeFilters={activeFilterCount}
              onClearFilters={clearFilters}
              size="lg"
            />
          ) : (
            <ListEmptyState
              entityType="engagement"
              isFirstItem={true}
              onCreate={handleCreateEngagement}
              size="lg"
            />
          )
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data?.data.map((engagement, index) => (
              <motion.div
                key={engagement.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card
                  className="h-full cursor-pointer transition-shadow hover:shadow-md"
                  onClick={() => handleEngagementClick(engagement.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      {/* Icon */}
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 sm:size-12">
                        {getTypeIcon(engagement.engagement_type)}
                      </div>

                      {/* Info */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <h3 className="truncate text-sm font-semibold sm:text-base">
                              {isRTL ? engagement.name_ar : engagement.name_en}
                            </h3>
                            <p className="truncate text-xs text-muted-foreground sm:text-sm">
                              {isRTL
                                ? ENGAGEMENT_TYPE_LABELS[engagement.engagement_type].ar
                                : ENGAGEMENT_TYPE_LABELS[engagement.engagement_type].en}
                            </p>
                          </div>
                          <Badge
                            variant="outline"
                            className={`shrink-0 text-xs ${getStatusColor(engagement.engagement_status)}`}
                          >
                            {isRTL
                              ? ENGAGEMENT_STATUS_LABELS[engagement.engagement_status].ar
                              : ENGAGEMENT_STATUS_LABELS[engagement.engagement_status].en}
                          </Badge>
                        </div>

                        {/* Date */}
                        <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground sm:text-sm">
                          <Calendar className="size-3 shrink-0" />
                          <span>{formatDateRange(engagement.start_date, engagement.end_date)}</span>
                        </div>

                        {/* Location */}
                        <div className="mt-2 flex flex-wrap items-center gap-3">
                          {engagement.is_virtual ? (
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Video className="size-3" />
                              {t('card.virtual', 'Virtual')}
                            </span>
                          ) : (
                            (engagement.location_en || engagement.location_ar) && (
                              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                <MapPin className="size-3" />
                                <span className="max-w-[120px] truncate">
                                  {isRTL ? engagement.location_ar : engagement.location_en}
                                </span>
                              </span>
                            )
                          )}
                          {engagement.participant_count > 0 && (
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Users className="size-3" />
                              {t('card.participants', '{{count}} participants', {
                                count: engagement.participant_count,
                              })}
                            </span>
                          )}
                        </div>

                        {/* Category Badge */}
                        <div className="mt-2">
                          <Badge variant="secondary" className="text-xs">
                            {isRTL
                              ? ENGAGEMENT_CATEGORY_LABELS[engagement.engagement_category].ar
                              : ENGAGEMENT_CATEGORY_LABELS[engagement.engagement_category].en}
                          </Badge>
                        </div>
                      </div>

                      {/* Arrow */}
                      <ChevronRight
                        className={`size-5 shrink-0 text-muted-foreground ${isRTL ? 'rotate-180' : ''}`}
                      />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {/* Load More */}
        {data?.pagination.has_more && (
          <div className="mt-8 flex justify-center">
            <Button variant="outline" disabled={isLoading}>
              {isLoading ? <Loader2 className="me-2 size-4 animate-spin" /> : null}
              {t('actions.loadMore', 'Load More')}
            </Button>
          </div>
        )}
      </main>
    </div>
  )
}

export default EngagementsListPage
