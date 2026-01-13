/**
 * OnboardingEmptyState Component
 *
 * Combines empty state messaging with onboarding checklist for
 * a contextual first-time user experience. Mobile-first, RTL-compatible.
 */

import { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Rocket,
  ChevronDown,
  ChevronUp,
  FolderOpen,
  GitBranch,
  Bell,
  Calendar,
  FileText,
  Users,
  Building2,
  Globe,
  MessageSquare,
  Briefcase,
  FileSignature,
  FileCheck,
  LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { OnboardingChecklist } from './OnboardingChecklist'
import { MilestonesCelebration } from './MilestonesCelebration'
import { useOnboardingChecklist } from '@/hooks/useOnboardingChecklist'
import type { OnboardingEmptyStateProps, OnboardingEntityType } from '@/types/onboarding.types'

// Icon mapping for entity types
const entityIcons: Record<OnboardingEntityType, LucideIcon> = {
  dossier: FolderOpen,
  engagement: Calendar,
  commitment: Briefcase,
  document: FileText,
  relationship: GitBranch,
  notification: Bell,
  brief: FileCheck,
  position: FileSignature,
  mou: FileSignature,
  person: Users,
  forum: MessageSquare,
  working_group: Building2,
  calendar_event: Calendar,
}

// Default messages for entity types
const entityDefaults: Record<OnboardingEntityType, { titleKey: string; descriptionKey: string }> = {
  dossier: {
    titleKey: 'empty-states:list.dossier.firstTitle',
    descriptionKey: 'empty-states:list.dossier.firstDescription',
  },
  engagement: {
    titleKey: 'empty-states:list.engagement.firstTitle',
    descriptionKey: 'empty-states:list.engagement.firstDescription',
  },
  commitment: {
    titleKey: 'empty-states:list.commitment.firstTitle',
    descriptionKey: 'empty-states:list.commitment.firstDescription',
  },
  document: {
    titleKey: 'empty-states:list.document.firstTitle',
    descriptionKey: 'empty-states:list.document.firstDescription',
  },
  relationship: {
    titleKey: 'empty-states:list.relationship.firstTitle',
    descriptionKey: 'empty-states:list.relationship.firstDescription',
  },
  notification: {
    titleKey: 'notification-center:empty.title',
    descriptionKey: 'notification-center:empty.description',
  },
  brief: {
    titleKey: 'empty-states:list.brief.firstTitle',
    descriptionKey: 'empty-states:list.brief.firstDescription',
  },
  position: {
    titleKey: 'empty-states:list.position.firstTitle',
    descriptionKey: 'empty-states:list.position.firstDescription',
  },
  mou: {
    titleKey: 'empty-states:list.mou.firstTitle',
    descriptionKey: 'empty-states:list.mou.firstDescription',
  },
  person: {
    titleKey: 'empty-states:list.person.firstTitle',
    descriptionKey: 'empty-states:list.person.firstDescription',
  },
  forum: {
    titleKey: 'empty-states:list.forum.firstTitle',
    descriptionKey: 'empty-states:list.forum.firstDescription',
  },
  working_group: {
    titleKey: 'working-groups:empty.title',
    descriptionKey: 'working-groups:empty.description',
  },
  calendar_event: {
    titleKey: 'empty-states:list.event.firstTitle',
    descriptionKey: 'empty-states:list.event.firstDescription',
  },
}

/**
 * OnboardingEmptyState component
 *
 * Displays a contextual empty state with an integrated onboarding checklist
 * that guides users through essential setup steps for their role.
 */
export function OnboardingEmptyState({
  entityType,
  showChecklist = true,
  checklistVariant = 'compact',
  onCreate,
  className,
}: OnboardingEmptyStateProps) {
  const { t, i18n } = useTranslation('onboarding')
  const isRTL = i18n.language === 'ar'

  const {
    checklist,
    isLoading,
    isDismissed,
    isFullyCompleted,
    completionPercentage,
    activeCelebration,
    markCelebrationShown,
    dismissOnboarding,
    resumeOnboarding,
  } = useOnboardingChecklist()

  const [showChecklistExpanded, setShowChecklistExpanded] = useState(true)

  const Icon = entityIcons[entityType] || FolderOpen
  const defaults = entityDefaults[entityType] || entityDefaults.dossier

  // Handle celebration completion
  const handleCelebrationComplete = useCallback(async () => {
    if (activeCelebration) {
      await markCelebrationShown(activeCelebration.percentage)
    }
  }, [activeCelebration, markCelebrationShown])

  // Get relevant checklist items for this entity type
  const relevantItems = checklist?.items.filter((item) => item.entityType === entityType)
  const hasRelevantItems = relevantItems && relevantItems.length > 0

  // Should we show the onboarding section?
  const shouldShowOnboarding = showChecklist && !isFullyCompleted && !isDismissed && !isLoading

  return (
    <div
      className={cn('w-full', className)}
      dir={isRTL ? 'rtl' : 'ltr'}
      data-testid="onboarding-empty-state"
    >
      {/* Milestone celebration overlay */}
      {activeCelebration && (
        <MilestonesCelebration
          celebration={activeCelebration}
          onComplete={handleCelebrationComplete}
          autoDismiss
        />
      )}

      {/* Main empty state content */}
      <div className="flex flex-col items-center justify-center text-center py-8 sm:py-12 px-4">
        {/* Icon */}
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 sm:mb-6">
          <Icon className="w-8 h-8 sm:w-10 sm:h-10 text-primary" />
        </div>

        {/* Title and description */}
        <h2 className="text-lg sm:text-xl md:text-2xl font-semibold mb-2 sm:mb-3">
          {t(defaults.titleKey)}
        </h2>
        <p className="text-sm sm:text-base text-muted-foreground max-w-md mb-6 sm:mb-8">
          {t(defaults.descriptionKey)}
        </p>

        {/* Primary action */}
        {onCreate && (
          <Button onClick={onCreate} size="lg" className="min-h-11 px-6 sm:px-8 mb-6">
            <Icon className={cn('w-4 h-4 sm:w-5 sm:h-5', isRTL ? 'ms-2' : 'me-2')} />
            {t(`empty-states:list.${entityType}.createFirst`, {
              defaultValue: t('empty-states:list.generic.createFirst'),
            })}
          </Button>
        )}

        {/* Onboarding section */}
        {shouldShowOnboarding && (
          <Card className="w-full max-w-lg mt-4 sm:mt-6">
            <CardContent className="p-4 sm:p-6">
              {/* Header with toggle */}
              <button
                onClick={() => setShowChecklistExpanded(!showChecklistExpanded)}
                className="flex items-center justify-between w-full text-start"
              >
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Rocket className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-semibold">{t('emptyState.title')}</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      {completionPercentage}% {t('checklist.completed').toLowerCase()}
                    </p>
                  </div>
                </div>
                {showChecklistExpanded ? (
                  <ChevronUp className="w-5 h-5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-muted-foreground" />
                )}
              </button>

              {/* Collapsible checklist */}
              <AnimatePresence>
                {showChecklistExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="pt-4 sm:pt-6 border-t mt-4">
                      <OnboardingChecklist
                        variant={checklistVariant}
                        showProgress
                        showEstimatedTime
                        allowSkip
                        allowDismiss={false}
                        maxItems={5}
                      />
                    </div>

                    {/* Dismiss option */}
                    <div className="flex justify-center pt-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={dismissOnboarding}
                        className="text-xs text-muted-foreground"
                      >
                        {t('emptyState.laterButton')}
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        )}

        {/* Show resume button if dismissed */}
        {isDismissed && showChecklist && (
          <Button variant="outline" size="sm" onClick={resumeOnboarding} className="mt-4">
            <Rocket className={cn('w-4 h-4', isRTL ? 'ms-2' : 'me-2')} />
            {t('emptyState.showChecklistButton')}
          </Button>
        )}
      </div>
    </div>
  )
}

export default OnboardingEmptyState
