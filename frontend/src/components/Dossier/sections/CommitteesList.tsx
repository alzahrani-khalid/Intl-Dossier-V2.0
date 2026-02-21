/**
 * CommitteesList Component
 *
 * Displays committees for a forum or organization with member counts and pending nominations.
 * Mobile-first responsive, RTL support.
 */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Users,
  Plus,
  Search,
  Filter,
  ChevronRight,
  Calendar,
  Mail,
  ExternalLink,
  UserPlus,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  X,
  Gavel,
  Settings,
  Wrench,
  Lightbulb,
  Briefcase,
  FileText,
  Shield,
  Wallet,
  Vote,
  Scale,
  ClipboardCheck,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { useCommittees } from '@/hooks/useCommittees'
import type { CommitteeWithStats, CommitteeType, CommitteeStatus } from '@/types/committee.types'

interface CommitteesListProps {
  forumId?: string
  organizationId?: string
  onCreateCommittee?: () => void
  onSelectCommittee?: (committee: CommitteeWithStats) => void
}

export function CommitteesList({
  forumId,
  organizationId,
  onCreateCommittee,
  onSelectCommittee,
}: CommitteesListProps) {
  const { t, i18n } = useTranslation('committees')
  const isRTL = i18n.language === 'ar'

  const [searchQuery, setSearchQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState<{
    committee_type?: CommitteeType
    status?: CommitteeStatus
    is_public?: boolean
  }>({})

  // Fetch committees
  const {
    data: committees,
    isLoading,
    error,
    refetch,
  } = useCommittees({
    forum_id: forumId,
    organization_id: organizationId,
    ...filters,
  })

  // Filter by search
  const filteredCommittees = committees?.filter((committee) => {
    if (!searchQuery) return true
    const name = isRTL ? committee.name_ar : committee.name_en
    return name?.toLowerCase().includes(searchQuery.toLowerCase())
  })

  // Clear filters
  const clearFilters = () => {
    setFilters({})
    setSearchQuery('')
  }

  const hasActiveFilters = Object.keys(filters).length > 0 || searchQuery.length > 0

  // Committee type options
  const committeeTypes: CommitteeType[] = [
    'jury',
    'steering',
    'technical',
    'advisory',
    'executive',
    'working',
    'drafting',
    'credentials',
    'budget',
    'nominations',
    'ethics',
    'audit',
    'other',
  ]

  // Status options
  const statusOptions: CommitteeStatus[] = [
    'forming',
    'active',
    'suspended',
    'dissolved',
    'reconstituting',
  ]

  return (
    <div className="space-y-4" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-start">{t('list.title', 'Committees')}</h3>
          <p className="text-sm text-muted-foreground text-start">
            {t('list.description', 'View and manage all committees')}
          </p>
        </div>

        {onCreateCommittee && (
          <Button
            variant="outline"
            size="sm"
            className="gap-2 min-h-10 shrink-0"
            onClick={onCreateCommittee}
          >
            <Plus className={cn('h-4 w-4', isRTL && 'rotate-180')} />
            {t('list.create', 'Create Committee')}
          </Button>
        )}
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('common.search', 'Search...')}
            className={cn(
              'w-full h-10 rounded-md border border-input bg-background ps-9 pe-3',
              'text-sm placeholder:text-muted-foreground',
              'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
            )}
          />
        </div>

        {/* Filter Button */}
        <Button
          variant="outline"
          size="sm"
          className={cn('gap-2 min-h-10', hasActiveFilters && 'border-primary text-primary')}
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter className="h-4 w-4" />
          {t('common.filters', 'Filters')}
          {hasActiveFilters && (
            <Badge variant="secondary" className="text-xs">
              {Object.keys(filters).length + (searchQuery ? 1 : 0)}
            </Badge>
          )}
        </Button>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="p-4 rounded-lg border bg-muted/30 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Type Filter */}
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">
                {t('filters.committeeType', 'Committee Type')}
              </label>
              <select
                value={filters.committee_type || ''}
                onChange={(e) =>
                  setFilters((f) => ({
                    ...f,
                    committee_type: (e.target.value as CommitteeType) || undefined,
                  }))
                }
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">{t('common.all', 'All')}</option>
                {committeeTypes.map((type) => (
                  <option key={type} value={type}>
                    {t(`types.${type}`, type)}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">
                {t('filters.status', 'Status')}
              </label>
              <select
                value={filters.status || ''}
                onChange={(e) =>
                  setFilters((f) => ({
                    ...f,
                    status: (e.target.value as CommitteeStatus) || undefined,
                  }))
                }
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">{t('common.all', 'All')}</option>
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {t(`status.${status}`, status)}
                  </option>
                ))}
              </select>
            </div>

            {/* Public Filter */}
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">
                {t('filters.isPublic', 'Visibility')}
              </label>
              <select
                value={filters.is_public === undefined ? '' : filters.is_public.toString()}
                onChange={(e) =>
                  setFilters((f) => ({
                    ...f,
                    is_public: e.target.value === '' ? undefined : e.target.value === 'true',
                  }))
                }
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">{t('common.all', 'All')}</option>
                <option value="true">{t('common.public', 'Public')}</option>
                <option value="false">{t('common.private', 'Private')}</option>
              </select>
            </div>
          </div>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              className="gap-2 text-muted-foreground"
              onClick={clearFilters}
            >
              <X className="h-4 w-4" />
              {t('common.clearFilters', 'Clear Filters')}
            </Button>
          )}
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={`skeleton-${i}`} className="h-48 rounded-lg" />
          ))}
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="text-center py-8">
          <div className="rounded-full bg-destructive/10 p-4 w-fit mx-auto mb-4">
            <XCircle className="h-8 w-8 text-destructive" />
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            {t('common.error', 'Failed to load data')}
          </p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            {t('common.retry', 'Try Again')}
          </Button>
        </div>
      )}

      {/* Committees Grid */}
      {!isLoading && !error && filteredCommittees && filteredCommittees.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCommittees.map((committee) => (
            <CommitteeCard
              key={committee.id}
              committee={committee}
              isRTL={isRTL}
              onSelect={onSelectCommittee}
              t={t}
              i18n={i18n}
            />
          ))}
        </div>
      )}

      {/* No Results */}
      {!isLoading &&
        !error &&
        filteredCommittees &&
        filteredCommittees.length === 0 &&
        hasActiveFilters && (
          <div className="text-center py-8">
            <div className="rounded-full bg-muted p-4 w-fit mx-auto mb-4">
              <Search className="h-8 w-8 text-muted-foreground" />
            </div>
            <h4 className="text-lg font-medium mb-2">
              {t('common.noResults', 'No Results Found')}
            </h4>
            <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
              {t('common.adjustFilters', 'Try adjusting your search or filters')}
            </p>
            <Button variant="outline" size="sm" onClick={clearFilters}>
              {t('common.clearFilters', 'Clear Filters')}
            </Button>
          </div>
        )}

      {/* Empty State */}
      {!isLoading &&
        !error &&
        (!filteredCommittees || filteredCommittees.length === 0) &&
        !hasActiveFilters && (
          <div className="text-center py-8 sm:py-12">
            <div className="rounded-full bg-muted p-4 w-fit mx-auto mb-4">
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
            <h4 className="text-lg font-medium mb-2">{t('list.empty', 'No committees found')}</h4>
            <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
              {t('list.emptyDescription', 'Create your first committee to get started')}
            </p>
            {onCreateCommittee && (
              <Button variant="default" onClick={onCreateCommittee} className="gap-2 min-h-11">
                <Plus className={cn('h-4 w-4', isRTL && 'rotate-180')} />
                {t('list.create', 'Create Committee')}
              </Button>
            )}
          </div>
        )}
    </div>
  )
}

