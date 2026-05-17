import { useTranslation } from 'react-i18next'
import { Clock, AlertCircle, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { calculateSLAStatus, type SLAStatus } from '@/utils/sla-calculator'
import { useDirection } from '@/hooks/useDirection'

interface SLAIndicatorProps {
  /**
   * SLA deadline timestamp (ISO 8601 format)
   */
  deadline: string | null

  /**
   * Task completion status
   */
  isCompleted?: boolean

  /**
   * Completion timestamp (ISO 8601 format)
   */
  completedAt?: string | null

  /**
   * Display mode: badge (compact) or detailed (full info)
   * @default 'badge'
   */
  mode?: 'badge' | 'detailed'

  /**
   * Additional CSS classes
   */
  className?: string
}

/**
 * SLAIndicator Component
 *
 * Displays SLA status with color coding:
 * - Green (safe): 0-74% of time elapsed
 * - Yellow (warning): 75-99% of time elapsed
 * - Red (breached): 100%+ of time elapsed
 * - Blue (completed): Task completed within SLA
 * - Gray (completed late): Task completed after SLA breach
 *
 * Mobile-first: Minimum 44x44px touch targets
 * RTL-compatible: Uses logical properties and flips icon direction
 * Accessibility: WCAG AA color contrast (4.5:1 minimum)
 */
export function SLAIndicator({
  deadline,
  isCompleted = false,
  completedAt,
  mode = 'badge',
  className,
}: SLAIndicatorProps) {
  const { isRTL } = useDirection()
  // No deadline = no SLA tracking
  if (!deadline) {
    return null
  }

  const slaStatus = calculateSLAStatus(deadline, isCompleted, completedAt)

  return mode === 'badge' ? (
    <BadgeMode status={slaStatus} isRTL={isRTL} className={className} />
  ) : (
    <DetailedMode status={slaStatus} deadline={deadline} isRTL={isRTL} className={className} />
  )
}

/**
 * Badge Mode: Compact indicator with icon and color
 */
function BadgeMode({
  status,
  isRTL,
  className,
}: {
  status: SLAStatus
  isRTL: boolean
  className?: string
}) {
  const { t } = useTranslation()

  const Icon = getStatusIcon(status.status)

  return (
    <div
      className={cn(
        // Base styles (mobile-first)
        'inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium',
        'min-h-11 min-w-11', // Touch target minimum (44x44px)
        'sm:min-h-10 sm:px-3 sm:py-1.5 sm:text-sm', // Tablet
        'md:min-h-9', // Desktop

        // RTL support
        isRTL ? 'flex-row-reverse' : 'flex-row',

        // Color coding
        getStatusColors(status.status),

        className,
      )}
      role="status"
      aria-label={t(`tasks.sla.${status.status}`, { defaultValue: status.status })}
    >
      <Icon className={cn('size-4', isRTL ? 'rotate-180' : '')} aria-hidden="true" />
      <span className="text-start">{t(`tasks.sla.${status.status}`)}</span>
    </div>
  )
}

/**
 * Detailed Mode: Full SLA information with time remaining
 */
function DetailedMode({
  status,
  deadline,
  isRTL,
  className,
}: {
  status: SLAStatus
  deadline: string
  isRTL: boolean
  className?: string
}) {
  const { t } = useTranslation()

  const Icon = getStatusIcon(status.status)

  return (
    <div
      className={cn(
        // Base styles (mobile-first)
        'flex flex-col gap-2 p-4 rounded-lg border',
        'sm:gap-3 sm:p-6', // Tablet
        'md:flex-row md:items-center md:justify-between', // Desktop

        // RTL support
        'text-start',

        // Border color based on status
        getStatusBorderColors(status.status),

        className,
      )}
      role="region"
      aria-labelledby="sla-info-title"
    >
      {/* Status indicator */}
      <div className={cn('flex items-center gap-2', isRTL ? 'flex-row-reverse' : 'flex-row')}>
        <Icon
          className={cn(
            'size-5 sm:size-6',
            isRTL ? 'rotate-180' : '',
            getStatusColors(status.status),
          )}
          aria-hidden="true"
        />
        <div className="flex flex-col">
          <h3 id="sla-info-title" className="text-sm font-semibold sm:text-base">
            {t(`tasks.sla.${status.status}`)}
          </h3>
          <p className="text-xs text-muted-foreground sm:text-sm">{t('tasks.sla.deadline')}</p>
        </div>
      </div>

      {/* Deadline and time remaining */}
      <div className="flex flex-col gap-1 text-sm sm:text-base">
        <div className={cn('flex items-center gap-2', isRTL ? 'flex-row-reverse' : 'flex-row')}>
          <Clock className={cn('size-4', isRTL ? 'rotate-180' : '')} aria-hidden="true" />
          <span>
            {new Date(deadline).toLocaleString(isRTL ? 'ar-SA' : 'en-US', {
              dateStyle: 'medium',
              timeStyle: 'short',
            })}
          </span>
        </div>

        {status.timeRemaining && (
          <p className="text-xs text-muted-foreground sm:text-sm">{status.timeRemaining}</p>
        )}
      </div>

      {/* Progress bar (if not completed) */}
      {!status.status.includes('completed') && status.percentElapsed !== undefined && (
        <div className="flex flex-col gap-1 w-full md:w-48">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{t('tasks.sla.progress')}</span>
            <span>{Math.round(status.percentElapsed)}%</span>
          </div>
          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
            <div
              className={cn('h-full transition-all duration-500', getStatusColors(status.status))}
              style={{ width: `${Math.min(status.percentElapsed, 100)}%` }}
              role="progressbar"
              aria-valuenow={Math.round(status.percentElapsed)}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Get icon based on SLA status
 */
function getStatusIcon(status: string) {
  switch (status) {
    case 'safe':
      return CheckCircle2
    case 'approaching':
      return AlertTriangle
    case 'warning':
      return AlertCircle
    case 'breached':
      return XCircle
    case 'completed_on_time':
      return CheckCircle2
    case 'completed_late':
      return XCircle
    default:
      return Clock
  }
}

/**
 * Get color classes for SLA status (WCAG AA compliant - 4.5:1 contrast)
 */
function getStatusColors(status: string): string {
  switch (status) {
    case 'safe':
      return 'bg-success/10 text-success dark:bg-success dark:text-success'
    case 'approaching':
      return 'bg-warning/10 text-warning dark:bg-warning dark:text-warning'
    case 'warning':
      return 'bg-warning/10 text-warning dark:bg-warning dark:text-warning'
    case 'breached':
      return 'bg-danger/10 text-danger dark:bg-danger dark:text-danger'
    case 'completed_on_time':
      return 'bg-info/10 text-info dark:bg-info dark:text-info'
    case 'completed_late':
      return 'bg-muted text-foreground dark:bg-muted dark:text-muted-foreground'
    default:
      return 'bg-muted text-foreground dark:bg-muted dark:text-muted-foreground'
  }
}

/**
 * Get border color classes for detailed mode
 */
function getStatusBorderColors(status: string): string {
  switch (status) {
    case 'safe':
      return 'border-success/30 dark:border-success'
    case 'approaching':
      return 'border-warning/30 dark:border-warning'
    case 'warning':
      return 'border-warning/30 dark:border-warning'
    case 'breached':
      return 'border-danger/30 dark:border-danger'
    case 'completed_on_time':
      return 'border-info/30 dark:border-info'
    case 'completed_late':
      return 'border-line dark:border-line'
    default:
      return 'border-line dark:border-line'
  }
}
