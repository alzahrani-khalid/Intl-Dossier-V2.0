/**
 * ActivityFeedItem — Individual activity feed entry
 * Phase 10: Operations Hub Dashboard
 *
 * Renders actor name, action, clickable entity name,
 * and relative timestamp.
 */

import { useTranslation } from 'react-i18next'
import { useNavigate } from '@tanstack/react-router'
import { formatDistanceToNow, parseISO } from 'date-fns'
import { ar, enUS } from 'date-fns/locale'
import { LtrIsolate } from '@/components/ui/ltr-isolate'
import type { ActivityItemData } from '@/domains/operations-hub/types/operations-hub.types'

// ============================================================================
// Entity Route Helper
// ============================================================================

function getEntityRoute(entityType: string, entityId: string): string {
  switch (entityType) {
    case 'task':
    case 'commitment':
      return `/tasks/${entityId}`
    case 'intake':
      return `/intake/${entityId}`
    case 'engagement':
      return `/engagements/${entityId}`
    default:
      return `/tasks/${entityId}`
  }
}

// ============================================================================
// Component
// ============================================================================

interface ActivityFeedItemProps {
  item: ActivityItemData
}

export function ActivityFeedItem({ item }: ActivityFeedItemProps): React.ReactElement {
  const { i18n } = useTranslation('operations-hub')
  const navigate = useNavigate()
  const isArabic = i18n.language === 'ar'

  const entityName =
    isArabic && item.entity_name_ar != null && item.entity_name_ar !== ''
      ? item.entity_name_ar
      : item.entity_name_en

  const relativeTime = formatDistanceToNow(parseISO(item.created_at), {
    addSuffix: true,
    locale: isArabic ? ar : enUS,
  })

  const handleEntityClick = (): void => {
    void navigate({ to: getEntityRoute(item.entity_type, item.entity_id) })
  }

  const handleEntityKeyDown = (e: React.KeyboardEvent): void => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleEntityClick()
    }
  }

  return (
    <div className="flex items-start gap-3 py-2">
      <div className="flex-1 min-w-0">
        <p className="text-sm">
          <span className="font-semibold">{item.actor_name}</span>{' '}
          <span className="text-muted-foreground">{item.action_type}</span>{' '}
          <span
            className="font-semibold text-primary cursor-pointer hover:underline"
            role="link"
            tabIndex={0}
            onClick={handleEntityClick}
            onKeyDown={handleEntityKeyDown}
          >
            {entityName}
          </span>
        </p>
        <LtrIsolate className="inline">
          <span className="text-xs text-muted-foreground">{relativeTime}</span>
        </LtrIsolate>
      </div>
    </div>
  )
}
