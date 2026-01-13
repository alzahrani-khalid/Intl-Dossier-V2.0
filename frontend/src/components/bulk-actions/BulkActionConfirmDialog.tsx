import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { AlertTriangle, Loader2 } from 'lucide-react'
import type {
  BulkActionDefinition,
  BulkActionEntityType,
  BulkActionParams,
  EntityStatus,
  Priority,
  ExportFormat,
} from '@/types/bulk-actions.types'
import { cn } from '@/lib/utils'
import { DEFAULT_UNDO_TTL } from '@/types/bulk-actions.types'

export interface BulkActionConfirmDialogProps {
  /** Whether dialog is open */
  open: boolean
  /** Action to confirm */
  action: BulkActionDefinition | null
  /** Number of items affected */
  itemCount: number
  /** Entity type for display */
  entityType: BulkActionEntityType
  /** Callback when confirmed */
  onConfirm: (params?: BulkActionParams) => void
  /** Callback when cancelled */
  onCancel: () => void
  /** Whether action is currently processing */
  isProcessing?: boolean
  /** Undo TTL in ms */
  undoTtl?: number
}

/**
 * Status options for status update action
 */
const STATUS_OPTIONS: EntityStatus[] = [
  'pending',
  'in_progress',
  'completed',
  'cancelled',
  'draft',
  'review',
  'approved',
  'rejected',
  'archived',
]

/**
 * Priority options for priority change action
 */
const PRIORITY_OPTIONS: Priority[] = ['low', 'medium', 'high', 'urgent']

/**
 * Export format options
 */
const EXPORT_FORMAT_OPTIONS: ExportFormat[] = ['csv', 'xlsx', 'pdf', 'json']

/**
 * BulkActionConfirmDialog - Confirmation dialog for bulk actions
 *
 * Features:
 * - Dynamic content based on action type
 * - Parameter input fields for relevant actions
 * - Warning messages for destructive actions
 * - Undo availability indication
 * - Mobile-first responsive design
 * - RTL support
 */
export function BulkActionConfirmDialog({
  open,
  action,
  itemCount,
  entityType,
  onConfirm,
  onCancel,
  isProcessing = false,
  undoTtl = DEFAULT_UNDO_TTL,
}: BulkActionConfirmDialogProps) {
  const { t, i18n } = useTranslation('bulk-actions')
  const isRTL = i18n.language === 'ar'

  // Parameter state
  const [selectedStatus, setSelectedStatus] = useState<EntityStatus>('pending')
  const [selectedPriority, setSelectedPriority] = useState<Priority>('medium')
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('csv')
  const [notes, setNotes] = useState('')

  if (!action) return null

  const entityLabel =
    itemCount === 1 ? t(`entityTypes.${entityType}`) : t(`entityTypes.${entityType}_plural`)

  const actionLabel = t(`actions.${action.id.replace(/-/g, '')}`)
  const undoSeconds = Math.round(undoTtl / 1000)

  const handleConfirm = () => {
    const params: BulkActionParams = {}

    switch (action.id) {
      case 'update-status':
        params.status = selectedStatus
        break
      case 'change-priority':
        params.priority = selectedPriority
        break
      case 'export':
        params.exportFormat = selectedFormat
        break
      case 'escalate':
        params.notes = notes
        break
    }

    onConfirm(params)
  }

  const renderActionContent = () => {
    switch (action.id) {
      case 'update-status':
        return (
          <div className="space-y-3 py-4">
            <Label htmlFor="status-select">{t('confirmation.updateStatus.selectStatus')}</Label>
            <Select
              value={selectedStatus}
              onValueChange={(v) => setSelectedStatus(v as EntityStatus)}
            >
              <SelectTrigger id="status-select" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((status) => (
                  <SelectItem key={status} value={status}>
                    {t(`status.${status}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )

      case 'change-priority':
        return (
          <div className="space-y-3 py-4">
            <Label htmlFor="priority-select">
              {t('confirmation.changePriority.selectPriority')}
            </Label>
            <Select
              value={selectedPriority}
              onValueChange={(v) => setSelectedPriority(v as Priority)}
            >
              <SelectTrigger id="priority-select" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PRIORITY_OPTIONS.map((priority) => (
                  <SelectItem key={priority} value={priority}>
                    {t(`priority.${priority}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )

      case 'export':
        return (
          <div className="space-y-3 py-4">
            <Label htmlFor="format-select">{t('confirmation.export.selectFormat')}</Label>
            <Select
              value={selectedFormat}
              onValueChange={(v) => setSelectedFormat(v as ExportFormat)}
            >
              <SelectTrigger id="format-select" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EXPORT_FORMAT_OPTIONS.map((format) => (
                  <SelectItem key={format} value={format}>
                    {t(`confirmation.export.formats.${format}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )

      case 'escalate':
        return (
          <div className="space-y-3 py-4">
            <Label htmlFor="escalate-reason">{t('confirmation.escalate.reason')}</Label>
            <Textarea
              id="escalate-reason"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t('confirmation.escalate.reasonPlaceholder')}
              className="min-h-[80px]"
            />
          </div>
        )

      case 'delete':
        return (
          <div className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-950 rounded-md mt-4">
            <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm text-red-800 dark:text-red-200">
                {t('confirmation.delete.warning')}
              </p>
              <p className="text-xs text-red-600 dark:text-red-400">
                {t('confirmation.delete.permanentWarning')}
              </p>
            </div>
          </div>
        )

      case 'archive':
        return (
          <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-md mt-4">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              {t('confirmation.archive.note')}
            </p>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <AlertDialogContent
        className={cn('max-w-md w-[calc(100%-2rem)] sm:w-full', 'mx-4 sm:mx-auto')}
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <AlertDialogHeader>
          <AlertDialogTitle>
            {t(`confirmation.${action.id.replace(/-/g, '')}.title`, {
              defaultValue: t('confirmation.title', { action: actionLabel }),
            })}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {t(`confirmation.${action.id.replace(/-/g, '')}.description`, {
              count: itemCount,
              defaultValue: t('confirmation.description', {
                action: actionLabel.toLowerCase(),
                count: itemCount,
                entityType: entityLabel,
              }),
            })}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {renderActionContent()}

        {/* Undo availability notice */}
        {action.supportsUndo && !action.isDestructive && (
          <p className="text-xs text-muted-foreground mt-2">
            {t('confirmation.undoAvailable', { seconds: undoSeconds })}
          </p>
        )}

        <AlertDialogFooter className="flex-col-reverse gap-2 sm:flex-row sm:gap-0">
          <AlertDialogCancel onClick={onCancel} disabled={isProcessing} className="mt-0">
            {t('confirmation.cancel')}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isProcessing}
            className={cn(action.isDestructive && 'bg-red-600 hover:bg-red-700 focus:ring-red-600')}
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 me-2 animate-spin" />
                {t('confirmation.processing')}
              </>
            ) : (
              t('confirmation.confirm')
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export default BulkActionConfirmDialog