// Committee Card Component
interface CommitteeCardProps {
  committee: CommitteeWithStats
  isRTL: boolean
  onSelect?: (committee: CommitteeWithStats) => void
  t: ReturnType<typeof useTranslation>['t']
  i18n: { language: string }
}

function CommitteeCard({ committee, isRTL, onSelect, t, i18n }: CommitteeCardProps) {
  const name = isRTL ? committee.name_ar : committee.name_en
  const description = isRTL
    ? committee.description_ar || committee.description_en
    : committee.description_en || committee.description_ar

  // Format date
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(i18n.language, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  // Get type icon
  const getTypeIcon = (type: CommitteeType) => {
    const iconClass = 'h-5 w-5'
    switch (type) {
      case 'jury':
        return <Gavel className={iconClass} />
      case 'steering':
        return <Settings className={iconClass} />
      case 'technical':
        return <Wrench className={iconClass} />
      case 'advisory':
        return <Lightbulb className={iconClass} />
      case 'executive':
        return <Briefcase className={iconClass} />
      case 'working':
        return <Users className={iconClass} />
      case 'drafting':
        return <FileText className={iconClass} />
      case 'credentials':
        return <Shield className={iconClass} />
      case 'budget':
        return <Wallet className={iconClass} />
      case 'nominations':
        return <Vote className={iconClass} />
      case 'ethics':
        return <Scale className={iconClass} />
      case 'audit':
        return <ClipboardCheck className={iconClass} />
      default:
        return <Users className={iconClass} />
    }
  }

  // Get status config
  const getStatusConfig = (status: CommitteeStatus) => {
    switch (status) {
      case 'active':
        return {
          icon: <CheckCircle2 className="h-3 w-3" />,
          variant: 'default' as const,
          color: 'text-green-600',
        }
      case 'forming':
        return {
          icon: <Clock className="h-3 w-3" />,
          variant: 'secondary' as const,
          color: 'text-blue-600',
        }
      case 'suspended':
        return {
          icon: <AlertCircle className="h-3 w-3" />,
          variant: 'destructive' as const,
          color: 'text-amber-600',
        }
      case 'dissolved':
        return {
          icon: <XCircle className="h-3 w-3" />,
          variant: 'outline' as const,
          color: 'text-muted-foreground',
        }
      case 'reconstituting':
        return {
          icon: <RefreshCw className="h-3 w-3" />,
          variant: 'secondary' as const,
          color: 'text-purple-600',
        }
      default:
        return {
          icon: <Clock className="h-3 w-3" />,
          variant: 'outline' as const,
          color: 'text-muted-foreground',
        }
    }
  }

  const statusConfig = getStatusConfig(committee.status)
  const hasPendingNominations = (committee.pending_nominations_count || 0) > 0

  return (
    <div
      role={onSelect ? 'button' : undefined}
      tabIndex={onSelect ? 0 : undefined}
      className={cn(
        'group rounded-lg border bg-card p-4 transition-all duration-200',
        'hover:border-primary/30 hover:shadow-sm',
        onSelect && 'cursor-pointer',
      )}
      onClick={onSelect ? () => onSelect(committee) : undefined}
      onKeyDown={
        onSelect
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onSelect(committee)
              }
            }
          : undefined
      }
    >
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <div
          className={cn(
            'rounded-lg p-2 shrink-0',
            committee.status === 'active' && 'bg-green-100 text-green-600',
            committee.status === 'forming' && 'bg-blue-100 text-blue-600',
            committee.status === 'suspended' && 'bg-amber-100 text-amber-600',
            committee.status === 'dissolved' && 'bg-muted text-muted-foreground',
            committee.status === 'reconstituting' && 'bg-purple-100 text-purple-600',
          )}
        >
          {getTypeIcon(committee.committee_type)}
        </div>

        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-card-foreground text-start line-clamp-1">{name}</h4>
          <p className="text-xs text-muted-foreground">
            {t(`types.${committee.committee_type}`, committee.committee_type)}
          </p>
        </div>

        <Badge variant={statusConfig.variant} className="text-xs gap-1 shrink-0">
          {statusConfig.icon}
          {t(`status.${committee.status}`, committee.status)}
        </Badge>
      </div>

      {/* Description */}
      {description && (
        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{description}</p>
      )}

      {/* Stats Row */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground mb-3">
        {/* Member Count */}
        <span className="flex items-center gap-1">
          <Users className="h-3 w-3" />
          {committee.current_member_count}
          {committee.max_members && `/${committee.max_members}`}
        </span>

        {/* Meeting Frequency */}
        {committee.meeting_frequency && (
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {t(`meetingFrequency.${committee.meeting_frequency}`, committee.meeting_frequency)}
          </span>
        )}

        {/* Next Meeting */}
        {committee.next_meeting_date && (
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatDate(committee.next_meeting_date)}
          </span>
        )}
      </div>

      {/* Badges Row */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Pending Nominations */}
        {hasPendingNominations && (
          <Badge variant="secondary" className="text-xs gap-1">
            <UserPlus className="h-3 w-3" />
            {committee.pending_nominations_count} {t('nominations.title', 'Nominations')}
          </Badge>
        )}

        {/* Standing Committee */}
        {committee.is_standing && (
          <Badge variant="outline" className="text-xs">
            {t('form.isStanding', 'Standing')}
          </Badge>
        )}

        {/* Term Dates */}
        {committee.term_end && (
          <Badge variant="outline" className="text-xs gap-1">
            <Calendar className="h-3 w-3" />
            {formatDate(committee.term_end)}
          </Badge>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-4 pt-3 border-t">
        <div className="flex items-center gap-2">
          {committee.secretariat_email && (
            <a
              href={`mailto:${committee.secretariat_email}`}
              className="p-1.5 rounded-md hover:bg-muted transition-colors"
              onClick={(e) => e.stopPropagation()}
              title={committee.secretariat_email}
            >
              <Mail className="h-4 w-4 text-muted-foreground" />
            </a>
          )}
          {committee.charter_url && (
            <a
              href={committee.charter_url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded-md hover:bg-muted transition-colors"
              onClick={(e) => e.stopPropagation()}
              title={t('form.charterUrl', 'Charter')}
            >
              <ExternalLink className="h-4 w-4 text-muted-foreground" />
            </a>
          )}
        </div>

        {onSelect && (
          <ChevronRight
            className={cn(
              'h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors',
              isRTL && 'rotate-180',
            )}
          />
        )}
      </div>
    </div>
  )
}

export default CommitteesList
