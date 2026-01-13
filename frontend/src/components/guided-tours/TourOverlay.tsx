/**
 * Tour Overlay Component
 *
 * Renders the tour step overlay with spotlight highlighting,
 * step content, navigation, and progress indicators.
 * Mobile-first, RTL-compatible design.
 */

import { useEffect, useState, useRef, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import { ChevronLeft, ChevronRight, X, CheckCircle2, HelpCircle, ArrowRight } from 'lucide-react'
import { useTour } from './TourContext'
import type { TourStep, TourStepPlacement } from './types'

interface TargetRect {
  top: number
  left: number
  width: number
  height: number
}

/**
 * Calculate tooltip position based on target element and placement
 */
function getTooltipPosition(
  targetRect: TargetRect | null,
  placement: TourStepPlacement,
  tooltipRef: React.RefObject<HTMLDivElement | null>,
  isRTL: boolean,
): React.CSSProperties {
  if (!targetRect || placement === 'center') {
    // Center in viewport
    return {
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
    }
  }

  const spacing = 16 // Gap between target and tooltip
  const tooltipHeight = tooltipRef.current?.offsetHeight || 300
  const tooltipWidth = tooltipRef.current?.offsetWidth || 400

  // Handle RTL by swapping left/right placements
  let effectivePlacement = placement
  if (isRTL) {
    if (placement === 'left' || placement === 'top-start' || placement === 'bottom-start') {
      effectivePlacement = placement
        .replace('left', 'right')
        .replace('start', 'end') as TourStepPlacement
    } else if (placement === 'right' || placement === 'top-end' || placement === 'bottom-end') {
      effectivePlacement = placement
        .replace('right', 'left')
        .replace('end', 'start') as TourStepPlacement
    }
  }

  switch (effectivePlacement) {
    case 'top':
      return {
        position: 'fixed',
        top: Math.max(spacing, targetRect.top - tooltipHeight - spacing),
        left: targetRect.left + targetRect.width / 2,
        transform: 'translateX(-50%)',
      }
    case 'top-start':
      return {
        position: 'fixed',
        top: Math.max(spacing, targetRect.top - tooltipHeight - spacing),
        left: Math.max(spacing, targetRect.left),
      }
    case 'top-end':
      return {
        position: 'fixed',
        top: Math.max(spacing, targetRect.top - tooltipHeight - spacing),
        right: Math.max(spacing, window.innerWidth - targetRect.left - targetRect.width),
      }
    case 'bottom':
      return {
        position: 'fixed',
        top: Math.min(
          window.innerHeight - tooltipHeight - spacing,
          targetRect.top + targetRect.height + spacing,
        ),
        left: targetRect.left + targetRect.width / 2,
        transform: 'translateX(-50%)',
      }
    case 'bottom-start':
      return {
        position: 'fixed',
        top: Math.min(
          window.innerHeight - tooltipHeight - spacing,
          targetRect.top + targetRect.height + spacing,
        ),
        left: Math.max(spacing, targetRect.left),
      }
    case 'bottom-end':
      return {
        position: 'fixed',
        top: Math.min(
          window.innerHeight - tooltipHeight - spacing,
          targetRect.top + targetRect.height + spacing,
        ),
        right: Math.max(spacing, window.innerWidth - targetRect.left - targetRect.width),
      }
    case 'left':
      return {
        position: 'fixed',
        top: targetRect.top + targetRect.height / 2,
        left: Math.max(spacing, targetRect.left - tooltipWidth - spacing),
        transform: 'translateY(-50%)',
      }
    case 'right':
      return {
        position: 'fixed',
        top: targetRect.top + targetRect.height / 2,
        left: Math.min(
          window.innerWidth - tooltipWidth - spacing,
          targetRect.left + targetRect.width + spacing,
        ),
        transform: 'translateY(-50%)',
      }
    default:
      return {
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
      }
  }
}

/**
 * Tour Overlay Component
 */
export function TourOverlay() {
  const { t, i18n } = useTranslation('guided-tours')
  const isRTL = i18n.language === 'ar'

  const { activeTour, currentStepIndex, isActive, nextStep, prevStep, skipTour, completeTour } =
    useTour()

  const [targetRect, setTargetRect] = useState<TargetRect | null>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)

  const currentStep = activeTour?.steps[currentStepIndex]
  const isFirstStep = currentStepIndex === 0
  const isLastStep = currentStepIndex === (activeTour?.steps.length || 0) - 1
  const progress = activeTour ? ((currentStepIndex + 1) / activeTour.steps.length) * 100 : 0

  // Find and track target element
  const updateTargetRect = useCallback(() => {
    if (!currentStep?.target) {
      setTargetRect(null)
      return
    }

    const targetElement = document.querySelector(currentStep.target)
    if (targetElement) {
      const rect = targetElement.getBoundingClientRect()
      setTargetRect({
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
      })
    } else {
      setTargetRect(null)
    }
  }, [currentStep?.target])

  // Update target rect on step change and window resize
  useEffect(() => {
    updateTargetRect()

    const handleResize = () => updateTargetRect()
    const handleScroll = () => updateTargetRect()

    window.addEventListener('resize', handleResize)
    window.addEventListener('scroll', handleScroll, true)

    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('scroll', handleScroll, true)
    }
  }, [updateTargetRect, currentStepIndex])

  // Call step onShow callback
  useEffect(() => {
    currentStep?.onShow?.()
  }, [currentStep])

  // Handle keyboard navigation
  useEffect(() => {
    if (!isActive) return

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          skipTour()
          break
        case 'ArrowRight':
          if (!isLastStep) nextStep()
          break
        case 'ArrowLeft':
          if (!isFirstStep) prevStep()
          break
        case 'Enter':
          if (isLastStep) completeTour()
          else nextStep()
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isActive, isFirstStep, isLastStep, nextStep, prevStep, skipTour, completeTour])

  if (!isActive || !activeTour || !currentStep) return null

  const StepIcon = currentStep.icon
  const tooltipStyle = getTooltipPosition(
    targetRect,
    currentStep.placement || 'center',
    tooltipRef,
    isRTL,
  )

  const handleNext = () => {
    currentStep.onComplete?.()
    if (isLastStep) {
      completeTour()
    } else {
      nextStep()
    }
  }

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-[9999]"
        role="dialog"
        aria-modal="true"
        aria-label={t('common.tourDialog')}
      >
        {/* Backdrop with spotlight cutout */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="absolute inset-0"
          onClick={currentStep.disableBackdropClick ? undefined : skipTour}
        >
          {/* Dark overlay */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" />

          {/* Spotlight cutout for target element */}
          {targetRect && currentStep.highlightTarget && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute"
              style={{
                top: targetRect.top - 8,
                left: targetRect.left - 8,
                width: targetRect.width + 16,
                height: targetRect.height + 16,
                boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.6)',
                borderRadius: '12px',
                backgroundColor: 'transparent',
              }}
            />
          )}
        </motion.div>

        {/* Tooltip Card */}
        <motion.div
          ref={tooltipRef}
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          style={tooltipStyle}
          className="z-10"
          dir={isRTL ? 'rtl' : 'ltr'}
        >
          <Card
            className={cn(
              'w-[calc(100vw-2rem)] sm:w-[400px] max-w-md',
              'bg-white/95 backdrop-blur-xl border-white/20',
              'shadow-[0_20px_50px_rgba(0,0,0,0.3)]',
              'rounded-2xl overflow-hidden',
            )}
          >
            <CardContent className="p-0">
              {/* Header with progress */}
              <div className="px-4 sm:px-6 pt-4 sm:pt-5 pb-3">
                {/* Progress bar */}
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <span className="text-xs sm:text-sm font-medium text-muted-foreground">
                    {t('common.stepOf', {
                      current: currentStepIndex + 1,
                      total: activeTour.steps.length,
                    })}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={skipTour}
                    className="h-8 w-8 p-0 rounded-full hover:bg-black/5"
                    aria-label={t('common.closeTour')}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <Progress value={progress} className="h-1 sm:h-1.5" />
              </div>

              {/* Content */}
              <div className="px-4 sm:px-6 py-3 sm:py-4">
                {/* Icon */}
                {StepIcon && (
                  <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary/10 mb-3 sm:mb-4 mx-auto">
                    <StepIcon className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                  </div>
                )}

                {/* Title */}
                <h3 className="text-base sm:text-lg font-semibold text-center mb-2">
                  {t(currentStep.title)}
                </h3>

                {/* Content */}
                <p className="text-sm sm:text-base text-muted-foreground text-center mb-3 sm:mb-4 leading-relaxed">
                  {t(currentStep.content)}
                </p>

                {/* Hint */}
                {currentStep.hint && (
                  <div className="flex items-start gap-2 p-2.5 sm:p-3 rounded-xl bg-amber-50 border border-amber-100 mb-3 sm:mb-4">
                    <HelpCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                    <p className="text-xs sm:text-sm text-amber-800 text-start">
                      {t(currentStep.hint)}
                    </p>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="px-4 sm:px-6 pb-4 sm:pb-5 pt-2 border-t border-black/5 bg-black/[0.02]">
                <div className="flex items-center justify-between gap-2 sm:gap-3">
                  {/* Back button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={prevStep}
                    disabled={isFirstStep}
                    className={cn(
                      'h-10 sm:h-11 px-3 sm:px-4 rounded-xl',
                      'disabled:opacity-30',
                      'transition-all duration-150',
                    )}
                  >
                    <ChevronLeft
                      className={cn('h-4 w-4', isRTL ? 'ms-1' : 'me-1', isRTL && 'rotate-180')}
                    />
                    <span className="hidden sm:inline">{t('common.back')}</span>
                  </Button>

                  {/* Skip link */}
                  <button
                    onClick={skipTour}
                    className="text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors underline-offset-4 hover:underline"
                  >
                    {t('common.skipTour')}
                  </button>

                  {/* Next/Complete button */}
                  <Button
                    onClick={handleNext}
                    className={cn(
                      'h-10 sm:h-11 px-4 sm:px-6 rounded-xl',
                      'shadow-md hover:shadow-lg',
                      'transition-all duration-150',
                    )}
                  >
                    {isLastStep ? (
                      <>
                        {currentStep.actionText ? (
                          t(currentStep.actionText)
                        ) : (
                          <>
                            <CheckCircle2 className={cn('h-4 w-4', isRTL ? 'ms-1' : 'me-1')} />
                            <span className="hidden sm:inline">{t('common.complete')}</span>
                            <span className="sm:hidden">{t('common.done')}</span>
                          </>
                        )}
                      </>
                    ) : (
                      <>
                        <span>{t('common.next')}</span>
                        <ChevronRight
                          className={cn('h-4 w-4', isRTL ? 'me-1' : 'ms-1', isRTL && 'rotate-180')}
                        />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Target highlight ring (optional visual enhancement) */}
        {targetRect && currentStep.highlightTarget && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="fixed pointer-events-none z-[9998]"
            style={{
              top: targetRect.top - 4,
              left: targetRect.left - 4,
              width: targetRect.width + 8,
              height: targetRect.height + 8,
            }}
          >
            <div className="absolute inset-0 rounded-lg border-2 border-primary animate-pulse" />
          </motion.div>
        )}
      </div>
    </AnimatePresence>
  )
}
