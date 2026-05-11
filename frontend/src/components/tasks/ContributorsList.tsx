import { useTranslation } from 'react-i18next'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'
import type { Database } from '../../../../backend/src/types/database.types'

type TaskContributor = Database['public']['Tables']['task_contributors']['Row']

interface ContributorsListProps {
  contributors: TaskContributor[]
  onRemove?: (contributorId: string) => void
  maxDisplay?: number
  showRemoveButton?: boolean
  className?: string
}

/**
 * Displays a list of task contributors with avatars and roles
 * Follows mobile-first responsive design and RTL compatibility
 *
 * @example
 * <ContributorsList
 * contributors={contributors}
 * onRemove={handleRemove}
 * maxDisplay={3}
 * showRemoveButton={isTaskOwner}
 * />
 */
export function ContributorsList({
  contributors,
  onRemove,
  maxDisplay = 3,
  showRemoveButton = false,
  className = '',
}: ContributorsListProps) {
  const { t } = useTranslation()
  // Filter out removed contributors
  const activeContributors = contributors.filter((c) => !c.removed_at)

  // Split contributors into displayed and overflow
  const displayedContributors = activeContributors.slice(0, maxDisplay)
  const overflowCount = Math.max(0, activeContributors.length - maxDisplay)

  if (activeContributors.length === 0) {
    return (
      <div className="text-sm text-muted-foreground text-start">
        {t('tasks.noContributors', 'No contributors yet')}
      </div>
    )
  }

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {displayedContributors.map((contributor) => (
        <div key={contributor.id} className="flex items-center gap-2 rounded-lg border p-2 ">
          {/* Avatar */}
          <Avatar className="size-8 sm:size-10">
            <AvatarImage src={`/avatars/${contributor.user_id}.png`} />
            <AvatarFallback className="text-xs sm:text-sm">
              {getInitials(contributor.user_id)}
            </AvatarFallback>
          </Avatar>

          {/* Role badge */}
          <Badge variant="secondary" className="text-xs sm:text-sm capitalize px-2 py-1">
            {t(`tasks.contributorRole.${contributor.role}`, contributor.role)}
          </Badge>

          {/* Remove button (only if allowed) */}
          {showRemoveButton && onRemove && (
            <Button
              variant="ghost"
              size="icon"
              className="size-8 ms-auto"
              onClick={() => onRemove(contributor.id)}
              aria-label={t('tasks.removeContributor', 'Remove contributor')}
            >
              <X className="size-4" />
            </Button>
          )}

          {/* Notes tooltip (if exists) */}
          {contributor.notes && (
            <span
              className="text-xs text-muted-foreground italic truncate max-w-[120px] sm:max-w-[200px]"
              title={contributor.notes}
            >
              {contributor.notes}
            </span>
          )}
        </div>
      ))}

      {/* Overflow indicator */}
      {overflowCount > 0 && (
        <div className="flex items-center justify-center size-8 sm:size-10 rounded-full border bg-muted text-xs sm:text-sm font-medium">
          +{overflowCount}
        </div>
      )}
    </div>
  )
}

/**
 * Get user initials from user_id for fallback avatar
 * This is a placeholder - in production, fetch actual user names
 */
function getInitials(userId: string): string {
  // Extract first 2 characters of UUID as placeholder
  return userId.substring(0, 2).toUpperCase()
}
