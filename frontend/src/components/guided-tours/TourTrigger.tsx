/**
 * Tour Trigger Component
 *
 * A component that appears in empty sections to prompt users
 * to start a guided tour. Mobile-first, RTL-compatible.
 */

import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { Sparkles, X, PlayCircle, Clock, ChevronRight, GraduationCap } from 'lucide-react'
import { useTour, useShouldShowTour } from './TourContext'
import { getTour } from './tour-definitions'
import type { TourId } from './types'

export interface TourTriggerProps {
  /** Tour ID to trigger */
  tourId: TourId
  /** Whether the section is empty (triggers tour suggestion) */
  isEmpty: boolean
  /** Optional callback when tour starts */
  onTourStart?: () => void
  /** Variant: 'banner' shows full width, 'inline' is compact */
  variant?: 'banner' | 'inline' | 'card'
  /** Additional CSS classes */
  className?: string
}

/**
 * Tour Trigger Component
 *
 * Displays a prompt when users first encounter an empty section,
 * offering to guide them through creating their first item.
 */
export function TourTrigger({
  tourId,
  isEmpty,
  onTourStart,
  variant = 'banner',
  className,
}: TourTriggerProps) {
  const { t, i18n } = useTranslation('guided-tours')
  const isRTL = i18n.language === 'ar'

  const { startTour, dismissTourPrompt, toursEnabled } = useTour()
  const shouldShow = useShouldShowTour(tourId, isEmpty)
  const [isVisible, setIsVisible] = useState(false)
  const [isDismissing, setIsDismissing] = useState(false)

  const tour = getTour(tourId)

  // Animate in with a slight delay
  useEffect(() => {
    if (shouldShow) {
      const timer = setTimeout(() => setIsVisible(true), 500)
      return () => clearTimeout(timer)
    } else {
      setIsVisible(false)
    }
  }, [shouldShow])

  if (!shouldShow || !tour || !toursEnabled) return null

  const TourIcon = tour.icon || GraduationCap

  const handleStartTour = () => {
    onTourStart?.()
    startTour(tourId)
  }

  const handleDismiss = () => {
    setIsDismissing(true)
    setTimeout(() => {
      dismissTourPrompt(tourId)
    }, 200)
  }

  // Banner variant - full width
  if (variant === 'banner') {
    return (
      <AnimatePresence>
        {isVisible && !isDismissing && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className={cn('w-full mb-4 sm:mb-6', className)}
            dir={isRTL ? 'rtl' : 'ltr'}
          >
            <div
              className={cn(
                'relative overflow-hidden rounded-2xl',
                'bg-gradient-to-r from-primary/10 via-primary/5 to-transparent',
                'border border-primary/20',
                'p-4 sm:p-5',
              )}
            >
              {/* Decorative sparkles */}
              <div className="absolute top-2 end-2 opacity-20">
                <Sparkles className="w-8 h-8 sm:w-10 sm:h-10 text-primary" />
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                {/* Icon */}
                <div className="flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-primary/10 flex-shrink-0">
                  <TourIcon className="w-6 h-6 sm:w-7 sm:h-7 text-primary" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-base sm:text-lg font-semibold text-start mb-1">
                    {t('trigger.title')}
                  </h3>
                  <p className="text-sm text-muted-foreground text-start">{t(tour.description)}</p>
                  {tour.estimatedTime && (
                    <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground/70">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{t('trigger.estimatedTime', { minutes: tour.estimatedTime })}</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Button
                    onClick={handleStartTour}
                    className={cn(
                      'flex-1 sm:flex-none h-10 sm:h-11 px-4 sm:px-5 rounded-xl',
                      'shadow-md hover:shadow-lg',
                      'transition-all duration-150',
                    )}
                  >
                    <PlayCircle className={cn('w-4 h-4', isRTL ? 'ms-2' : 'me-2')} />
                    {t('trigger.startTour')}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleDismiss}
                    className="h-10 w-10 rounded-xl hover:bg-black/5"
                    aria-label={t('trigger.dismiss')}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    )
  }

  // Inline variant - compact
  if (variant === 'inline') {
    return (
      <AnimatePresence>
        {isVisible && !isDismissing && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={cn('inline-flex', className)}
            dir={isRTL ? 'rtl' : 'ltr'}
          >
            <button
              onClick={handleStartTour}
              className={cn(
                'group inline-flex items-center gap-2 px-3 py-1.5',
                'text-sm text-primary hover:text-primary/80',
                'bg-primary/5 hover:bg-primary/10',
                'rounded-full border border-primary/20',
                'transition-all duration-150',
              )}
            >
              <GraduationCap className="w-4 h-4" />
              <span>{t('trigger.takeQuickTour')}</span>
              <ChevronRight
                className={cn(
                  'w-3 h-3 transition-transform group-hover:translate-x-0.5',
                  isRTL && 'rotate-180',
                )}
              />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    )
  }

  // Card variant - standalone card
  return (
    <AnimatePresence>
      {isVisible && !isDismissing && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className={cn('w-full max-w-sm', className)}
          dir={isRTL ? 'rtl' : 'ltr'}
        >
          <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
            <CardContent className="p-4 sm:p-5">
              {/* Close button */}
              <button
                onClick={handleDismiss}
                className="absolute top-3 end-3 p-1 rounded-full hover:bg-black/5 transition-colors"
                aria-label={t('trigger.dismiss')}
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>

              {/* Icon */}
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 mb-3">
                <TourIcon className="w-6 h-6 text-primary" />
              </div>

              {/* Content */}
              <h3 className="text-base font-semibold text-start mb-1">{t('trigger.cardTitle')}</h3>
              <p className="text-sm text-muted-foreground text-start mb-4">{t(tour.description)}</p>

              {/* Estimated time */}
              {tour.estimatedTime && (
                <div className="flex items-center gap-1.5 mb-4 text-xs text-muted-foreground/70">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{t('trigger.estimatedTime', { minutes: tour.estimatedTime })}</span>
                </div>
              )}

              {/* Action */}
              <Button onClick={handleStartTour} className="w-full h-10 rounded-xl shadow-sm">
                <PlayCircle className={cn('w-4 h-4', isRTL ? 'ms-2' : 'me-2')} />
                {t('trigger.startTour')}
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/**
 * Simple hook to use in components that want to show tour trigger
 */
export function useTourTrigger(tourId: TourId, isEmpty: boolean) {
  const shouldShow = useShouldShowTour(tourId, isEmpty)
  const { startTour, dismissTourPrompt } = useTour()
  const tour = getTour(tourId)

  return {
    shouldShow,
    tour,
    startTour: () => startTour(tourId),
    dismiss: () => dismissTourPrompt(tourId),
  }
}
