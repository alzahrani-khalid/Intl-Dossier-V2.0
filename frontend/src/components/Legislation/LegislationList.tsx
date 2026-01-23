/**
 * Legislation List Component
 * Displays a filterable, paginated list of legislation items
 */

import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from '@tanstack/react-router'
import {
  Search,
  Filter,
  Plus,
  FileText,
  Calendar,
  AlertCircle,
  ChevronRight,
  Eye,
  Bell,
  BellOff,
  Loader2,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useLegislations, useWatchLegislation, useUnwatchLegislation } from '@/hooks/useLegislation'
import {
  type LegislationType,
  type LegislationStatus,
  type LegislationPriority,
  type LegislationFilters,
  type LegislationWithDetails,
  STATUS_COLORS,
  PRIORITY_COLORS,
} from '@/types/legislation.types'

interface LegislationListProps {
  dossierId?: string
  onCreateClick?: () => void
  className?: string
}

export function LegislationList({ dossierId, onCreateClick, className }: LegislationListProps) {
  const { t, i18n } = useTranslation('legislation')
  const isRTL = i18n.language === 'ar'

  // Filter state
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<LegislationType | 'all'>('all')
  const [statusFilter, setStatusFilter] = useState<LegislationStatus | 'all'>('all')
  const [priorityFilter, setPriorityFilter] = useState<LegislationPriority | 'all'>('all')
  const [showFilters, setShowFilters] = useState(false)

  // Build filters
  const filters: LegislationFilters = useMemo(() => {
    const f: LegislationFilters = {}
    if (search) f.search = search
    if (dossierId) f.dossier_id = dossierId
    if (typeFilter !== 'all') f.type = [typeFilter]
    if (statusFilter !== 'all') f.status = [statusFilter]
    if (priorityFilter !== 'all') f.priority = [priorityFilter]
    return f
  }, [search, dossierId, typeFilter, statusFilter, priorityFilter])

  // Fetch legislations
  const { data, isLoading, error } = useLegislations(filters)

  // Watch/unwatch mutations
  const watchMutation = useWatchLegislation()
  const unwatchMutation = useUnwatchLegislation()

  const handleToggleWatch = (legislation: LegislationWithDetails) => {
    if (legislation.is_watching) {
      unwatchMutation.mutate(legislation.id)
    } else {
      watchMutation.mutate({ legislation_id: legislation.id })
    }
  }

  const hasActiveFilters =
    typeFilter !== 'all' || statusFilter !== 'all' || priorityFilter !== 'all'

  const clearFilters = () => {
    setTypeFilter('all')
    setStatusFilter('all')
    setPriorityFilter('all')
  }

  const legislationTypes: LegislationType[] = [
    'law',
    'regulation',
    'directive',
    'policy',
    'resolution',
    'treaty',
    'amendment',
    'proposal',
    'executive_order',
    'decree',
    'other',
  ]

  const legislationStatuses: LegislationStatus[] = [
    'draft',
    'proposed',
    'under_review',
    'in_committee',
    'pending_vote',
    'passed',
    'enacted',
    'implemented',
    'superseded',
    'repealed',
    'expired',
    'withdrawn',
  ]

  const priorities: LegislationPriority[] = ['low', 'medium', 'high', 'critical']

  return (
    <div className={cn('space-y-4', className)} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-start sm:text-3xl">{t('title')}</h1>
          <p className="text-muted-foreground text-sm text-start">{t('subtitle')}</p>
        </div>
        {onCreateClick && (
          <Button onClick={onCreateClick} className="min-h-11 min-w-11">
            <Plus className={cn('h-4 w-4', isRTL ? 'ms-2' : 'me-2')} />
            {t('actions.create')}
          </Button>
        )}
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search
            className={cn(
              'text-muted-foreground absolute top-1/2 h-4 w-4 -translate-y-1/2',
              isRTL ? 'end-3' : 'start-3',
            )}
          />
          <Input
            placeholder={t('actions.search')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={cn('h-11', isRTL ? 'pe-10 ps-4' : 'ps-10 pe-4')}
          />
        </div>
        <Button variant="outline" onClick={() => setShowFilters(!showFilters)} className="min-h-11">
          <Filter className={cn('h-4 w-4', isRTL ? 'ms-2' : 'me-2')} />
          {t('actions.filter')}
          {hasActiveFilters && (
            <Badge variant="secondary" className={cn(isRTL ? 'me-2' : 'ms-2')}>
              {[typeFilter, statusFilter, priorityFilter].filter((f) => f !== 'all').length}
            </Badge>
          )}
        </Button>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <Card>
          <CardContent className="pt-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block text-start">
                  {t('filters.type')}
                </label>
                <Select
                  value={typeFilter}
                  onValueChange={(v) => setTypeFilter(v as LegislationType | 'all')}
                >
                  <SelectTrigger className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('common:all')}</SelectItem>
                    {legislationTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {t(`type.${type}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block text-start">
                  {t('filters.status')}
                </label>
                <Select
                  value={statusFilter}
                  onValueChange={(v) => setStatusFilter(v as LegislationStatus | 'all')}
                >
                  <SelectTrigger className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('common:all')}</SelectItem>
                    {legislationStatuses.map((status) => (
                      <SelectItem key={status} value={status}>
                        {t(`status.${status}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block text-start">
                  {t('filters.priority')}
                </label>
                <Select
                  value={priorityFilter}
                  onValueChange={(v) => setPriorityFilter(v as LegislationPriority | 'all')}
                >
                  <SelectTrigger className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('common:all')}</SelectItem>
                    {priorities.map((priority) => (
                      <SelectItem key={priority} value={priority}>
                        {t(`priority.${priority}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {hasActiveFilters && (
                <div className="flex items-end">
                  <Button variant="ghost" onClick={clearFilters} className="h-11">
                    <X className={cn('h-4 w-4', isRTL ? 'ms-2' : 'me-2')} />
                    {t('actions.clearFilters')}
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-10 w-10 rounded" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                  <Skeleton className="h-6 w-20" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Error State */}
      {error && (
        <Card className="border-destructive">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 text-destructive">
              <AlertCircle className="h-5 w-5" />
              <p>{t('errors.loadFailed')}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!isLoading && !error && data?.legislations.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-8 text-center">
            <FileText className="text-muted-foreground mb-4 h-12 w-12" />
            <h3 className="text-lg font-semibold mb-2">
              {hasActiveFilters ? t('list.emptyFiltered') : t('list.empty')}
            </h3>
            {onCreateClick && !hasActiveFilters && (
              <Button onClick={onCreateClick} className="mt-4">
                <Plus className={cn('h-4 w-4', isRTL ? 'ms-2' : 'me-2')} />
                {t('actions.create')}
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Legislation List */}
      {!isLoading && data?.legislations && data.legislations.length > 0 && (
        <div className="space-y-3">
          {data.legislations.map((legislation) => (
            <LegislationCard
              key={legislation.id}
              legislation={legislation}
              isRTL={isRTL}
              onToggleWatch={() => handleToggleWatch(legislation)}
              isWatching={watchMutation.isPending || unwatchMutation.isPending}
            />
          ))}
        </div>
      )}

      {/* Results Count */}
      {data?.totalCount !== undefined && data.totalCount > 0 && (
        <p className="text-muted-foreground text-center text-sm">
          {t('list.showingCount', {
            count: data.legislations.length,
            total: data.totalCount,
          })}
        </p>
      )}
    </div>
  )
}

interface LegislationCardProps {
  legislation: LegislationWithDetails
  isRTL: boolean
  onToggleWatch: () => void
  isWatching: boolean
}

function LegislationCard({ legislation, isRTL, onToggleWatch, isWatching }: LegislationCardProps) {
  const { t, i18n } = useTranslation('legislation')
  const title =
    i18n.language === 'ar' && legislation.title_ar ? legislation.title_ar : legislation.title_en

  const statusColors = STATUS_COLORS[legislation.status]
  const priorityColors = PRIORITY_COLORS[legislation.priority]

  const daysUntilCommentEnd = legislation.comment_period_end
    ? Math.ceil(
        (new Date(legislation.comment_period_end).getTime() - new Date().getTime()) /
          (1000 * 60 * 60 * 24),
      )
    : null

  const hasOpenCommentPeriod =
    legislation.comment_period_status === 'open' &&
    daysUntilCommentEnd !== null &&
    daysUntilCommentEnd >= 0

  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardContent className="p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          {/* Icon */}
          <div className={cn('hidden sm:block rounded-lg p-2.5', statusColors.bg)}>
            <FileText className={cn('h-5 w-5', statusColors.text)} />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              {/* Type Badge */}
              <Badge variant="outline" className="text-xs">
                {t(`type.${legislation.type}`)}
              </Badge>
              {/* Reference Number */}
              {legislation.reference_number && (
                <span className="text-muted-foreground text-xs">
                  {legislation.reference_number}
                </span>
              )}
            </div>

            {/* Title */}
            <Link to="/legislation/$id" params={{ id: legislation.id }} className="block">
              <h3 className="font-semibold text-start hover:text-primary transition-colors line-clamp-2">
                {title}
              </h3>
            </Link>

            {/* Meta Info */}
            <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-muted-foreground">
              {legislation.jurisdiction && <span>{legislation.jurisdiction}</span>}
              {legislation.introduced_date && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  {new Date(legislation.introduced_date).toLocaleDateString(
                    i18n.language === 'ar' ? 'ar-SA' : 'en-US',
                  )}
                </span>
              )}
              {hasOpenCommentPeriod && (
                <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                  <AlertCircle className="h-3.5 w-3.5" />
                  {t('commentPeriod.daysRemaining', { count: daysUntilCommentEnd })}
                </span>
              )}
            </div>
          </div>

          {/* Status & Actions */}
          <div className="flex flex-wrap items-center gap-2 sm:flex-col sm:items-end">
            {/* Status Badge */}
            <Badge
              className={cn('border', statusColors.bg, statusColors.text, statusColors.border)}
            >
              {t(`status.${legislation.status}`)}
            </Badge>

            {/* Priority Badge */}
            <Badge
              variant="outline"
              className={cn(
                'text-xs',
                priorityColors.bg,
                priorityColors.text,
                priorityColors.border,
              )}
            >
              {t(`priority.${legislation.priority}`)}
            </Badge>

            {/* Actions */}
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={(e) => {
                  e.preventDefault()
                  onToggleWatch()
                }}
                disabled={isWatching}
              >
                {isWatching ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : legislation.is_watching ? (
                  <Bell className="h-4 w-4 text-primary" />
                ) : (
                  <BellOff className="h-4 w-4" />
                )}
              </Button>
              <Link to="/legislation/$id" params={{ id: legislation.id }}>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <ChevronRight className={cn('h-4 w-4', isRTL && 'rotate-180')} />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
