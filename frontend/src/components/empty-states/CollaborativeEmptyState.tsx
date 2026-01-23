/**
 * CollaborativeEmptyState Component
 * Feature: Collaborative Empty States
 *
 * Enhanced empty state that shows team activity stats and encourages collaboration
 * Displays "Others have created X dossiers" and provides team invitation flow
 * Mobile-first responsive design with full RTL support
 */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Users, UserPlus, TrendingUp, Sparkles, LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  useTeamStats,
  getEntityTypeDisplayName,
  type TeamStats,
  type TeamContributor,
} from '@/hooks/useTeamCollaboration'
import { TeamInvitationDialog } from './TeamInvitationDialog'

export interface CollaborativeEmptyStateProps {
  /** Entity type (dossier, document, engagement, etc.) */
  entityType: string
  /** Main empty state icon */
  icon: LucideIcon
  /** Main empty state title */
  title: string
  /** Main empty state description */
  description: string
  /** Primary action callback */
  onPrimaryAction?: () => void
  /** Primary action label */
  primaryActionLabel?: string
  /** Secondary actions */
  secondaryActions?: Array<{
    label: string
    onClick: () => void
    icon?: LucideIcon
  }>
  /** Current user's name for invitation template */
  currentUserName?: string
  /** Whether to show the collaboration section */
  showCollaboration?: boolean
  /** Additional CSS classes */
  className?: string
  /** Test ID for automated testing */
  testId?: string
}

/**
 * Enhanced empty state with team collaboration features
 *
 * Features:
 * - Shows team activity statistics when the section is empty
 * - Displays top contributors with their stats
 * - Provides easy team invitation flow
 * - Mobile-first responsive design
 * - Full RTL support with logical properties
 */
