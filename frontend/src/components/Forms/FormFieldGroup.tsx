/**
 * FormFieldGroup Component
 * Groups related form fields with collapsible functionality
 * Mobile-first and RTL-compatible
 */

import { useTranslation } from 'react-i18next'
import { type ReactNode } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { cn } from '@/lib/utils'
import { ChevronDown, CheckCircle2, AlertCircle, Folder } from 'lucide-react'
import * as CollapsiblePrimitive from '@radix-ui/react-collapsible'

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
    if (percentage === 100) return 'text-emerald-500'
    if (percentage >= 75) return 'text-emerald-400'
    if (percentage >= 50) return 'text-amber-500'
    if (percentage >= 25) return 'text-amber-400'
    return 'text-gray-400'
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
          className="text-gray-200 dark:text-gray-700"
        />
        {/* Progress circle */}
        <motion.circle
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
      <span className="absolute text-xs font-medium text-gray-600 dark:text-gray-300">
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
  const { t, i18n } = useTranslation('progressive-form')
  const isRTL = i18n.language === 'ar'

  return (
    <div className="flex items-center gap-3 flex-wrap">
      {/* Icon */}
      <div className="flex-shrink-0">
        {icon || <Folder className="w-5 h-5 text-gray-400 dark:text-gray-500" />}
      </div>

      {/* Title and Description */}
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-gray-900 dark:text-white text-start text-sm sm:text-base">
          {title}
        </h3>
        {description && (
          <p className="text-sm text-gray-500 dark:text-gray-400 text-start mt-0.5 truncate">
            {description}
          </p>
        )}
      </div>

      {/* Status indicators */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Field count */}
        {fieldCount !== undefined && completedCount !== undefined && (
          <span className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">
            {t('group.fieldCount', { completed: completedCount, total: fieldCount })}
          </span>
        )}

        {/* Error indicator */}
        {hasErrors && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="flex items-center text-red-500"
          >
            <AlertCircle className="w-5 h-5" />
          </motion.div>
        )}

        {/* Completion ring */}
        {completionPercentage !== undefined && !hasErrors && completionPercentage === 100 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="flex items-center text-emerald-500"
          >
            <CheckCircle2 className="w-5 h-5" />
          </motion.div>
        )}

        {completionPercentage !== undefined && !hasErrors && completionPercentage < 100 && (
          <CompletionRing percentage={completionPercentage} />
        )}

        {/* Collapse indicator */}
        {collapsible && (
          <motion.div
            animate={{ rotate: isCollapsed ? (isRTL ? 90 : -90) : 0 }}
            transition={{ duration: 0.2 }}
            className="flex-shrink-0"
          >
            <ChevronDown className="w-5 h-5 text-gray-400" />
          </motion.div>
        )}
      </div>
    </div>
  )
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function FormFieldGroup({
  id,
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
  const { i18n } = useTranslation()
  const isRTL = i18n.language === 'ar'

  // Container styling
  const containerClasses = cn(
    // Base styles
    'rounded-xl',
    'bg-gray-50 dark:bg-gray-900/50',
    // Border
    'border border-gray-200 dark:border-gray-700',
    // Transition
    'transition-all duration-200',
    // Error state
    hasErrors && 'border-red-300 dark:border-red-700 bg-red-50/50 dark:bg-red-900/20',
    // Complete state
    completionPercentage === 100 && !hasErrors && 'border-emerald-300 dark:border-emerald-700',
    className,
  )

  // Header styling
  const headerClasses = cn(
    'flex items-center w-full p-4 sm:p-5',
    'text-start',
    collapsible && 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800/50 rounded-xl',
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
        dir={isRTL ? 'rtl' : 'ltr'}
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
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="overflow-hidden"
              >
                <div className={contentClasses}>{children}</div>
              </motion.div>
            </CollapsiblePrimitive.Content>
          )}
        </AnimatePresence>
      </CollapsiblePrimitive.Root>
    )
  }

  // Non-collapsible version
  return (
    <div className={containerClasses} dir={isRTL ? 'rtl' : 'ltr'}>
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
export default FormFieldGroup
