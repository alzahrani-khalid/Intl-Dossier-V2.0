/**
 * Onboarding Tour Trigger
 *
 * Auto-triggers the onboarding tour for new users.
 * Shows a replay option for users who want to revisit the tour.
 * Mobile-first, RTL-compatible design.
 */

import { useEffect, useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, X, HelpCircle, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useTour } from './TourContext'

// Storage keys
const ONBOARDING_SEEN_KEY = 'intl-dossier-onboarding-seen'
const ONBOARDING_COMPLETED_KEY = 'intl-dossier-onboarding-completed'

interface OnboardingTourTriggerProps {
  /** Delay before auto-showing (ms) - gives page time to render */
  autoStartDelay?: number
  /** Show the replay button for completed users */
  showReplayButton?: boolean
  /** Position of the replay button */
  replayButtonPosition?: 'bottom-right' | 'bottom-left'
  /** Custom class for the trigger */
  className?: string
}

/**
 * Check if onboarding has been seen before
 */
function hasSeenOnboarding(): boolean {
  try {
    return localStorage.getItem(ONBOARDING_SEEN_KEY) === 'true'
  } catch {
    return false
  }
}

/**
 * Mark onboarding as seen
 */
function markOnboardingSeen(): void {
  try {
    localStorage.setItem(ONBOARDING_SEEN_KEY, 'true')
  } catch {
    // Ignore storage errors
  }
}

/**
 * Check if onboarding was completed
 */
function hasCompletedOnboarding(): boolean {
  try {
    return localStorage.getItem(ONBOARDING_COMPLETED_KEY) === 'true'
  } catch {
    return false
  }
}

/**
 * Mark onboarding as completed
 */
function markOnboardingCompleted(): void {
  try {
    localStorage.setItem(ONBOARDING_COMPLETED_KEY, 'true')
  } catch {
    // Ignore storage errors
  }
}

/**
 * Reset onboarding state (for replay)
 */
export function resetOnboardingState(): void {
  try {
    localStorage.removeItem(ONBOARDING_SEEN_KEY)
    localStorage.removeItem(ONBOARDING_COMPLETED_KEY)
  } catch {
    // Ignore storage errors
  }
}

/**
 * OnboardingTourTrigger Component
 *
 * Automatically starts the onboarding tour for first-time users.
 * Provides a replay button for users who have completed the tour.
 */
