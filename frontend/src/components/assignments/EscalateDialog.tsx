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
import { AlertTriangle } from 'lucide-react'

interface EscalateDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: (reason: string) => void | Promise<void>
  isSubmitting?: boolean
  supervisorName?: string
}

export function EscalateDialog({
  open,
  onClose,
  onConfirm,
  isSubmitting = false,
  supervisorName,
}: EscalateDialogProps): React.JSX.Element {
  const { t, i18n } = useTranslation('assignments')
  const isRTL = i18n.language === 'ar'
  const [reason, setReason] = useState('')

  const maxLength = 1000
  const canSubmit = reason.trim().length > 0 && !isSubmitting

  const handleSubmit = async (): Promise<void> => {
    if (!canSubmit) return
    await onConfirm(reason.trim())
    setReason('')
  }

  const handleClose = (): void => {
    if (!isSubmitting) {
      setReason('')
      onClose()
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent dir={isRTL ? 'rtl' : 'ltr'} className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            {t('escalate.title')}
          </DialogTitle>
          <DialogDescription>
            {supervisorName
              ? t('escalate.descriptionWithSupervisor', { name: supervisorName })
              : t('escalate.description')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="escalation-reason">
              {t('escalate.reasonLabel')} <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="escalation-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={t('escalate.reasonPlaceholder')}
              className="min-h-[100px]"
              maxLength={maxLength}
              disabled={isSubmitting}
              autoFocus
            />
            <p className="text-xs text-muted-foreground">
              {reason.length} / {maxLength} {t('common.characters')}
            </p>
          </div>

          {/* Warning */}
          <div className="flex gap-2 p-3 rounded-lg bg-yellow-50 dark:bg-yellow-950 text-yellow-900 dark:text-yellow-100 text-sm">
            <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">{t('escalate.warningTitle')}</p>
              <p className="text-xs mt-1">{t('escalate.warningDescription')}</p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={handleClose} disabled={isSubmitting}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit} variant="destructive">
            {isSubmitting ? t('escalate.escalating') : t('escalate.confirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
