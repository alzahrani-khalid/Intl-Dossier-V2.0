/**
 * FormFieldGroup Component
 * Groups related form fields with collapsible functionality
 * Mobile-first and RTL-compatible
 */

import { useTranslation } from 'react-i18next'
import { type ReactNode } from 'react'
import { m, AnimatePresence } from 'motion/react'
import { cn } from '@/lib/utils'
import { ChevronDown, CheckCircle2, AlertCircle, Folder } from 'lucide-react'
import * as CollapsiblePrimitive from '@radix-ui/react-collapsible'
import { useDirection } from '@/hooks/useDirection'

// =============================================================================
// TYPES
// =============================================================================

export interface FormFieldGroupProps {
  /** Group ID */
  id: string
  /** Group title */
  title: string
  /** Group description */
  description?: string
  /** Group icon */
  icon?: ReactNode
  /** Whether group is collapsible */
  collapsible?: boolean
  /** Whether group is collapsed */
  isCollapsed?: boolean
  /** Callback when collapse state changes */
  onCollapsedChange?: (collapsed: boolean) => void
  /** Completion percentage (0-100) */
  completionPercentage?: number
  /** Whether group has errors */
  hasErrors?: boolean
  /** Number of fields in group */
  fieldCount?: number
  /** Number of completed fields */
  completedCount?: number
  /** Additional class names */
  className?: string
  /** Children (form fields) */
  children: ReactNode
}

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

interface CompletionRingProps {
  percentage: number
  size?: number
  strokeWidth?: number
  className?: string
}

function CompletionRing({
  percentage,
  size = 32,
  strokeWidth = 3,
  className,
}: CompletionRingProps) {
  const { t } = useTranslation('progressive-form')
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (percentage / 100) * circumference

  // Color based on percentage
  const getColor = () => {
    if (percentage === 100) return 'text-success'
    if (percentage >= 75) return 'text-success'
    if (percentage >= 50) return 'text-warning'
    if (percentage >= 25) return 'text-warning'
    return 'text-muted-foreground'
  }

  return (
    <div
      className={cn('relative inline-flex items-center justify-center', className)}
      aria-label={t('completion.percentage', { percentage })}
    >
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-muted-foreground dark:text-muted-foreground"
        />
        {/* Progress circle */}
        <m.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          className={getColor()}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          style={{
            strokeDasharray: circumference,
          }}
        />
      </svg>
      <span className="absolute text-xs font-medium text-muted-foreground dark:text-muted-foreground">
        {percentage}%
      </span>
    </div>
  )
}

interface GroupHeaderProps {
  title: string
  description?: string
  icon?: ReactNode
  completionPercentage?: number
  hasErrors?: boolean
  fieldCount?: number
  completedCount?: number
  isCollapsed?: boolean
  collapsible?: boolean
}

