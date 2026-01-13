/**
 * Classification Change Dialog Component
 *
 * Modal dialog for requesting or approving classification changes.
 * Mobile-first with RTL support.
 */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AlertTriangle, ArrowRight, Check, X } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { ClassificationBadge } from './ClassificationBadge'
import { ClassificationSelector } from './ClassificationSelector'
import type {
  DocumentClassification,
  ClassifiedDocument,
} from '@/types/document-classification.types'
import { requiresApproval, CLASSIFICATION_LEVELS } from '@/types/document-classification.types'

interface ClassificationChangeDialogProps {
  document: ClassifiedDocument | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (
    documentId: string,
    newClassification: DocumentClassification,
    reason: string,
  ) => Promise<void>
  userClearance?: number
  isLoading?: boolean
}

export function ClassificationChangeDialog({
  document,
  open,
  onOpenChange,
  onSubmit,
  userClearance = 3,
  isLoading = false,
}: ClassificationChangeDialogProps) {
  const { t, i18n } = useTranslation('document-classification')
  const isRTL = i18n.language === 'ar'

  const [newClassification, setNewClassification] = useState<DocumentClassification>(
    document?.classification || 'internal',
  )
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async () => {
    if (!document) return

    if (!reason.trim()) {
      setError(t('changeDialog.reasonRequired', 'Please provide a reason for this change'))
      return
    }

    if (reason.trim().length < 10) {
      setError(t('changeDialog.reasonTooShort', 'Reason must be at least 10 characters'))
      return
    }

    setError(null)

    try {
      await onSubmit(document.id, newClassification, reason)
      // Reset form on success
      setReason('')
      setNewClassification(document.classification)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to change classification')
    }
  }

  const isUpgrade = document
    ? CLASSIFICATION_LEVELS[newClassification] > CLASSIFICATION_LEVELS[document.classification]
    : false

  const needsApproval = document
    ? requiresApproval(document.classification, newClassification)
    : false
  const noChange = document?.classification === newClassification

  // Reset state when document changes
  if (document && document.classification !== newClassification && !open) {
    setNewClassification(document.classification)
    setReason('')
    setError(null)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]" dir={isRTL ? 'rtl' : 'ltr'}>
        <DialogHeader>
          <DialogTitle>{t('changeDialog.title', 'Change Classification')}</DialogTitle>
          <DialogDescription>
            {t('changeDialog.description', 'Update the classification level for this document')}
          </DialogDescription>
        </DialogHeader>

        {document && (
          <div className="space-y-4 py-4">
            {/* Document info */}
            <div className="rounded-lg border bg-muted/50 p-3">
              <p className="font-medium text-sm">{document.file_name}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {t('changeDialog.currentClassification', 'Current classification')}:
              </p>
              <div className="mt-2">
                <ClassificationBadge classification={document.classification} />
              </div>
            </div>

            {/* New classification selector */}
            <ClassificationSelector
              value={newClassification}
              onChange={setNewClassification}
              userClearance={userClearance}
              label={t('changeDialog.newClassification', 'New Classification')}
            />

            {/* Visual change indicator */}
            {!noChange && (
              <div className="flex items-center justify-center gap-3 py-2">
                <ClassificationBadge
                  classification={document.classification}
                  size="sm"
                  showTooltip={false}
                />
                <ArrowRight
                  className={`h-4 w-4 text-muted-foreground ${isRTL ? 'rotate-180' : ''}`}
                />
                <ClassificationBadge
                  classification={newClassification}
                  size="sm"
                  showTooltip={false}
                />
              </div>
            )}

            {/* Warning for upgrades requiring approval */}
            {needsApproval && (
              <Alert
                variant="destructive"
                className="border-amber-500 bg-amber-50 dark:bg-amber-950"
              >
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <AlertTitle className="text-amber-700 dark:text-amber-300">
                  {t('changeDialog.approvalRequired', 'Approval Required')}
                </AlertTitle>
                <AlertDescription className="text-amber-600 dark:text-amber-400">
                  {t(
                    'changeDialog.approvalDescription',
                    'Upgrading classification requires administrator approval. Your request will be submitted for review.',
                  )}
                </AlertDescription>
              </Alert>
            )}

            {/* Reason input */}
            <div className="space-y-2">
              <Label htmlFor="reason">
                {t('changeDialog.reason', 'Reason for Change')}{' '}
                <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={t(
                  'changeDialog.reasonPlaceholder',
                  'Explain why this classification change is needed...',
                )}
                className="min-h-[100px]"
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">
                {t('changeDialog.reasonHint', 'Minimum 10 characters required')}
              </p>
            </div>

            {/* Error message */}
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>
        )}

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            <X className="h-4 w-4 me-2" />
            {t('common.cancel', 'Cancel')}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading || noChange}
            className={needsApproval ? 'bg-amber-600 hover:bg-amber-700' : ''}
          >
            {isLoading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent me-2" />
            ) : (
              <Check className="h-4 w-4 me-2" />
            )}
            {needsApproval
              ? t('changeDialog.submitForApproval', 'Submit for Approval')
              : t('changeDialog.applyChange', 'Apply Change')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default ClassificationChangeDialog
