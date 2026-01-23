/**
 * AutoSaveFormWrapper Component
 *
 * A wrapper component that adds auto-save functionality to any form.
 * Provides draft restoration, progress tracking, and visual feedback.
 *
 * Features:
 * - Automatic draft saving to IndexedDB
 * - Draft restoration banner
 * - Progress indicator
 * - Unsaved changes warning
 * - Mobile-first, RTL-compatible design
 *
 * @module components/Forms/AutoSaveFormWrapper
 */

import { useEffect, useCallback, useState, createContext, useContext, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'motion/react'
import { useBlocker } from '@tanstack/react-router'
import { Save, RotateCcw, X, Clock, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { useAutoSaveForm } from '@/hooks/useAutoSaveForm'
import type { FormDraft } from '@/types/form-auto-save.types'
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

// =============================================================================
// TYPES
// =============================================================================

interface AutoSaveFormContextValue<T extends Record<string, unknown>> {
  /** Current draft data */
  draft: FormDraft<T> | null
  /** Update draft with new data */
  updateDraft: (data: Partial<T>, step?: number) => void
  /** Clear the draft */
  clearDraft: () => Promise<void>
  /** Manually save the draft */
  saveDraft: () => Promise<void>
  /** Restore the draft */
  restoreDraft: () => Promise<FormDraft<T> | null>
  /** Check if a field is completed */
  isFieldCompleted: (fieldName: string) => boolean
  /** Current save status */
  status: {
    isSaving: boolean
    hasRestored: boolean
    hasUnsavedChanges: boolean
    lastSavedAt: string | null
    error: Error | null
  }
  /** Form progress */
  progress: {
    percentage: number
    completedFields: number
    totalFields: number
    estimatedMinutesRemaining: number
  }
}

interface AutoSaveFormWrapperProps<T extends Record<string, unknown>> {
  /** Unique key for the form (used for storage) */
  formKey: string
  /** Required fields for progress calculation */
  requiredFields?: string[]
  /** Debounce time in ms for auto-save */
  debounceMs?: number
  /** TTL for drafts in ms */
  ttlMs?: number
  /** Callback when draft is restored */
  onDraftRestored?: (draft: FormDraft<T>) => void
  /** Callback when save succeeds */
  onSaveSuccess?: (draft: FormDraft<T>) => void
  /** Callback when save fails */
  onSaveError?: (error: Error) => void
  /** Show draft banner */
  showDraftBanner?: boolean
  /** Show progress indicator */
  showProgress?: boolean
  /** Show save status */
  showSaveStatus?: boolean
  /** Block navigation when unsaved changes exist */
  blockNavigation?: boolean
  /** Additional class names */
  className?: string
  /** Child content */
  children: ReactNode
}

// =============================================================================
// CONTEXT
// =============================================================================

const AutoSaveFormContext = createContext<AutoSaveFormContextValue<any> | null>(null)

export function useAutoSaveFormContext<T extends Record<string, unknown>>() {
  const context = useContext(AutoSaveFormContext)
  if (!context) {
    throw new Error('useAutoSaveFormContext must be used within an AutoSaveFormWrapper')
  }
  return context as AutoSaveFormContextValue<T>
}

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

interface DraftBannerProps<T extends Record<string, unknown>> {
  draft: FormDraft<T>
  onRestore: () => void
  onDiscard: () => void
  isRTL: boolean
}

function DraftBanner<T extends Record<string, unknown>>({
  draft,
  onRestore,
  onDiscard,
  isRTL,
}: DraftBannerProps<T>) {
  const { t } = useTranslation('common')

  const savedDate = new Date(draft.savedAt)
  const now = new Date()
  const diffMs = now.getTime() - savedDate.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  let timeAgo: string
  if (diffDays > 0) {
    timeAgo = t('forms.time_ago_days', { count: diffDays })
  } else if (diffHours > 0) {
    timeAgo = t('forms.time_ago_hours', { count: diffHours })
  } else {
    timeAgo = t('forms.time_ago_minutes', { count: diffMins })
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className={cn(
        'flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between',
        'bg-amber-50 dark:bg-amber-950/30',
        'border border-amber-200 dark:border-amber-800',
        'rounded-lg',
      )}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <div className="flex items-center gap-3">
        <RotateCcw className="h-5 w-5 text-amber-600 dark:text-amber-400" />
        <div>
          <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
            {t('forms.draft_found')}
          </p>
          <p className="text-xs text-amber-600 dark:text-amber-400">
            {t('forms.saved_time_ago', { time: timeAgo })} ({draft.progress}% {t('forms.complete')})
          </p>
        </div>
      </div>

      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onDiscard}
          className="flex-1 sm:flex-none"
        >
          <X className="h-4 w-4 me-1" />
          {t('forms.discard_draft')}
        </Button>
        <Button
          type="button"
          size="sm"
          onClick={onRestore}
          className="flex-1 sm:flex-none bg-amber-600 hover:bg-amber-700 text-white"
        >
          <RotateCcw className="h-4 w-4 me-1" />
          {t('forms.restore_draft')}
        </Button>
      </div>
    </motion.div>
  )
}

interface ProgressIndicatorProps {
  progress: {
    percentage: number
    completedFields: number
    totalFields: number
    estimatedMinutesRemaining: number
  }
  isRTL: boolean
}

function ProgressIndicator({ progress, isRTL }: ProgressIndicatorProps) {
  const { t } = useTranslation('common')

  return (
    <div className="space-y-2" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-600 dark:text-gray-400">{t('forms.progress_label')}</span>
        <span className="font-medium text-gray-900 dark:text-gray-100">
          {progress.completedFields} / {progress.totalFields} {t('forms.fields')}
        </span>
      </div>

      <Progress value={progress.percentage} className="h-2" />

      {progress.estimatedMinutesRemaining > 0 && (
        <p className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
          <Clock className="h-3 w-3" />
          {t('forms.time_remaining', { minutes: progress.estimatedMinutesRemaining })}
        </p>
      )}
    </div>
  )
}

interface SaveStatusIndicatorProps {
  status: {
    isSaving: boolean
    hasUnsavedChanges: boolean
    lastSavedAt: string | null
    error: Error | null
  }
  isRTL: boolean
}

function SaveStatusIndicator({ status, isRTL }: SaveStatusIndicatorProps) {
  const { t } = useTranslation('common')

  if (status.error) {
    return (
      <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
        <AlertCircle className="h-4 w-4" />
        <span className="text-xs">{t('forms.save_error')}</span>
      </div>
    )
  }

  if (status.isSaving) {
    return (
      <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-xs">{t('forms.saving')}</span>
      </div>
    )
  }

  if (status.hasUnsavedChanges) {
    return (
      <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
        <Save className="h-4 w-4" />
        <span className="text-xs">{t('forms.unsaved_changes')}</span>
      </div>
    )
  }

  if (status.lastSavedAt) {
    const savedDate = new Date(status.lastSavedAt)
    return (
      <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
        <CheckCircle2 className="h-4 w-4" />
        <span className="text-xs">
          {t('forms.saved_at', {
            time: savedDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          })}
        </span>
      </div>
    )
  }

  return null
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function AutoSaveFormWrapper<T extends Record<string, unknown>>({
  formKey,
  requiredFields,
  debounceMs = 1000,
  ttlMs,
  onDraftRestored,
  onSaveSuccess,
  onSaveError,
  showDraftBanner = true,
  showProgress = true,
  showSaveStatus = true,
  blockNavigation = true,
  className,
  children,
}: AutoSaveFormWrapperProps<T>) {
  const { t, i18n } = useTranslation('common')
  const isRTL = i18n.language === 'ar'

  // Auto-save hook
  const autoSave = useAutoSaveForm<T>({
    formKey,
    requiredFields,
    debounceMs,
    ttlMs,
    onDraftRestored,
    onSaveSuccess,
    onSaveError,
  })

  // Local state
  const [showBanner, setShowBanner] = useState(false)
  const [showLeaveDialog, setShowLeaveDialog] = useState(false)
  const [pendingNavigation, setPendingNavigation] = useState<(() => void) | null>(null)

  // Check for existing draft on mount
  useEffect(() => {
    if (autoSave.draft && !autoSave.status.hasRestored) {
      setShowBanner(true)
    }
  }, [autoSave.draft, autoSave.status.hasRestored])

  // Handle draft restoration
  const handleRestore = useCallback(async () => {
    await autoSave.restoreDraft()
    setShowBanner(false)
  }, [autoSave])

  // Handle draft discard
  const handleDiscard = useCallback(async () => {
    await autoSave.clearDraft()
    setShowBanner(false)
  }, [autoSave])

  // Block navigation when unsaved changes exist
  useBlocker({
    blockerFn: () => {
      if (autoSave.status.hasUnsavedChanges && blockNavigation) {
        setShowLeaveDialog(true)
        return true
      }
      return false
    },
    condition: autoSave.status.hasUnsavedChanges && blockNavigation,
  })

  // Handle leave confirmation
  const handleLeaveConfirm = useCallback(() => {
    setShowLeaveDialog(false)
    if (pendingNavigation) {
      pendingNavigation()
      setPendingNavigation(null)
    }
  }, [pendingNavigation])

  const handleLeaveCancel = useCallback(() => {
    setShowLeaveDialog(false)
    setPendingNavigation(null)
  }, [])

  // Context value
  const contextValue: AutoSaveFormContextValue<T> = {
    draft: autoSave.draft,
    updateDraft: autoSave.updateDraft,
    clearDraft: autoSave.clearDraft,
    saveDraft: autoSave.saveDraft,
    restoreDraft: autoSave.restoreDraft,
    isFieldCompleted: autoSave.isFieldCompleted,
    status: autoSave.status,
    progress: autoSave.progress,
  }

  return (
    <AutoSaveFormContext.Provider value={contextValue}>
      <div className={cn('space-y-4', className)} dir={isRTL ? 'rtl' : 'ltr'}>
        {/* Draft restoration banner */}
        <AnimatePresence>
          {showDraftBanner && showBanner && autoSave.draft && (
            <DraftBanner
              draft={autoSave.draft}
              onRestore={handleRestore}
              onDiscard={handleDiscard}
              isRTL={isRTL}
            />
          )}
        </AnimatePresence>

        {/* Progress and status row */}
        {(showProgress || showSaveStatus) && (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {showProgress && autoSave.progress.totalFields > 0 && (
              <div className="flex-1 max-w-md">
                <ProgressIndicator progress={autoSave.progress} isRTL={isRTL} />
              </div>
            )}

            {showSaveStatus && <SaveStatusIndicator status={autoSave.status} isRTL={isRTL} />}
          </div>
        )}

        {/* Form content */}
        {children}

        {/* Leave confirmation dialog */}
        <AlertDialog open={showLeaveDialog} onOpenChange={setShowLeaveDialog}>
          <AlertDialogContent dir={isRTL ? 'rtl' : 'ltr'}>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('forms.unsaved_changes_title')}</AlertDialogTitle>
              <AlertDialogDescription>
                {t('forms.unsaved_changes_description')}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={handleLeaveCancel}>{t('forms.stay')}</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleLeaveConfirm}
                className="bg-red-600 hover:bg-red-700"
              >
                {t('forms.leave_anyway')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AutoSaveFormContext.Provider>
  )
}

export default AutoSaveFormWrapper