function GroupHeader({
  title,
  description,
  icon,
  completionPercentage,
  hasErrors,
  fieldCount,
  completedCount,
  isCollapsed,
  collapsible,
}: GroupHeaderProps) {
  const { t } = useTranslation('progressive-form')
  const { isRTL } = useDirection()
  return (
    <div className="flex items-center gap-3 flex-wrap">
      {/* Icon */}
      <div className="flex-shrink-0">
        {icon || <Folder className="w-5 h-5 text-muted-foreground dark:text-muted-foreground" />}
      </div>

      {/* Title and Description */}
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-foreground dark:text-white text-start text-sm sm:text-base">
          {title}
        </h3>
        {description && (
          <p className="text-sm text-muted-foreground dark:text-muted-foreground text-start mt-0.5 truncate">
            {description}
          </p>
        )}
      </div>

      {/* Status indicators */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Field count */}
        {fieldCount !== undefined && completedCount !== undefined && (
          <span className="text-xs text-muted-foreground dark:text-muted-foreground hidden sm:block">
            {t('group.fieldCount', { completed: completedCount, total: fieldCount })}
          </span>
        )}

        {/* Error indicator */}
        {hasErrors && (
          <m.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex items-center text-danger"
          >
            <AlertCircle className="w-5 h-5" />
          </m.div>
        )}

        {/* Completion ring */}
        {completionPercentage !== undefined && !hasErrors && completionPercentage === 100 && (
          <m.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex items-center text-success"
          >
            <CheckCircle2 className="w-5 h-5" />
          </m.div>
        )}

        {completionPercentage !== undefined && !hasErrors && completionPercentage < 100 && (
          <CompletionRing percentage={completionPercentage} />
        )}

        {/* Collapse indicator */}
        {collapsible && (
          <m.div
            animate={{ rotate: isCollapsed ? (isRTL ? 90 : -90) : 0 }}
            transition={{ duration: 0.2 }}
            className="flex-shrink-0"
          >
            <ChevronDown className="w-5 h-5 text-muted-foreground" />
          </m.div>
        )}
      </div>
    </div>
  )
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function FormFieldGroup({
  title,
  description,
  icon,
  collapsible = false,
  isCollapsed = false,
  onCollapsedChange,
  completionPercentage,
  hasErrors = false,
  fieldCount,
  completedCount,
  className,
  children,
}: FormFieldGroupProps) {
  // Container styling
  const containerClasses = cn(
    // Base styles
    'rounded-xl',
    'bg-muted dark:bg-muted/50',
    // Border
    'border border-line dark:border-line',
    // Transition
    'transition-all duration-200',
    // Error state
    hasErrors && 'border-danger/30 dark:border-danger bg-danger/50 dark:bg-danger/20',
    // Complete state
    completionPercentage === 100 && !hasErrors && 'border-success/30 dark:border-success',
    className,
  )

  // Header styling
  const headerClasses = cn(
    'flex items-center w-full p-4 sm:p-5',
    'text-start',
    collapsible && 'cursor-pointer hover:bg-muted dark:hover:bg-muted/50 rounded-xl',
    collapsible && 'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
  )

  // Content styling
  const contentClasses = cn('p-4 sm:p-5 pt-0 sm:pt-0', 'space-y-3 sm:space-y-4')

  // If collapsible, use Radix Collapsible
  if (collapsible) {
    return (
      <CollapsiblePrimitive.Root
        open={!isCollapsed}
        onOpenChange={(open) => onCollapsedChange?.(!open)}
        className={containerClasses}
      >
        <CollapsiblePrimitive.Trigger asChild>
          <button type="button" className={headerClasses} aria-expanded={!isCollapsed}>
            <GroupHeader
              title={title}
              description={description}
              icon={icon}
              completionPercentage={completionPercentage}
              hasErrors={hasErrors}
              fieldCount={fieldCount}
              completedCount={completedCount}
              isCollapsed={isCollapsed}
              collapsible={collapsible}
            />
          </button>
        </CollapsiblePrimitive.Trigger>

        <AnimatePresence initial={false}>
          {!isCollapsed && (
            <CollapsiblePrimitive.Content forceMount asChild>
              <m.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="overflow-hidden"
              >
                <div className={contentClasses}>{children}</div>
              </m.div>
            </CollapsiblePrimitive.Content>
          )}
        </AnimatePresence>
      </CollapsiblePrimitive.Root>
    )
  }

  // Non-collapsible version
  return (
    <div className={containerClasses}>
      <div className={headerClasses}>
        <GroupHeader
          title={title}
          description={description}
          icon={icon}
          completionPercentage={completionPercentage}
          hasErrors={hasErrors}
          fieldCount={fieldCount}
          completedCount={completedCount}
          isCollapsed={false}
          collapsible={false}
        />
      </div>
      <div className={contentClasses}>{children}</div>
    </div>
  )
}

// =============================================================================
// EXPORTS
// =============================================================================

export { CompletionRing }
