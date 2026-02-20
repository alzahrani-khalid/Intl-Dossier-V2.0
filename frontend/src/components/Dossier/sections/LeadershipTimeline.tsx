/**
 * LeadershipTimeline Component
 *
 * Displays organization leadership history as a timeline with current leaders highlighted.
 * Mobile-first responsive, RTL support.
 */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  User,
  Calendar,
  Award,
  ChevronDown,
  ChevronRight,
  Plus,
  Pencil,
  X,
  Clock,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import {
  useOrganizationLeadership,
  useDeleteLeadership,
  useEndLeadershipTenure,
} from '@/hooks/useOrganizationLeadership'
import type { LeadershipWithDetails, PositionLevel } from '@/types/contacts.types'

interface LeadershipTimelineProps {
  organizationId: string
  onAddLeader?: () => void
  onEditLeader?: (leader: LeadershipWithDetails) => void
}

export function LeadershipTimeline({
  organizationId,
  onAddLeader,
  onEditLeader,
}: LeadershipTimelineProps) {
  const { t, i18n } = useTranslation('contacts-extended')
  const isRTL = i18n.language === 'ar'

  const [showPast, setShowPast] = useState(false)

  // Fetch leadership data
  const {
    data: leadership,
    isLoading,
    error,
    refetch,
  } = useOrganizationLeadership(organizationId, { include_past: showPast })
  const deleteLeader = useDeleteLeadership()
  const endTenure = useEndLeadershipTenure()

  // Separate current and past leaders
  const currentLeaders = leadership?.filter((l) => l.is_current) || []
  const pastLeaders = leadership?.filter((l) => !l.is_current) || []

  // Handle delete
  const handleDelete = async (leader: LeadershipWithDetails) => {
    if (
      window.confirm(t('leadership.confirmDelete', 'Are you sure you want to remove this record?'))
    ) {
      await deleteLeader.mutateAsync({ id: leader.id, organizationId })
    }
  }

  // Handle end tenure
  const handleEndTenure = async (leader: LeadershipWithDetails) => {
    if (window.confirm(t('leadership.confirmEnd', 'End this leadership tenure?'))) {
      await endTenure.mutateAsync({ id: leader.id, organizationId })
    }
  }

  return (
    <div className="space-y-4" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-start">
            {t('leadership.title', 'Organization Leadership')}
          </h3>
          <p className="text-sm text-muted-foreground text-start">
            {t('leadership.description', 'Track leadership positions and changes')}
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          className="gap-2 min-h-10 shrink-0"
          onClick={onAddLeader}
        >
          <Plus className={cn('h-4 w-4', isRTL && 'rotate-180')} />
          {t('leadership.create', 'Add Position')}
        </Button>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full rounded-lg" />
          ))}
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="text-center py-8">
          <div className="rounded-full bg-destructive/10 p-4 w-fit mx-auto mb-4">
            <X className="h-8 w-8 text-destructive" />
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            {t('leadership.loadError', 'Failed to load leadership data')}
          </p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            {t('common.retry', 'Try Again')}
          </Button>
        </div>
      )}

      {/* Current Leaders */}
      {!isLoading && !error && (
        <>
          {currentLeaders.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                {t('leadership.current', 'Current Leadership')}
                <Badge variant="secondary" className="text-xs">
                  {currentLeaders.length}
                </Badge>
              </h4>

              {currentLeaders.map((leader) => (
                <LeaderCard
                  key={leader.id}
                  leader={leader}
                  isRTL={isRTL}
                  isCurrent={true}
                  onEdit={onEditLeader}
                  onDelete={handleDelete}
                  onEndTenure={handleEndTenure}
                  t={t}
                  i18n={i18n}
                />
              ))}
            </div>
          )}

          {/* Past Leaders Toggle */}
          <div className="flex items-center gap-2 py-2">
            <Button
              variant="ghost"
              size="sm"
              className="gap-2 text-muted-foreground"
              onClick={() => setShowPast(!showPast)}
            >
              {showPast ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className={cn('h-4 w-4', isRTL && 'rotate-180')} />
              )}
              {t('leadership.history', 'Leadership History')}
              {pastLeaders.length > 0 && (
                <Badge variant="outline" className="text-xs">
                  {pastLeaders.length}
                </Badge>
              )}
            </Button>
          </div>

          {/* Past Leaders */}
          {showPast && pastLeaders.length > 0 && (
            <div className="space-y-3 relative">
              {/* Timeline line */}
              <div
                className={cn(
                  'absolute top-0 bottom-0 w-0.5 bg-border',
                  isRTL ? 'end-6' : 'start-6',
                )}
              />

              {pastLeaders.map((leader) => (
                <LeaderCard
                  key={leader.id}
                  leader={leader}
                  isRTL={isRTL}
                  isCurrent={false}
                  onEdit={onEditLeader}
                  onDelete={handleDelete}
                  t={t}
                  i18n={i18n}
                />
              ))}
            </div>
          )}

          {/* Empty State */}
          {currentLeaders.length === 0 && pastLeaders.length === 0 && (
            <div className="text-center py-8 sm:py-12">
              <div className="rounded-full bg-muted p-4 w-fit mx-auto mb-4">
                <User className="h-8 w-8 text-muted-foreground" />
              </div>
              <h4 className="text-lg font-medium mb-2">
                {t('leadership.empty', 'No Leadership Records')}
              </h4>
              <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
                {t(
                  'leadership.emptyDescription',
                  'Add leadership information for this organization',
                )}
              </p>
              <Button variant="default" onClick={onAddLeader} className="gap-2 min-h-11">
                <Plus className={cn('h-4 w-4', isRTL && 'rotate-180')} />
                {t('leadership.create', 'Add Position')}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

// Leader Card Component
interface LeaderCardProps {
  leader: LeadershipWithDetails
  isRTL: boolean
  isCurrent: boolean
  onEdit?: (leader: LeadershipWithDetails) => void
  onDelete?: (leader: LeadershipWithDetails) => void
  onEndTenure?: (leader: LeadershipWithDetails) => void
  t: ReturnType<typeof useTranslation>['t']
  i18n: { language: string }
}

function LeaderCard({
  leader,
  isRTL,
  isCurrent,
  onEdit,
  onDelete,
  onEndTenure,
  t,
  i18n,
}: LeaderCardProps) {
  const [showActions, setShowActions] = useState(false)

  const name = isRTL
    ? leader.leader_name_ar || leader.leader_name_en
    : leader.leader_name_en || leader.leader_name_ar
  const title = isRTL
    ? leader.position_title_ar || leader.position_title_en
    : leader.position_title_en || leader.position_title_ar

  // Format dates
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(i18n.language, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  // Calculate tenure
  const formatTenure = (days: number | undefined) => {
    if (!days) return null
    const years = Math.floor(days / 365)
    const months = Math.floor((days % 365) / 30)
    if (years > 0) {
      return `${years}y ${months}m`
    }
    return `${months}m`
  }

  // Position level badge
  const levelConfig = getPositionLevelConfig(leader.position_level, t)

  return (
    <div
      className={cn(
        'group rounded-lg border bg-card p-4 transition-all duration-200 relative',
        isCurrent
          ? 'border-primary/30 bg-primary/5 hover:border-primary/50'
          : 'hover:border-muted-foreground/30',
        !isCurrent && (isRTL ? 'me-12' : 'ms-12'),
      )}
    >
      {/* Timeline dot for past leaders */}
      {!isCurrent && (
        <div
          className={cn(
            'absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-muted-foreground/30 border-2 border-background',
            isRTL ? '-end-8' : '-start-8',
          )}
        />
      )}

      <div className="flex items-start gap-3">
        {/* Photo/Avatar */}
        <div className="shrink-0">
          {leader.photo_url ? (
            <img
              src={leader.photo_url}
              alt={name || ''}
              className="w-12 h-12 rounded-full object-cover"
            />
          ) : (
            <div
              className={cn(
                'w-12 h-12 rounded-full flex items-center justify-center',
                isCurrent ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground',
              )}
            >
              <User className="h-6 w-6" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Name & Level */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
            <div>
              <h4 className="font-medium text-card-foreground text-start">
                {name || t('common.unknown', 'Unknown')}
              </h4>
              <p className="text-sm text-muted-foreground">{title}</p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Badge variant={levelConfig.variant} className="text-xs">
                {levelConfig.label}
              </Badge>
              {leader.appointment_type && (
                <Badge variant="outline" className="text-xs">
                  {t(`appointmentTypes.${leader.appointment_type}`, leader.appointment_type)}
                </Badge>
              )}
            </div>
          </div>

          {/* Meta Row */}
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
            {/* Dates */}
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {formatDate(leader.start_date)}
              {leader.end_date
                ? ` - ${formatDate(leader.end_date)}`
                : isCurrent
                  ? ' - Present'
                  : ''}
            </span>

            {/* Tenure */}
            {leader.tenure_days && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatTenure(leader.tenure_days)}
              </span>
            )}

            {/* Announcement link */}
            {leader.announcement_url && (
              <a
                href={leader.announcement_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-primary hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                <ExternalLink className="h-3 w-3" />
                {t('leadershipForm.announcementSource', 'Source')}
              </a>
            )}
          </div>

          {/* Achievements */}
          {leader.achievements && leader.achievements.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {leader.achievements.slice(0, 3).map((achievement, index) => (
                <Badge key={index} variant="secondary" className="text-xs gap-1">
                  <Award className="h-3 w-3" />
                  <span className="truncate max-w-[150px]">{achievement}</span>
                </Badge>
              ))}
              {leader.achievements.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{leader.achievements.length - 3}
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="relative shrink-0">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
            onClick={() => setShowActions(!showActions)}
          >
            <Pencil className="h-4 w-4" />
          </Button>

          {showActions && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowActions(false)} />
              <div
                className={cn(
                  'absolute z-20 mt-1 w-40 rounded-md border bg-popover p-1 shadow-md',
                  isRTL ? 'start-0' : 'end-0',
                )}
              >
                <button
                  className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-muted"
                  onClick={() => {
                    onEdit?.(leader)
                    setShowActions(false)
                  }}
                >
                  <Pencil className="h-3.5 w-3.5" />
                  {t('leadership.edit', 'Edit')}
                </button>
                {isCurrent && onEndTenure && (
                  <button
                    className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-muted text-amber-600"
                    onClick={() => {
                      onEndTenure(leader)
                      setShowActions(false)
                    }}
                  >
                    <Clock className="h-3.5 w-3.5" />
                    {t('leadership.endTenure', 'End Tenure')}
                  </button>
                )}
                <button
                  className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-destructive hover:bg-destructive/10"
                  onClick={() => {
                    onDelete?.(leader)
                    setShowActions(false)
                  }}
                >
                  <X className="h-3.5 w-3.5" />
                  {t('leadership.delete', 'Remove')}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// Helper function for position level config
type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline'

function getPositionLevelConfig(level: PositionLevel, t: ReturnType<typeof useTranslation>['t']) {
  const configs: Record<PositionLevel, { label: string; variant: BadgeVariant }> = {
    head: { label: t('positionLevels.head', 'Head'), variant: 'default' },
    deputy: { label: t('positionLevels.deputy', 'Deputy'), variant: 'default' },
    executive: { label: t('positionLevels.executive', 'Executive'), variant: 'secondary' },
    director: { label: t('positionLevels.director', 'Director'), variant: 'secondary' },
    manager: { label: t('positionLevels.manager', 'Manager'), variant: 'outline' },
    coordinator: { label: t('positionLevels.coordinator', 'Coordinator'), variant: 'outline' },
  }

  return configs[level] || configs.head
}

export default LeadershipTimeline
