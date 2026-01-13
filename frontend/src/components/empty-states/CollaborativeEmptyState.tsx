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
      <div className="flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-muted mb-4 sm:mb-6">
        <Icon className="w-8 h-8 sm:w-10 sm:h-10 text-muted-foreground" />
      </div>

      {/* Title & Description */}
      <h3 className="text-lg sm:text-xl md:text-2xl font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-sm sm:text-base text-muted-foreground max-w-md mb-6">{description}</p>

      {/* Primary Action */}
      {onPrimaryAction && primaryActionLabel && (
        <Button onClick={onPrimaryAction} className="min-h-11 min-w-11 px-6 sm:px-8 mb-4">
          {primaryActionLabel}
        </Button>
      )}

      {/* Secondary Actions */}
      {secondaryActions.length > 0 && (
        <div className="flex flex-wrap justify-center gap-2 mb-6">
          {secondaryActions.map((action, index) => (
            <Button
              key={index}
              variant="outline"
              onClick={action.onClick}
              className="min-h-10 gap-2"
            >
              {action.icon && <action.icon className="w-4 h-4" />}
              {action.label}
            </Button>
          ))}
        </div>
      )}

      {/* Team Collaboration Section */}
      {showCollaboration && (
        <>
          <Separator className="w-full max-w-md my-6" />

          {/* Loading State */}
          {statsLoading && (
            <Card className="w-full max-w-md">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-2 flex-1">
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
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
                    <Sparkles className="w-5 h-5 text-primary" />
                  </div>
                  <div className="text-start flex-1">
                    <h4 className="font-semibold text-foreground">
                      {t('collaboration.teamActivity.title')}
                    </h4>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      {t('collaboration.teamActivity.description', {
                        entityType: entityDisplayName,
                      })}
                    </p>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-4">
                  <div className="text-center p-2 sm:p-3 rounded-lg bg-muted/50">
                    <div className="text-lg sm:text-2xl font-bold text-foreground">
                      {teamStats.stats.totalCount}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {entityDisplayName}
                    </div>
                  </div>
                  <div className="text-center p-2 sm:p-3 rounded-lg bg-muted/50">
                    <div className="text-lg sm:text-2xl font-bold text-foreground">
                      {teamStats.stats.recentCount}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {isRTL ? 'حديث' : 'Recent'}
                    </div>
                  </div>
                  <div className="text-center p-2 sm:p-3 rounded-lg bg-muted/50">
                    <div className="text-lg sm:text-2xl font-bold text-foreground">
                      {teamStats.stats.uniqueCreators}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {isRTL ? 'المساهمون' : 'Contributors'}
                    </div>
                  </div>
                </div>

                {/* Top Contributors */}
                {teamStats.topContributors && teamStats.topContributors.length > 0 && (
                  <div className="mb-4">
                    <h5 className="text-sm font-medium text-muted-foreground mb-2 text-start">
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
                  className="w-full min-h-11 gap-2"
                  data-testid={`${testId}-invite-button`}
                >
                  <UserPlus className="w-4 h-4" />
                  {t('collaboration.invite.buttonLabel')}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* No Team Activity - Encouragement */}
          {!statsLoading && !statsError && !hasTeamActivity && (
            <Card className="w-full max-w-md" data-testid={`${testId}-empty-team`}>
              <CardContent className="p-4 sm:p-6 text-center">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mx-auto mb-3">
                  <TrendingUp className="w-6 h-6 text-primary" />
                </div>
                <h4 className="font-semibold text-foreground mb-1">
                  {t('collaboration.emptyTeam.title')}
                </h4>
                <p className="text-sm text-muted-foreground mb-4">
                  {t('collaboration.emptyTeam.description', {
                    entityType: entityDisplayName,
                  })}
                </p>
                <Button
                  variant="outline"
                  onClick={() => setInviteDialogOpen(true)}
                  className="min-h-11 gap-2"
                >
                  <UserPlus className="w-4 h-4" />
                  {t('collaboration.invite.buttonLabel')}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Encouragement Message */}
          {!statsLoading && (
            <div className="mt-4 flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
              <Users className="w-4 h-4 flex-shrink-0" />
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
      <Avatar className="h-8 w-8">
        <AvatarImage src={contributor.avatar_url || undefined} />
        <AvatarFallback className="text-xs">{getInitials(contributor.full_name)}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-foreground truncate">{contributor.full_name}</div>
        <div className="text-xs text-muted-foreground">
          {t('collaboration.topContributors.contributions', {
            count: contributor.contribution_count,
          })}
        </div>
      </div>
      <Badge variant="secondary" className="hidden sm:inline-flex text-xs">
        {contributor.contribution_count}
      </Badge>
    </div>
  )
}

export default CollaborativeEmptyState
