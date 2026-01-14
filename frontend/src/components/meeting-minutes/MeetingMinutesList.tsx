/**
 * Meeting Minutes List
 * Feature: meeting-minutes-capture
 *
 * Displays a list of meeting minutes with filters.
 * Mobile-first with RTL support.
 */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, Search, Filter, X, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { useMeetingMinutesList } from '@/hooks/useMeetingMinutes'
import { MeetingMinutesCard } from './MeetingMinutesCard'
import type {
  MeetingMinutesFilters,
  MeetingMinutesListItem,
  MeetingMinutesStatus,
} from '@/types/meeting-minutes.types'
import { MEETING_MINUTES_STATUSES } from '@/types/meeting-minutes.types'

interface MeetingMinutesListProps {
  dossierId?: string
  engagementId?: string
  onCreateNew?: () => void
  onSelectMinutes?: (minutes: MeetingMinutesListItem) => void
  className?: string
}

export function MeetingMinutesList({
  dossierId,
  engagementId,
  onCreateNew,
  onSelectMinutes,
  className,
}: MeetingMinutesListProps) {
  const { t, i18n } = useTranslation('meeting-minutes')
  const isRTL = i18n.language === 'ar'

  const [filters, setFilters] = useState<MeetingMinutesFilters>({
    dossier_id: dossierId,
    engagement_id: engagementId,
  })
  const [showFilters, setShowFilters] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const { data, isLoading, error } = useMeetingMinutesList(filters)

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchQuery(value)
    // Debounce search
    const timeoutId = setTimeout(() => {
      setFilters((prev) => ({ ...prev, search: value || undefined }))
    }, 300)
    return () => clearTimeout(timeoutId)
  }

  const handleStatusChange = (status: string) => {
    setFilters((prev) => ({
      ...prev,
      status: status === 'all' ? undefined : (status as MeetingMinutesStatus),
    }))
  }

  const clearFilters = () => {
    setFilters({
      dossier_id: dossierId,
      engagement_id: engagementId,
    })
    setSearchQuery('')
  }

  const hasActiveFilters = filters.search || filters.status || filters.from_date || filters.to_date

  return (
    <div className={cn('space-y-4', className)} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-foreground">{t('title')}</h2>
          <p className="text-sm text-muted-foreground mt-0.5">{t('subtitle')}</p>
        </div>
        {onCreateNew && (
          <Button onClick={onCreateNew} className="w-full sm:w-auto min-h-11">
            <Plus className={cn('h-4 w-4', isRTL ? 'ms-2' : 'me-2')} />
            {t('createNew')}
          </Button>
        )}
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search
            className={cn(
              'absolute top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground',
              isRTL ? 'end-3' : 'start-3',
            )}
          />
          <Input
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder={t('filters.search')}
            className={cn('min-h-11', isRTL ? 'pe-10' : 'ps-10')}
          />
        </div>

        {/* Filter Toggle */}
        <Button
          variant={showFilters ? 'secondary' : 'outline'}
          onClick={() => setShowFilters(!showFilters)}
          className="min-h-11"
        >
          <Filter className={cn('h-4 w-4', isRTL ? 'ms-2' : 'me-2')} />
          {t('filters.title')}
          {hasActiveFilters && (
            <span className="ms-2 px-1.5 py-0.5 text-xs bg-primary text-primary-foreground rounded-full">
              !
            </span>
          )}
        </Button>
      </div>

      {/* Expanded Filters */}
      {showFilters && (
        <div className="p-4 bg-muted/50 rounded-lg space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Status Filter */}
            <div className="flex-1">
              <label className="text-sm font-medium text-foreground mb-1.5 block">
                {t('filters.status')}
              </label>
              <Select value={filters.status || 'all'} onValueChange={handleStatusChange}>
                <SelectTrigger className="min-h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('filters.title')}</SelectItem>
                  {MEETING_MINUTES_STATUSES.map((status) => (
                    <SelectItem key={status} value={status}>
                      {t(`status.${status}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date Range */}
            <div className="flex-1">
              <label className="text-sm font-medium text-foreground mb-1.5 block">
                {t('filters.fromDate')}
              </label>
              <Input
                type="date"
                value={filters.from_date || ''}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, from_date: e.target.value || undefined }))
                }
                className="min-h-11"
              />
            </div>

            <div className="flex-1">
              <label className="text-sm font-medium text-foreground mb-1.5 block">
                {t('filters.toDate')}
              </label>
              <Input
                type="date"
                value={filters.to_date || ''}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, to_date: e.target.value || undefined }))
                }
                className="min-h-11"
              />
            </div>
          </div>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="text-sm">
              <X className={cn('h-4 w-4', isRTL ? 'ms-1' : 'me-1')} />
              {t('filters.clearFilters')}
            </Button>
          )}
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-40 w-full rounded-lg" />
          ))}
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="p-6 text-center bg-destructive/10 rounded-lg">
          <p className="text-destructive">{t('messages.error')}</p>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && (!data?.items || data.items.length === 0) && (
        <div className="py-12 text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <FileText className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-1">{t('empty.title')}</h3>
          <p className="text-sm text-muted-foreground mb-4 max-w-sm mx-auto">
            {t('empty.description')}
          </p>
          {onCreateNew && (
            <Button onClick={onCreateNew} className="min-h-11">
              <Plus className={cn('h-4 w-4', isRTL ? 'ms-2' : 'me-2')} />
              {t('empty.cta')}
            </Button>
          )}
        </div>
      )}

      {/* Minutes List */}
      {!isLoading && !error && data?.items && data.items.length > 0 && (
        <div className="space-y-3">
          {data.items.map((minutes) => (
            <MeetingMinutesCard key={minutes.id} minutes={minutes} onClick={onSelectMinutes} />
          ))}

          {/* Load More */}
          {data.hasMore && (
            <div className="pt-4 text-center">
              <Button variant="outline" className="min-h-11">
                {t('list.loadMore')}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default MeetingMinutesList
