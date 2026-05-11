/**
 * EngagementStageGroup — Collapsible engagement stage section
 * Phase 10: Operations Hub Dashboard
 *
 * Renders a single lifecycle stage as a collapsible section with
 * count badge and engagement list. Uses shadcn Collapsible component.
 */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from '@tanstack/react-router'
import { ChevronDown } from 'lucide-react'
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { LIFECYCLE_STAGE_LABELS } from '@/types/lifecycle.types'
import type { LifecycleStage } from '@/types/lifecycle.types'
import type { StageEngagement } from '@/domains/operations-hub/types/operations-hub.types'

// ============================================================================
// Constants
// ============================================================================

const MAX_VISIBLE_ENGAGEMENTS = 5

// ============================================================================
// Component
// ============================================================================

interface EngagementStageGroupProps {
  stage: LifecycleStage
  engagements: StageEngagement[]
  count: number
}

export function EngagementStageGroup({
  stage,
  engagements,
  count,
}: EngagementStageGroupProps): React.ReactElement {
  const { t, i18n } = useTranslation('operations-hub')
  const navigate = useNavigate()
  const [isOpen, setIsOpen] = useState(false)
  const [showAll, setShowAll] = useState(false)
  const isRTL = i18n.language === 'ar'

  const stageLabel = LIFECYCLE_STAGE_LABELS[stage][isRTL ? 'ar' : 'en']
  const visibleEngagements = showAll ? engagements : engagements.slice(0, MAX_VISIBLE_ENGAGEMENTS)
  const hasMore = count > MAX_VISIBLE_ENGAGEMENTS
  const contentId = `stage-content-${stage}`

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <button
          className="flex items-center gap-3 w-full min-h-11 min-w-11 p-3 rounded-[var(--radius-sm)] hover:bg-muted/50 transition-colors cursor-pointer"
          aria-expanded={isOpen}
          aria-controls={contentId}
        >
          <span className="text-sm font-semibold flex-1 text-start">{stageLabel}</span>
          <Badge variant="secondary" className="text-sm font-semibold shrink-0">
            {count}
          </Badge>
          <ChevronDown
            className={cn(
              'text-muted-foreground shrink-0 transition-transform duration-200',
              // .icon-flip handles the RTL mirror via CSS scaleX(-1) (gated on
              // html[dir='rtl']). The rotate-180 below is the disclosure
              // semantic (open vs closed) and composes with .icon-flip.
              'icon-flip',
              isOpen && 'rotate-180',
            )}
            size={16}
          />
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent id={contentId}>
        <div className="ps-3 space-y-1 pt-1">
          {visibleEngagements.map((engagement) => {
            const engName =
              isRTL && engagement.name_ar != null && engagement.name_ar !== ''
                ? engagement.name_ar
                : engagement.name_en

            return (
              <div
                key={engagement.id}
                className="flex items-center gap-2 p-2 rounded-[var(--radius-sm)] hover:bg-muted/50 cursor-pointer min-h-11 transition-colors"
                role="button"
                tabIndex={0}
                onClick={(): void => {
                  void navigate({
                    to: '/engagements/$engagementId',
                    params: { engagementId: engagement.id },
                  })
                }}
                onKeyDown={(e: React.KeyboardEvent): void => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    void navigate({
                      to: '/engagements/$engagementId',
                      params: { engagementId: engagement.id },
                    })
                  }
                }}
                aria-label={engName}
              >
                <span className="text-sm font-normal flex-1 truncate">{engName}</span>
                <Badge variant="outline" className="text-xs shrink-0">
                  {engagement.engagement_type}
                </Badge>
              </div>
            )
          })}
          {hasMore && (
            <Button
              variant="link"
              size="sm"
              className="text-sm font-semibold px-0 mt-1"
              onClick={(): void => setShowAll((prev) => !prev)}
            >
              {showAll
                ? t('zones.engagements.show_less', { defaultValue: 'Show less' })
                : t('zones.engagements.show_all')}
            </Button>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}
