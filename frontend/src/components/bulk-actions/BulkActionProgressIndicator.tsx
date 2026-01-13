import { useTranslation } from 'react-i18next'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Loader2, CheckCircle2, XCircle, AlertCircle } from 'lucide-react'
import type {
  BulkActionStatus,
  BulkActionType,
  BulkActionEntityType,
} from '@/types/bulk-actions.types'
import { cn } from '@/lib/utils'

export interface BulkActionProgressIndicatorProps {
  /** Current status */
  status: BulkActionStatus
  /** Progress percentage (0-100) */
  progress: number
  /** Number processed */
  processedCount: number
  /** Total to process */
  totalCount: number
  /** Action being performed */
  actionType: BulkActionType | null
  /** Entity type */
  entityType: BulkActionEntityType
  /** Callback to cancel operation */
  onCancel?: () => void
  /** Additional CSS classes */
  className?: string
}

/**
 * Status icon mapping
 */
const STATUS_ICONS: Record<BulkActionStatus, React.ReactNode> = {
  idle: null,
  pending: <Loader2 className="h-5 w-5 animate-spin text-blue-600" />,
  processing: <Loader2 className="h-5 w-5 animate-spin text-blue-600" />,
  completed: <CheckCircle2 className="h-5 w-5 text-green-600" />,
  failed: <XCircle className="h-5 w-5 text-red-600" />,
  cancelled: <AlertCircle className="h-5 w-5 text-orange-600" />,
}

/**
 * Status color mapping for progress bar
 */
const STATUS_COLORS: Record<BulkActionStatus, string> = {
  idle: 'bg-gray-200',
  pending: 'bg-blue-600',
  processing: 'bg-blue-600',
  completed: 'bg-green-600',
  failed: 'bg-red-600',
  cancelled: 'bg-orange-600',
}

/**
 * BulkActionProgressIndicator - Shows progress of bulk operations
 *
 * Features:
 * - Animated progress bar
 * - Status icon indicator
 * - Processing count display
 * - Cancel button for long operations
 * - Mobile-first responsive design
 * - RTL support
 */
export function BulkActionProgressIndicator({
  status,
  progress,
  processedCount,
  totalCount,
  actionType,
  entityType,
  onCancel,
  className,
}: BulkActionProgressIndicatorProps) {
  const { t, i18n } = useTranslation('bulk-actions')
  const isRTL = i18n.language === 'ar'

  // Don't render for idle status
  if (status === 'idle') {
    return null
  }

  const isProcessing = status === 'processing' || status === 'pending'
  const entityLabel =
    totalCount === 1 ? t(`entityTypes.${entityType}`) : t(`entityTypes.${entityType}_plural`)

  const actionLabel = actionType ? t(`actions.${actionType.replace(/-/g, '')}`) : ''

  return (
    <div
      className={cn(
        'p-4 bg-white dark:bg-gray-900 rounded-lg border shadow-sm',
        'space-y-3',
        className,
      )}
      dir={isRTL ? 'rtl' : 'ltr'}
      role="progressbar"
      aria-valuenow={progress}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={t('accessibility.progressBar', { progress })}
    >
      {/* Header with status icon and title */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {STATUS_ICONS[status]}
          <div>
            <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {isProcessing ? t('progress.title') : t(`progress.${status}`)}
            </h4>
            <p className="text-xs text-muted-foreground">
              {actionLabel} {entityLabel}
            </p>
          </div>
        </div>

        {/* Cancel button (only during processing) */}
        {isProcessing && onCancel && (
          <Button variant="ghost" size="sm" onClick={onCancel} className="h-8 px-3 text-xs">
            {t('progress.cancel')}
          </Button>
        )}
      </div>

      {/* Progress bar */}
      <div className="space-y-1">
        <Progress value={progress} className={cn('h-2', STATUS_COLORS[status])} />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>
            {t('progress.processing', {
              current: processedCount,
              total: totalCount,
            })}
          </span>
          <span>{progress}%</span>
        </div>
      </div>

      {/* Status message */}
      {isProcessing && <p className="text-xs text-muted-foreground">{t('progress.pleaseWait')}</p>}
    </div>
  )
}

export default BulkActionProgressIndicator
