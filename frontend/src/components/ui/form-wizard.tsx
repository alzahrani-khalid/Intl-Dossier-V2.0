/**
 * FormWizard Component
 *
 * A reusable multi-step form wizard with progress indicator, draft saving,
 * and conditional field visibility support.
 *
 * Features:
 * - Mobile-first responsive design
 * - RTL support via logical properties
 * - Local storage draft persistence
 * - Animated step transitions (Framer Motion)
 * - Step validation before progression
 * - Conditional field rendering based on previous selections
 * - Touch-friendly UI (44x44px min targets)
 * - Accessibility compliant (WCAG AA)
 */

import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, ChevronLeft, ChevronRight, Save, Loader2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

// Types
export interface WizardStep {
  id: string
  title: string
  titleAr?: string
  description?: string
  descriptionAr?: string
  icon?: React.ComponentType<{ className?: string }>
  isOptional?: boolean
  validate?: () => boolean | Promise<boolean>
}

export interface FormWizardProps {
  steps: WizardStep[]
  children: React.ReactNode
  currentStep: number
  onStepChange: (step: number) => void
  onComplete: () => void | Promise<void>
  onCancel?: () => void
  onSaveDraft?: () => void
  isLoading?: boolean
  isDraftSaving?: boolean
  hasDraft?: boolean
  canComplete?: boolean
  className?: string
  showProgress?: boolean
  showStepNumbers?: boolean
  allowStepNavigation?: boolean
  completeButtonText?: string
  completeButtonTextAr?: string
  namespace?: string
  /**
   * Controls navigation button positioning:
   * - 'inline': Buttons flow with content (default, legacy behavior)
   * - 'sticky': Buttons fixed at bottom on mobile for thumb-zone accessibility
   * - 'auto': Sticky on mobile (<640px), inline on desktop
   * @default 'inline'
   */
  actionBarMode?: 'inline' | 'sticky' | 'auto'
}

export interface FormWizardStepProps {
  stepId: string
  children: React.ReactNode
  className?: string
}

// Context for wizard state
interface WizardContextValue {
  currentStep: number
  totalSteps: number
  isRTL: boolean
  goNext: () => void
  goBack: () => void
  goToStep: (step: number) => void
}

const WizardContext = React.createContext<WizardContextValue | null>(null)

export function useWizardContext() {
  const context = React.useContext(WizardContext)
  if (!context) {
    throw new Error('useWizardContext must be used within a FormWizard')
  }
  return context
}

// Step indicator component
function StepIndicator({
  step,
  index,
  currentIndex,
  isRTL,
  onClick,
  allowNavigation,
}: {
  step: WizardStep
  index: number
  currentIndex: number
  isRTL: boolean
  onClick: () => void
  allowNavigation: boolean
}) {
  const { t } = useTranslation('form-wizard')
  const isActive = index === currentIndex
  const isCompleted = index < currentIndex
  const canNavigate = allowNavigation && (isCompleted || isActive)

  const Icon = step.icon

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!canNavigate}
      className={cn(
        'flex items-center gap-2 px-2 sm:px-3 py-2 rounded-lg text-xs sm:text-sm whitespace-nowrap min-h-11 transition-all flex-1 justify-center',
        isActive && 'bg-primary text-primary-foreground shadow-md',
        isCompleted && 'bg-primary/10 text-primary hover:bg-primary/20',
        !isActive && !isCompleted && 'bg-muted text-muted-foreground',
        canNavigate && !isActive && 'cursor-pointer',
        !canNavigate && !isActive && 'cursor-not-allowed opacity-60',
      )}
      aria-current={isActive ? 'step' : undefined}
      aria-label={t('step', {
        number: index + 1,
        title: isRTL && step.titleAr ? step.titleAr : step.title,
      })}
    >
      <span
        className={cn(
          'w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium shrink-0',
          isActive && 'bg-primary-foreground text-primary',
          isCompleted && 'bg-primary text-primary-foreground',
          !isActive && !isCompleted && 'bg-muted-foreground/20',
        )}
      >
        {isCompleted ? (
          <Check className="h-3 w-3" />
        ) : Icon ? (
          <Icon className="h-3 w-3" />
        ) : (
          index + 1
        )}
      </span>
      <span className="hidden sm:inline truncate">
        {isRTL && step.titleAr ? step.titleAr : step.title}
      </span>
    </button>
  )
}