export function CollaborativeEmptyState({
  entityType,
  icon: Icon,
  title,
  description,
  onPrimaryAction,
  primaryActionLabel,
  secondaryActions = [],
  currentUserName = 'Team Member',
  showCollaboration = true,
  className,
  testId = 'collaborative-empty-state',
}: CollaborativeEmptyStateProps) {
  const { t, i18n } = useTranslation('empty-states')
  const isRTL = i18n.language === 'ar'

  // State
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false)

  // Fetch team stats
  const {
    data: teamStats,
    isLoading: statsLoading,
    isError: statsError,
  } = useTeamStats({
    entityType,
    enabled: showCollaboration,
  })

  // Entity type display name
  const entityDisplayName = getEntityTypeDisplayName(entityType, isRTL ? 'ar' : 'en')

  // Get initials for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  // Determine if team has activity
  const hasTeamActivity = teamStats?.hasTeamActivity && teamStats.stats.totalCount > 0

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center',
        'py-8 px-4 sm:py-12 sm:px-6 lg:py-16 lg:px-8',
        className,
      )}
      dir={isRTL ? 'rtl' : 'ltr'}
      data-testid={testId}
    >
      {/* Main Icon */}
      <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-muted sm:mb-6 sm:size-20">
        <Icon className="size-8 text-muted-foreground sm:size-10" />
      </div>

      {/* Title & Description */}
      <h3 className="mb-2 text-lg font-semibold text-foreground sm:text-xl md:text-2xl">{title}</h3>
      <p className="mb-6 max-w-md text-sm text-muted-foreground sm:text-base">{description}</p>

      {/* Primary Action */}
      {onPrimaryAction && primaryActionLabel && (
        <Button onClick={onPrimaryAction} className="mb-4 min-h-11 min-w-11 px-6 sm:px-8">
          {primaryActionLabel}
        </Button>
      )}

      {/* Secondary Actions */}
      {secondaryActions.length > 0 && (
        <div className="mb-6 flex flex-wrap justify-center gap-2">
          {secondaryActions.map((action, index) => (
            <Button
              key={index}
              variant="outline"
              onClick={action.onClick}
              className="min-h-10 gap-2"
            >
              {action.icon && <action.icon className="size-4" />}
              {action.label}
            </Button>
          ))}
        </div>
      )}

      {/* Team Collaboration Section */}
      {showCollaboration && (
        <>
          <Separator className="my-6 w-full max-w-md" />

          {/* Loading State */}
          {statsLoading && (
            <Card className="w-full max-w-md">
              <CardContent className="p-4 sm:p-6">
                <div className="mb-4 flex items-center gap-3">
                  <Skeleton className="size-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          )}

          {/* Team Activity Stats */}
          {!statsLoading && !statsError && hasTeamActivity && (
            <Card className="w-full max-w-md" data-testid={`${testId}-team-activity`}>
              <CardContent className="p-4 sm:p-6">
                {/* Activity Header */}
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-full bg-primary/10">
                    <Sparkles className="size-5 text-primary" />
                  </div>
                  <div className="flex-1 text-start">
                    <h4 className="font-semibold text-foreground">
                      {t('collaboration.teamActivity.title')}
                    </h4>
                    <p className="text-xs text-muted-foreground sm:text-sm">
                      {t('collaboration.teamActivity.description', {
                        entityType: entityDisplayName,
                      })}
                    </p>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="mb-4 grid grid-cols-3 gap-2 sm:gap-4">
                  <div className="rounded-lg bg-muted/50 p-2 text-center sm:p-3">
                    <div className="text-lg font-bold text-foreground sm:text-2xl">
                      {teamStats.stats.totalCount}
                    </div>
                    <div className="truncate text-xs text-muted-foreground">
                      {entityDisplayName}
                    </div>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-2 text-center sm:p-3">
                    <div className="text-lg font-bold text-foreground sm:text-2xl">
                      {teamStats.stats.recentCount}
                    </div>
                    <div className="truncate text-xs text-muted-foreground">
                      {isRTL ? 'حديث' : 'Recent'}
                    </div>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-2 text-center sm:p-3">
                    <div className="text-lg font-bold text-foreground sm:text-2xl">
                      {teamStats.stats.uniqueCreators}
                    </div>
                    <div className="truncate text-xs text-muted-foreground">
                      {isRTL ? 'المساهمون' : 'Contributors'}
                    </div>
                  </div>
                </div>

                {/* Top Contributors */}
                {teamStats.topContributors && teamStats.topContributors.length > 0 && (
                  <div className="mb-4">
                    <h5 className="mb-2 text-start text-sm font-medium text-muted-foreground">
                      {t('collaboration.topContributors.title')}
                    </h5>
                    <div className="flex flex-col gap-2">
                      {teamStats.topContributors.slice(0, 3).map((contributor) => (
                        <ContributorRow
                          key={contributor.user_id}
                          contributor={contributor}
                          isRTL={isRTL}
                          t={t}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Invite Button */}
                <Button
                  variant="outline"
                  onClick={() => setInviteDialogOpen(true)}
                  className="min-h-11 w-full gap-2"
                  data-testid={`${testId}-invite-button`}
                >
                  <UserPlus className="size-4" />
                  {t('collaboration.invite.buttonLabel')}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* No Team Activity - Encouragement */}
          {!statsLoading && !statsError && !hasTeamActivity && (
            <Card className="w-full max-w-md" data-testid={`${testId}-empty-team`}>
              <CardContent className="p-4 text-center sm:p-6">
                <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-primary/10">
                  <TrendingUp className="size-6 text-primary" />
                </div>
                <h4 className="mb-1 font-semibold text-foreground">
                  {t('collaboration.emptyTeam.title')}
                </h4>
                <p className="mb-4 text-sm text-muted-foreground">
                  {t('collaboration.emptyTeam.description', {
                    entityType: entityDisplayName,
                  })}
                </p>
                <Button
                  variant="outline"
                  onClick={() => setInviteDialogOpen(true)}
                  className="min-h-11 gap-2"
                >
                  <UserPlus className="size-4" />
                  {t('collaboration.invite.buttonLabel')}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Encouragement Message */}
          {!statsLoading && (
            <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground sm:text-sm">
              <Users className="size-4 shrink-0" />
              <span>{t('collaboration.encouragement.description')}</span>
            </div>
          )}
        </>
      )}

      {/* Invitation Dialog */}
      <TeamInvitationDialog
        open={inviteDialogOpen}
        onOpenChange={setInviteDialogOpen}
        entityType={entityType}
        suggestedUsers={teamStats?.suggestedUsers}
        inviterName={currentUserName}
      />
    </div>
  )
}

// Contributor Row Component
interface ContributorRowProps {
  contributor: TeamContributor
  isRTL: boolean
  t: (key: string, options?: Record<string, unknown>) => string
}

function ContributorRow({ contributor, isRTL, t }: ContributorRowProps) {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <div
      className={cn(
        'flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors',
        'text-start',
      )}
    >
      <Avatar className="size-8">
        <AvatarImage src={contributor.avatar_url || undefined} />
        <AvatarFallback className="text-xs">{getInitials(contributor.full_name)}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium text-foreground">{contributor.full_name}</div>
        <div className="text-xs text-muted-foreground">
          {t('collaboration.topContributors.contributions', {
            count: contributor.contribution_count,
          })}
        </div>
      </div>
      <Badge variant="secondary" className="hidden text-xs sm:inline-flex">
        {contributor.contribution_count}
      </Badge>
    </div>
  )
}

export default CollaborativeEmptyState
