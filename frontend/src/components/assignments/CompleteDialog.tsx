import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { CheckCircle2, AlertCircle } from 'lucide-react';

interface CompleteDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (notes: string) => void | Promise<void>;
  isSubmitting?: boolean;
  hasOptimisticLockWarning?: boolean;
}

export function CompleteDialog({
  open,
  onClose,
  onConfirm,
  isSubmitting = false,
  hasOptimisticLockWarning = false,
}: CompleteDialogProps): JSX.Element {
  const { t, i18n } = useTranslation('assignments');
  const isRTL = i18n.language === 'ar';
  const [notes, setNotes] = useState('');

  const maxLength = 2000;
  const canSubmit = !isSubmitting;

  const handleSubmit = async (): Promise<void> => {
    if (!canSubmit) return;
    await onConfirm(notes.trim());
    setNotes('');
  };

  const handleClose = (): void => {
    if (!isSubmitting) {
      setNotes('');
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent dir={isRTL ? 'rtl' : 'ltr'} className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            {t('complete.title')}
          </DialogTitle>
          <DialogDescription>
            {t('complete.description')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="completion-notes">
              {t('complete.notesLabel')}
            </Label>
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
            <div className="flex gap-2 p-3 rounded-lg bg-yellow-50 dark:bg-yellow-950 text-yellow-900 dark:text-yellow-100 text-sm">
              <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">{t('complete.lockWarningTitle')}</p>
                <p className="text-xs mt-1">{t('complete.lockWarningDescription')}</p>
              </div>
            </div>
          )}

          {/* Success Info */}
          <div className="flex gap-2 p-3 rounded-lg bg-green-50 dark:bg-green-950 text-green-900 dark:text-green-100 text-sm">
            <CheckCircle2 className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">{t('complete.successTitle')}</p>
              <ul className="text-xs mt-1 space-y-1 list-disc list-inside">
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
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit}
          >
            {isSubmitting ? t('complete.completing') : t('complete.confirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
