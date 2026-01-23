/**
 * ConflictResolutionDialog Component
 * Feature: realtime-collaboration-indicators
 *
 * Dialog for resolving optimistic locking conflicts with:
 * - Visual diff of changes
 * - Three resolution strategies
 * - Manual merge editor option
 */

import { memo, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import type {
  OptimisticLockConflict,
  ConflictResolutionStrategy,
} from '@/hooks/useOptimisticLocking'
import {
  getConflictSummary,
  formatFieldName,
  formatFieldValue,
} from '@/hooks/useOptimisticLocking'
import { AlertTriangle, Server, User, Combine, ArrowRight, Clock, FileWarning } from 'lucide-react'
import type { JsonValue } from '@/types/common.types'

interface ConflictResolutionDialogProps {
  /** Whether the dialog is open */
  open: boolean
  /** Called when dialog should close */
  onOpenChange: (open: boolean) => void
  /** The conflict to resolve */
  conflict: OptimisticLockConflict | null
  /** Called when user selects a resolution strategy */
  onResolve: (strategy: ConflictResolutionStrategy) => void
  /** Loading state during resolution */
  isResolving?: boolean
}

interface FieldDiffProps {
  field: string
  localValue: JsonValue
  serverValue: JsonValue
  isRTL: boolean
}

const STRATEGY_ICONS = {
  use_server: Server,
  keep_local: User,
  manual_merge: Combine,
}

const STRATEGY_COLORS = {
  use_server: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  keep_local: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  manual_merge: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
}

/**
 * Individual field diff display
 */
const FieldDiff = memo(function FieldDiff({
  field,
  localValue,
  serverValue,
  isRTL,
}: FieldDiffProps) {
  const { t } = useTranslation('collaboration')
  const localStr = formatFieldValue(localValue)
  const serverStr = formatFieldValue(serverValue)

  return (
    <div className="rounded-lg border bg-muted/30 p-3" dir={isRTL ? 'rtl' : 'ltr'}>
      <p className="mb-2 text-sm font-medium">{formatFieldName(field)}</p>
      <div className="grid grid-cols-1 items-center gap-2 text-sm sm:grid-cols-[1fr_auto_1fr]">
        {/* Your changes */}
        <div className="rounded border border-green-200 bg-green-50 p-2 dark:border-green-800 dark:bg-green-900/20">
          <p className="mb-1 text-xs font-medium text-green-600 dark:text-green-400">
            {t('yourChanges')}
          </p>
          <p className="break-words text-green-800 dark:text-green-200">
            {localStr || <span className="italic text-muted-foreground">{t('empty')}</span>}
          </p>
        </div>

        {/* Arrow */}
        <div className="hidden justify-center sm:flex">
          <ArrowRight className={cn('h-5 w-5 text-muted-foreground', isRTL && 'rotate-180')} />
        </div>

        {/* Server state */}
        <div className="rounded border border-blue-200 bg-blue-50 p-2 dark:border-blue-800 dark:bg-blue-900/20">
          <p className="mb-1 text-xs font-medium text-blue-600 dark:text-blue-400">
            {t('serverState')}
          </p>
          <p className="break-words text-blue-800 dark:text-blue-200">
            {serverStr || <span className="italic text-muted-foreground">{t('empty')}</span>}
          </p>
        </div>
      </div>
    </div>
  )
})

/**
 * Strategy selection button
 */
const StrategyButton = memo(function StrategyButton({
  strategy,
  onClick,
  disabled,
  isRTL,
}: {
  strategy: ConflictResolutionStrategy
  onClick: () => void
  disabled?: boolean
  isRTL: boolean
}) {
  const Icon = STRATEGY_ICONS[strategy.type]

  return (
    <Button
      variant="outline"
      className={cn(
        'flex-1 h-auto p-4 flex flex-col items-center gap-2 text-center',
        'hover:border-primary hover:bg-primary/5',
        disabled && 'opacity-50 cursor-not-allowed',
      )}
      onClick={onClick}
      disabled={disabled}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <div className={cn('rounded-full p-2', STRATEGY_COLORS[strategy.type])}>
        <Icon className="size-5" />
      </div>
      <span className="font-medium">{strategy.label}</span>
      <span className="line-clamp-2 text-xs text-muted-foreground">{strategy.description}</span>
    </Button>
  )
})

/**
 * ConflictResolutionDialog component
 *
 * A dialog that shows when optimistic locking conflicts occur.
 * Displays a visual diff of changes and allows users to choose
 * how to resolve the conflict.
 */
export function ConflictResolutionDialog({
  open,
  onOpenChange,
  conflict,
  onResolve,
  isResolving = false,
}: ConflictResolutionDialogProps) {
  const { t, i18n } = useTranslation('collaboration')
  const isRTL = i18n.language === 'ar'

  // Get conflict summary for display
  const summary = useMemo(() => {
    if (!conflict) return null
    return getConflictSummary(conflict)
  }, [conflict])

  // Format timestamps for display
  const timestamps = useMemo(() => {
    if (!conflict) return null

    const clientDate = new Date(conflict.client_timestamp)
    const serverDate = new Date(conflict.server_timestamp)
    const diffMs = serverDate.getTime() - clientDate.getTime()
    const diffSeconds = Math.floor(diffMs / 1000)
    const diffMinutes = Math.floor(diffSeconds / 60)

    return {
      client: clientDate.toLocaleString(isRTL ? 'ar' : 'en'),
      server: serverDate.toLocaleString(isRTL ? 'ar' : 'en'),
      ago:
        diffMinutes > 0
          ? t('minutesAgo', { count: diffMinutes })
          : t('secondsAgo', { count: diffSeconds }),
    }
  }, [conflict, isRTL, t])

  if (!conflict || !summary) {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] max-w-2xl flex-col" dir={isRTL ? 'rtl' : 'ltr'}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-amber-600 dark:text-amber-500">
            <FileWarning className="size-5" />
            {t('conflictDetected')}
          </DialogTitle>
          <DialogDescription>{t('conflictDescription')}</DialogDescription>
        </DialogHeader>

        {/* Timestamp info */}
        <div className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
          <Clock className="size-4" />
          <span>{t('modifiedAgo', { time: timestamps?.ago })}</span>
        </div>

        {/* Changes diff */}
        <ScrollArea className="max-h-[300px] flex-1 pe-4">
          <div className="space-y-3">
            <h4 className="flex items-center gap-2 text-sm font-medium">
              <AlertTriangle className="size-4 text-amber-500" />
              {t('conflictingFields', { count: summary.changes.length })}
            </h4>

            {summary.changes.length > 0 ? (
              summary.changes.map((change) => (
                <FieldDiff
                  key={change.field}
                  field={change.field}
                  localValue={change.local}
                  serverValue={change.server}
                  isRTL={isRTL}
                />
              ))
            ) : (
              <p className="text-sm italic text-muted-foreground">{t('noVisibleChanges')}</p>
            )}
          </div>
        </ScrollArea>

        <Separator />

        {/* Resolution strategies */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium">{t('chooseResolution')}</h4>
          <div className="flex flex-col gap-3 sm:flex-row">
            {conflict.strategies.map((strategy) => (
              <StrategyButton
                key={strategy.type}
                strategy={strategy}
                onClick={() => onResolve(strategy)}
                disabled={isResolving}
                isRTL={isRTL}
              />
            ))}
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={isResolving}>
            {t('cancel', { ns: 'common' })}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/**
 * Simple conflict banner for inline display
 */
export function ConflictBanner({
  conflict: _conflict,
  onResolve,
  className,
}: {
  conflict: OptimisticLockConflict
  onResolve: () => void
  className?: string
}) {
  const { t, i18n } = useTranslation('collaboration')
  const isRTL = i18n.language === 'ar'

  return (
    <div
      className={cn(
        'flex items-center justify-between gap-3 px-4 py-3 rounded-lg',
        'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800',
        'text-amber-800 dark:text-amber-200',
        className,
      )}
      dir={isRTL ? 'rtl' : 'ltr'}
      role="alert"
    >
      <div className="flex items-center gap-2">
        <AlertTriangle className="size-5 shrink-0 text-amber-600 dark:text-amber-500" />
        <div>
          <p className="text-sm font-medium">{t('conflictDetected')}</p>
          <p className="text-xs text-amber-600 dark:text-amber-400">
            {t('conflictBannerDescription')}
          </p>
        </div>
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={onResolve}
        className="shrink-0 border-amber-300 text-amber-700 hover:bg-amber-100 dark:border-amber-700 dark:text-amber-300 dark:hover:bg-amber-900/40"
      >
        {t('resolveNow')}
      </Button>
    </div>
  )
}

export default ConflictResolutionDialog
