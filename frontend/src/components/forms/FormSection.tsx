/**
 * FormSection Component
 *
 * A consistent, reusable section wrapper for grouping related form fields.
 * Provides standardized spacing, headers, descriptions, and collapsible behavior.
 *
 * Features:
 * - Consistent visual hierarchy
 * - Optional collapsible sections
 * - Progress indicators for required fields
 * - Mobile-first, RTL-compatible design
 * - Accessibility (proper heading levels, ARIA attributes)
 *
 * @module components/forms/FormSection
 */

import { useState, useCallback, createContext, useContext, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { m, AnimatePresence } from 'motion/react'
import { ChevronDown, ChevronRight, CheckCircle2, AlertCircle, Info } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

// =============================================================================
// TYPES
// =============================================================================

type SectionStatus = 'incomplete' | 'complete' | 'error' | 'optional'

interface FormSectionProps {
  /** Section title */
  title: string
  /** Optional description below the title */
  description?: string
  /** Whether the section can be collapsed */
  collapsible?: boolean
  /** Default collapsed state (only applies if collapsible) */
  defaultCollapsed?: boolean
  /** Section status for visual indicator */
  status?: SectionStatus
  /** Number of completed fields / total required fields */
  progress?: { completed: number; total: number }
  /** Whether this section is required */
  required?: boolean
  /** Help tooltip text */
  helpText?: string
  /** Section icon */
  icon?: ReactNode
  /** Error message to display */
  error?: string
  /** Heading level for accessibility (h2-h6) */
  headingLevel?: 2 | 3 | 4 | 5 | 6
  /** Additional class names */
  className?: string
  /** Child content */
  children: ReactNode
  /** ID for scroll-to functionality */
  id?: string
  /** Callback when section is expanded/collapsed */
  onToggle?: (isExpanded: boolean) => void
}

interface FormSectionContextValue {
  isExpanded: boolean
  toggleExpanded: () => void
}

// =============================================================================
// CONTEXT
// =============================================================================

const FormSectionContext = createContext<FormSectionContextValue | null>(null)

export function useFormSection() {
  const context = useContext(FormSectionContext)
  if (!context) {
    throw new Error('useFormSection must be used within a FormSection')
  }
  return context
}

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

interface StatusIndicatorProps {
  status: SectionStatus
  className?: string
}

function StatusIndicator({ status, className }: StatusIndicatorProps) {
  const iconClasses = cn('h-4 w-4', className)

  switch (status) {
    case 'complete':
      return <CheckCircle2 className={cn(iconClasses, 'text-success')} />
    case 'error':
      return <AlertCircle className={cn(iconClasses, 'text-danger')} />
    case 'incomplete':
      return (
        <div
          className={cn('h-4 w-4 rounded-full border-2 border-line dark:border-line', className)}
        />
      )
    case 'optional':
      return (
        <div
          className={cn(
            'h-4 w-4 rounded-full border-2 border-dashed border-line dark:border-line',
            className,
          )}
        />
      )
    default:
      return null
  }
}

interface ProgressBadgeProps {
  completed: number
  total: number
}

function ProgressBadge({ completed, total }: ProgressBadgeProps) {
  const isComplete = completed === total

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full',
        isComplete
          ? 'bg-success/10 text-success dark:bg-success/30 dark:text-success'
          : 'bg-muted text-muted-foreground dark:bg-muted dark:text-muted-foreground',
      )}
    >
      {completed}/{total}
    </span>
  )
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function FormSection({
  title,
  description,
  collapsible = false,
  defaultCollapsed = false,
  status,
  progress,
  required = false,
  helpText,
  icon,
  error,
  headingLevel = 3,
  className,
  children,
  id,
  onToggle,
}: FormSectionProps) {
  const { t } = useTranslation('common')
  const [isExpanded, setIsExpanded] = useState(!defaultCollapsed)

  const toggleExpanded = useCallback(() => {
    if (!collapsible) return
    const newState = !isExpanded
    setIsExpanded(newState)
    onToggle?.(newState)
  }, [collapsible, isExpanded, onToggle])

  // Determine effective status
  const effectiveStatus =
    status ||
    (progress ? (progress.completed === progress.total ? 'complete' : 'incomplete') : undefined)

  // Heading element based on level
  const HeadingTag = `h${headingLevel}` as 'h2' | 'h3' | 'h4' | 'h5' | 'h6'

  const contextValue: FormSectionContextValue = {
    isExpanded,
    toggleExpanded,
  }

  return (
    <FormSectionContext.Provider value={contextValue}>
      <section
        id={id}
        className={cn(
          'rounded-lg',
          'border border-line dark:border-line',
          'bg-white dark:bg-muted/50',
          'transition-all duration-200',
          error && 'border-danger/30 dark:border-danger',
          className,
        )}
        aria-labelledby={id ? `${id}-heading` : undefined}
      >
        {/* Header */}
        {collapsible ? (
          <button
            type="button"
            className={cn(
              'flex items-center gap-3 px-4 py-3 sm:px-6 sm:py-4 w-full text-start',
              'cursor-pointer hover:bg-muted dark:hover:bg-muted/50',
              !isExpanded && 'border-b-0',
              isExpanded && 'border-b border-line dark:border-line',
            )}
            onClick={toggleExpanded}
            aria-expanded={isExpanded}
          >
            <m.div
              animate={{ rotate: isExpanded ? 90 : 0 }}
              transition={{ duration: 0.2 }}
              className="shrink-0 text-muted-foreground"
            >
              <ChevronRight className="h-5 w-5" />
            </m.div>

            {effectiveStatus && <StatusIndicator status={effectiveStatus} />}
            {icon && (
              <div className="shrink-0 text-muted-foreground dark:text-muted-foreground">
                {icon}
              </div>
            )}

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <HeadingTag
                  id={id ? `${id}-heading` : undefined}
                  className="text-base font-semibold text-foreground dark:text-muted-foreground sm:text-lg"
                >
                  {title}
                </HeadingTag>
                {required && (
                  <span className="text-danger text-sm" aria-label={t('validation.required')}>
                    *
                  </span>
                )}
              </div>
              {description && (
                <p className="mt-0.5 text-sm text-muted-foreground dark:text-muted-foreground">
                  {description}
                </p>
              )}
            </div>

            {progress && <ProgressBadge completed={progress.completed} total={progress.total} />}

            <m.div
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ duration: 0.2 }}
              className="shrink-0 text-muted-foreground hidden sm:block"
            >
              <ChevronDown className="h-5 w-5" />
            </m.div>
          </button>
        ) : (
          <div
            className={cn(
              'flex items-center gap-3 px-4 py-3 sm:px-6 sm:py-4',
              !isExpanded && 'border-b-0',
              isExpanded && 'border-b border-line dark:border-line',
            )}
          >
            {effectiveStatus && <StatusIndicator status={effectiveStatus} />}
            {icon && (
              <div className="shrink-0 text-muted-foreground dark:text-muted-foreground">
                {icon}
              </div>
            )}

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <HeadingTag
                  id={id ? `${id}-heading` : undefined}
                  className="text-base font-semibold text-foreground dark:text-muted-foreground sm:text-lg"
                >
                  {title}
                </HeadingTag>
                {required && (
                  <span className="text-danger text-sm" aria-label={t('validation.required')}>
                    *
                  </span>
                )}
                {helpText && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-5 w-5 p-0">
                          <Info className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">{helpText}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
              {description && (
                <p className="mt-0.5 text-sm text-muted-foreground dark:text-muted-foreground">
                  {description}
                </p>
              )}
            </div>

            {progress && <ProgressBadge completed={progress.completed} total={progress.total} />}
          </div>
        )}

        {/* Content */}
        <AnimatePresence initial={false}>
          {isExpanded && (
            <m.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
              className="overflow-hidden"
            >
              <div className="px-4 py-4 sm:px-6 sm:py-5 space-y-4">{children}</div>
            </m.div>
          )}
        </AnimatePresence>

        {/* Error message */}
        <AnimatePresence>
          {error && (
            <m.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="px-4 py-3 sm:px-6 border-t border-danger/30 dark:border-danger bg-danger/10 dark:bg-danger/30"
            >
              <div className="flex items-center gap-2 text-sm text-danger dark:text-danger">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            </m.div>
          )}
        </AnimatePresence>
      </section>
    </FormSectionContext.Provider>
  )
}

