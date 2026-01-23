import { useState } from 'react'
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
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { CheckCircle2, AlertCircle } from 'lucide-react'

interface CompleteDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: (notes: string) => void | Promise<void>
  isSubmitting?: boolean
  hasOptimisticLockWarning?: boolean
}

export function CompleteDialog({
  open,
  onClose,
  onConfirm,
  isSubmitting = false,
  hasOptimisticLockWarning = false,
}: CompleteDialogProps): React.JSX.Element {
  const { t, i18n } = useTranslation('assignments')
  const isRTL = i18n.language === 'ar'
  const [notes, setNotes] = useState('')

  const maxLength = 2000
  const canSubmit = !isSubmitting

  const handleSubmit = async (): Promise<void> => {
    if (!canSubmit) return
    await onConfirm(notes.trim())
    setNotes('')
  }

  const handleClose = (): void => {
    if (!isSubmitting) {
      setNotes('')
      onClose()
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent dir={isRTL ? 'rtl' : 'ltr'} className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="size-5 text-green-600" />
            {t('complete.title')}
          </DialogTitle>
          <DialogDescription>{t('complete.description')}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="completion-notes">{t('complete.notesLabel')}</Label>
            <Textarea
              id="completion-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t('complete.notesPlaceholder')}
              className="min-h-[100px]"
              maxLength={maxLength}
              disabled={isSubmitting}
              autoFocus
            />
            <p className="text-xs text-muted-foreground">
              {notes.length} / {maxLength} {t('common.characters')}
            </p>
          </div>

          {/* Optimistic Lock Warning */}
          {hasOptimisticLockWarning && (
            <div className="flex gap-2 rounded-lg bg-yellow-50 p-3 text-sm text-yellow-900 dark:bg-yellow-950 dark:text-yellow-100">
              <AlertCircle className="mt-0.5 size-5 shrink-0" />
              <div>
                <p className="font-medium">{t('complete.lockWarningTitle')}</p>
                <p className="mt-1 text-xs">{t('complete.lockWarningDescription')}</p>
              </div>
            </div>
          )}

          {/* Success Info */}
          <div className="flex gap-2 rounded-lg bg-green-50 p-3 text-sm text-green-900 dark:bg-green-950 dark:text-green-100">
            <CheckCircle2 className="mt-0.5 size-5 shrink-0" />
            <div>
              <p className="font-medium">{t('complete.successTitle')}</p>
              <ul className="mt-1 list-inside list-disc space-y-1 text-xs">
                <li>{t('complete.successSLA')}</li>
                <li>{t('complete.successTimeline')}</li>
                <li>{t('complete.successNotification')}</li>
              </ul>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={handleClose} disabled={isSubmitting}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit}>
            {isSubmitting ? t('complete.completing') : t('complete.confirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