export function OnboardingTourTrigger({
  autoStartDelay = 800,
  showReplayButton = true,
  replayButtonPosition = 'bottom-right',
  className,
}: OnboardingTourTriggerProps) {
  const { t, i18n } = useTranslation('guided-tours')
  const isRTL = i18n.language === 'ar'

  const { startTour, isActive, progress, toursEnabled, resetTour } = useTour()

  const [showWelcomePrompt, setShowWelcomePrompt] = useState(false)
  const [hasMounted, setHasMounted] = useState(false)

  // Check if user has completed or skipped onboarding
  const onboardingProgress = progress['onboarding']
  const hasCompletedTour = onboardingProgress?.isCompleted || hasCompletedOnboarding()
  const hasSkippedTour = onboardingProgress?.wasSkipped

  // Start tour handler
  const handleStartTour = useCallback(() => {
    setShowWelcomePrompt(false)
    markOnboardingSeen()
    startTour('onboarding')
  }, [startTour])

  // Skip handler
  const handleSkip = useCallback(() => {
    setShowWelcomePrompt(false)
    markOnboardingSeen()
  }, [])

  // Replay handler
  const handleReplay = useCallback(() => {
    resetTour('onboarding')
    startTour('onboarding')
  }, [resetTour, startTour])

  // Auto-start logic for new users
  useEffect(() => {
    setHasMounted(true)

    // Don't show if tours are disabled or a tour is already active
    if (!toursEnabled || isActive) return

    // Don't show if user has already seen onboarding
    if (hasSeenOnboarding()) return

    // Show welcome prompt after delay to let the page render
    const timer = setTimeout(() => {
      setShowWelcomePrompt(true)
    }, autoStartDelay)

    return () => clearTimeout(timer)
  }, [toursEnabled, isActive, autoStartDelay])

  // Mark as completed when tour finishes
  useEffect(() => {
    if (onboardingProgress?.isCompleted) {
      markOnboardingCompleted()
    }
  }, [onboardingProgress?.isCompleted])

  // Don't render on server
  if (!hasMounted) return null

  return (
    <>
      {/* Welcome Prompt Modal for New Users */}
      <AnimatePresence>
        {showWelcomePrompt && !isActive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9998] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={handleSkip}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className={cn(
                'relative w-full max-w-md p-6 sm:p-8',
                'bg-background/95 backdrop-blur-xl',
                'rounded-2xl shadow-2xl border border-border/50',
              )}
              onClick={(e) => e.stopPropagation()}
              dir={isRTL ? 'rtl' : 'ltr'}
            >
              {/* Close button */}
              <button
                onClick={handleSkip}
                className={cn(
                  'absolute top-4 p-2 rounded-full',
                  'text-muted-foreground hover:text-foreground',
                  'hover:bg-muted transition-colors',
                  isRTL ? 'start-4' : 'end-4',
                )}
                aria-label={t('common.closeTour')}
              >
                <X className="h-4 w-4" />
              </button>

              {/* Icon */}
              <div className="flex items-center justify-center w-16 h-16 mx-auto mb-6 rounded-2xl bg-primary/10">
                <HelpCircle className="w-8 h-8 text-primary" />
              </div>

              {/* Title */}
              <h2 className="text-xl sm:text-2xl font-bold text-center mb-3">
                {t('tours.onboarding.welcome.title', 'Welcome to GASTAT Dossier!')}
              </h2>

              {/* Description */}
              <p className="text-center text-muted-foreground mb-6 leading-relaxed">
                {t(
                  'tours.onboarding.welcome.description',
                  "Let's take a quick tour to help you understand how everything is organized around Dossiers - your central hub for managing international relations.",
                )}
              </p>

              {/* Estimated time */}
              <p className="text-center text-sm text-muted-foreground mb-6">
                <span className="inline-flex items-center gap-1.5">
                  <Play className="h-3.5 w-3.5" />
                  {t('trigger.estimatedTime', '~{{minutes}} min', { minutes: 3 })}
                </span>
              </p>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Button variant="outline" className="flex-1 h-11" onClick={handleSkip}>
                  {t('tours.onboarding.welcome.skipButton', 'Skip for now')}
                </Button>
                <Button className="flex-1 h-11" onClick={handleStartTour}>
                  <Play className={cn('h-4 w-4', isRTL ? 'ms-2' : 'me-2')} />
                  {t('tours.onboarding.welcome.startButton', 'Start Tour')}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Replay Button (for users who completed the tour) */}
      {showReplayButton && hasCompletedTour && !isActive && !showWelcomePrompt && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 }}
                onClick={handleReplay}
                className={cn(
                  'fixed z-50',
                  replayButtonPosition === 'bottom-right'
                    ? isRTL
                      ? 'bottom-4 start-4'
                      : 'bottom-4 end-4'
                    : isRTL
                      ? 'bottom-4 end-4'
                      : 'bottom-4 start-4',
                  'flex items-center justify-center',
                  'h-12 w-12 rounded-full',
                  'bg-primary text-primary-foreground',
                  'shadow-lg hover:shadow-xl',
                  'transition-all duration-200',
                  'hover:scale-105 active:scale-95',
                  className,
                )}
                aria-label={t('tours.onboarding.replay', 'Replay onboarding tour')}
              >
                <RefreshCw className="h-5 w-5" />
              </motion.button>
            </TooltipTrigger>
            <TooltipContent
              side={
                replayButtonPosition === 'bottom-right'
                  ? isRTL
                    ? 'right'
                    : 'left'
                  : isRTL
                    ? 'left'
                    : 'right'
              }
            >
              {t('tours.onboarding.replay', 'Replay onboarding tour')}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </>
  )
}

export default OnboardingTourTrigger