// Main FormWizard component
export function FormWizard({
  steps,
  children,
  currentStep,
  onStepChange,
  onComplete,
  onCancel,
  onSaveDraft,
  isLoading = false,
  isDraftSaving = false,
  hasDraft = false,
  canComplete = true,
  className,
  showProgress = true,
  showStepNumbers = true,
  allowStepNavigation = true,
  completeButtonText = 'Complete',
  completeButtonTextAr = 'إتمام',
  namespace = 'form-wizard',
  actionBarMode = 'inline',
}: FormWizardProps) {
  const { t, i18n } = useTranslation(namespace)
  const isRTL = i18n.language === 'ar'

  const [isValidating, setIsValidating] = React.useState(false)

  const totalSteps = steps.length
  const isFirstStep = currentStep === 0
  const isLastStep = currentStep === totalSteps - 1
  const progressPercent = ((currentStep + 1) / totalSteps) * 100

  const goNext = React.useCallback(async () => {
    if (isLastStep) return

    const currentStepConfig = steps[currentStep]
    if (currentStepConfig?.validate) {
      setIsValidating(true)
      try {
        const isValid = await currentStepConfig.validate()
        if (!isValid) {
          setIsValidating(false)
          return
        }
      } catch (error) {
        setIsValidating(false)
        return
      }
      setIsValidating(false)
    }

    onStepChange(currentStep + 1)
  }, [currentStep, isLastStep, onStepChange, steps])

  const goBack = React.useCallback(() => {
    if (isFirstStep) return
    onStepChange(currentStep - 1)
  }, [currentStep, isFirstStep, onStepChange])

  const goToStep = React.useCallback(
    (step: number) => {
      if (step < 0 || step >= totalSteps) return
      if (step > currentStep && !allowStepNavigation) return
      onStepChange(step)
    },
    [currentStep, totalSteps, allowStepNavigation, onStepChange],
  )

  const contextValue = React.useMemo(
    () => ({
      currentStep,
      totalSteps,
      isRTL,
      goNext,
      goBack,
      goToStep,
    }),
    [currentStep, totalSteps, isRTL, goNext, goBack, goToStep],
  )

  return (
    <WizardContext.Provider value={contextValue}>
      <div className={cn('space-y-6', className)} dir={isRTL ? 'rtl' : 'ltr'}>
        {/* Progress bar */}
        {showProgress && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs sm:text-sm text-muted-foreground">
              <span>{t('stepOf', { current: currentStep + 1, total: totalSteps })}</span>
              <span>{Math.round(progressPercent)}%</span>
            </div>
            <Progress value={progressPercent} className="h-2" />
          </div>
        )}

        {/* Step indicators */}
        {showStepNumbers && (
          <div className="flex items-center justify-between gap-1 sm:gap-2 overflow-x-auto pb-2 -mx-1 px-1">
            {steps.map((step, index) => (
              <React.Fragment key={step.id}>
                <StepIndicator
                  step={step}
                  index={index}
                  currentIndex={currentStep}
                  isRTL={isRTL}
                  onClick={() => goToStep(index)}
                  allowNavigation={allowStepNavigation}
                />
                {index < steps.length - 1 && (
                  <div className="hidden sm:block h-px w-4 lg:w-8 bg-border shrink-0" />
                )}
              </React.Fragment>
            ))}
          </div>
        )}

        {/* Current step description */}
        {steps[currentStep] && (
          <div className="text-center sm:text-start">
            <h2 className="text-lg sm:text-xl font-semibold">
              {isRTL && steps[currentStep].titleAr
                ? steps[currentStep].titleAr
                : steps[currentStep].title}
            </h2>
            {(steps[currentStep].description || steps[currentStep].descriptionAr) && (
              <p className="text-sm text-muted-foreground mt-1">
                {isRTL && steps[currentStep].descriptionAr
                  ? steps[currentStep].descriptionAr
                  : steps[currentStep].description}
              </p>
            )}
          </div>
        )}

        {/* Draft indicator */}
        {hasDraft && (
          <div className="flex items-center gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-sm">
            <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
            <span className="text-amber-700 dark:text-amber-400">{t('draftRestored')}</span>
          </div>
        )}

        {/* Step content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: isRTL ? -20 : 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: isRTL ? 20 : -20 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="min-h-[200px]"
          >
            {children}
          </motion.div>
        </AnimatePresence>

        {/* Spacer for sticky action bar mode */}
        {actionBarMode !== 'inline' && <div className="h-24 sm:h-0" aria-hidden="true" />}

        {/* Navigation buttons */}
        <div
          className={cn(
            'flex flex-col-reverse sm:flex-row justify-between gap-3 pt-4 border-t',
            // Sticky positioning for mobile thumb-zone accessibility
            actionBarMode === 'sticky' && [
              'fixed bottom-0 inset-x-0 z-40 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:pb-4',
              'bg-background/95 backdrop-blur-sm supports-[backdrop-filter]:bg-background/80',
            ],
            actionBarMode === 'auto' && [
              'fixed bottom-0 inset-x-0 z-40 px-4 pb-[max(1rem,env(safe-area-inset-bottom))]',
              'sm:relative sm:inset-auto sm:px-0 sm:pb-0 sm:z-auto',
              'bg-background/95 backdrop-blur-sm supports-[backdrop-filter]:bg-background/80',
              'sm:bg-transparent sm:backdrop-blur-none',
            ],
          )}
        >
          {/* Left side buttons */}
          <div className="flex flex-col-reverse sm:flex-row gap-2">
            {onCancel && (
              <Button
                type="button"
                variant="ghost"
                onClick={onCancel}
                disabled={isLoading}
                className="min-h-11 w-full sm:w-auto"
              >
                {t('cancel')}
              </Button>
            )}
            {!isFirstStep && (
              <Button
                type="button"
                variant="outline"
                onClick={goBack}
                disabled={isLoading || isValidating}
                className="min-h-11 w-full sm:w-auto"
              >
                {isRTL ? (
                  <ChevronRight className="h-4 w-4 me-2" />
                ) : (
                  <ChevronLeft className="h-4 w-4 me-2" />
                )}
                {t('back')}
              </Button>
            )}
          </div>

          {/* Right side buttons */}
          <div className="flex flex-col sm:flex-row gap-2">
            {onSaveDraft && (
              <Button
                type="button"
                variant="outline"
                onClick={onSaveDraft}
                disabled={isLoading || isDraftSaving}
                className="min-h-11 w-full sm:w-auto"
              >
                {isDraftSaving ? (
                  <Loader2 className="h-4 w-4 me-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 me-2" />
                )}
                {isDraftSaving ? t('saving') : t('saveDraft')}
              </Button>
            )}

            {isLastStep ? (
              <Button
                type="button"
                onClick={onComplete}
                disabled={isLoading || !canComplete || isValidating}
                className="min-h-11 w-full sm:w-auto"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 me-2 animate-spin" />
                ) : (
                  <Check className="h-4 w-4 me-2" />
                )}
                {isRTL ? completeButtonTextAr : completeButtonText}
              </Button>
            ) : (
              <Button
                type="button"
                onClick={goNext}
                disabled={isLoading || isValidating}
                className="min-h-11 w-full sm:w-auto"
              >
                {isValidating ? <Loader2 className="h-4 w-4 me-2 animate-spin" /> : null}
                {t('next')}
                {isRTL ? (
                  <ChevronLeft className="h-4 w-4 ms-2" />
                ) : (
                  <ChevronRight className="h-4 w-4 ms-2" />
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </WizardContext.Provider>
  )
}

// FormWizardStep component for rendering step content
export function FormWizardStep({ stepId, children, className }: FormWizardStepProps) {
  return (
    <div className={cn('space-y-4', className)} data-wizard-step={stepId}>
      {children}
    </div>
  )
}

// Hook for draft management with localStorage
export function useFormDraft<T extends Record<string, unknown>>(
  draftKey: string,
  defaultValue: T,
): {
  draft: T
  setDraft: React.Dispatch<React.SetStateAction<T>>
  saveDraft: () => void
  clearDraft: () => void
  hasDraft: boolean
  isDraftSaving: boolean
} {
  const [hasDraft, setHasDraft] = React.useState(false)
  const [isDraftSaving, setIsDraftSaving] = React.useState(false)

  // Initialize state from localStorage or default
  const [draft, setDraft] = React.useState<T>(() => {
    if (typeof window === 'undefined') return defaultValue

    try {
      const stored = localStorage.getItem(draftKey)
      if (stored) {
        const parsed = JSON.parse(stored)
        setHasDraft(true)
        return { ...defaultValue, ...parsed }
      }
    } catch (error) {
      console.error('Failed to load draft:', error)
    }
    return defaultValue
  })

  // Save draft to localStorage
  const saveDraft = React.useCallback(() => {
    setIsDraftSaving(true)
    try {
      localStorage.setItem(
        draftKey,
        JSON.stringify({
          ...draft,
          _savedAt: new Date().toISOString(),
        }),
      )
      setHasDraft(true)
    } catch (error) {
      console.error('Failed to save draft:', error)
    } finally {
      setTimeout(() => setIsDraftSaving(false), 500)
    }
  }, [draft, draftKey])

  // Clear draft from localStorage
  const clearDraft = React.useCallback(() => {
    try {
      localStorage.removeItem(draftKey)
      setHasDraft(false)
    } catch (error) {
      console.error('Failed to clear draft:', error)
    }
  }, [draftKey])

  // Auto-save draft on changes (debounced)
  React.useEffect(() => {
    if (!hasDraft && Object.keys(draft).length === Object.keys(defaultValue).length) {
      // Only auto-save if there are actual changes
      const hasChanges = Object.keys(draft).some(
        (key) => JSON.stringify(draft[key]) !== JSON.stringify(defaultValue[key as keyof T]),
      )
      if (!hasChanges) return
    }

    const timer = setTimeout(() => {
      saveDraft()
    }, 2000) // Auto-save after 2 seconds of inactivity

    return () => clearTimeout(timer)
  }, [draft, defaultValue, saveDraft, hasDraft])

  return {
    draft,
    setDraft,
    saveDraft,
    clearDraft,
    hasDraft,
    isDraftSaving,
  }
}

// Conditional field wrapper
export interface ConditionalFieldProps {
  show: boolean
  children: React.ReactNode
  animate?: boolean
  className?: string
}

export function ConditionalField({
  show,
  children,
  animate = true,
  className,
}: ConditionalFieldProps) {
  if (!animate) {
    return show ? <div className={className}>{children}</div> : null
  }

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.2 }}
          className={cn('overflow-hidden', className)}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default FormWizard