// =============================================================================
// FORM SECTIONS CONTAINER
// =============================================================================

interface FormSectionsProps {
  /** Child FormSection components */
  children: ReactNode
  /** Gap between sections */
  gap?: 'sm' | 'md' | 'lg'
  /** Additional class names */
  className?: string
}

/**
 * Container for multiple FormSection components with consistent spacing
 */
export function FormSections({ children, gap = 'md', className }: FormSectionsProps) {
  const gapClasses = {
    sm: 'space-y-3',
    md: 'space-y-4 sm:space-y-6',
    lg: 'space-y-6 sm:space-y-8',
  }

  return <div className={cn(gapClasses[gap], className)}>{children}</div>
}

// =============================================================================
// FIELD ROW COMPONENT
// =============================================================================

interface FieldRowProps {
  /** Child field components */
  children: ReactNode
  /** Number of columns on desktop */
  columns?: 1 | 2 | 3 | 4
  /** Gap between fields */
  gap?: 'sm' | 'md' | 'lg'
  /** Additional class names */
  className?: string
}

/**
 * Responsive row layout for form fields
 */
export function FieldRow({ children, columns = 2, gap = 'md', className }: FieldRowProps) {
  const columnClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  }

  const gapClasses = {
    sm: 'gap-3',
    md: 'gap-4',
    lg: 'gap-6',
  }

  return (
    <div className={cn('grid', columnClasses[columns], gapClasses[gap], className)}>{children}</div>
  )
}
