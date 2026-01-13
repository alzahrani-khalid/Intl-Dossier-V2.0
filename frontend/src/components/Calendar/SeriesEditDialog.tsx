/**
 * SeriesEditDialog Component
 * Feature: recurring-event-patterns
 *
 * A dialog for choosing how to edit or delete recurring events:
 * - Edit/delete only this occurrence
 * - Edit/delete this and all future occurrences
 * - Edit/delete all occurrences in the series
 *
 * Mobile-first design with full RTL support for Arabic.
 */

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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Calendar, Repeat, AlertTriangle } from 'lucide-react'
import { useState } from 'react'
import type { SeriesEditScope } from '@/types/recurrence.types'

interface SeriesEditDialogProps {
  /** Whether the dialog is open */
  isOpen: boolean
  /** Called when dialog is closed */
  onClose: () => void
  /** The action being performed */
  action: 'edit' | 'delete'
  /** Called when user confirms their choice */
  onConfirm: (scope: SeriesEditScope, reason?: string) => void
  /** Event title for display */
  eventTitle?: string
  /** Whether the action is in progress */
  isLoading?: boolean
}

export function SeriesEditDialog({
  isOpen,
  onClose,
  action,
  onConfirm,
  eventTitle,
  isLoading = false,
}: SeriesEditDialogProps) {
  const { t, i18n } = useTranslation()
  const isRTL = i18n.language === 'ar'

  const [selectedScope, setSelectedScope] = useState<SeriesEditScope>('single')
  const [reason, setReason] = useState('')

  const handleConfirm = () => {
    onConfirm(selectedScope, action === 'delete' ? reason : undefined)
  }

  const handleClose = () => {
    setSelectedScope('single')
    setReason('')
    onClose()
  }

  const isEdit = action === 'edit'
  const isDelete = action === 'delete'

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md" dir={isRTL ? 'rtl' : 'ltr'}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isDelete ? (
              <AlertTriangle className="h-5 w-5 text-destructive" />
            ) : (
              <Repeat className="h-5 w-5" />
            )}
            {isEdit ? t('calendar.series.confirmEdit') : t('calendar.series.confirmDelete')}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? t('calendar.series.confirmEditMessage')
              : t('calendar.series.confirmDeleteMessage')}
          </DialogDescription>
          {eventTitle && (
            <div className="mt-2 p-2 bg-muted rounded-md text-sm">
              <span className="font-medium">{eventTitle}</span>
            </div>
          )}
        </DialogHeader>

        <div className="py-4">
          <RadioGroup
            value={selectedScope}
            onValueChange={(value) => setSelectedScope(value as SeriesEditScope)}
            className="space-y-3"
          >
            {/* Single occurrence */}
            <div className="flex items-center space-x-2 rtl:space-x-reverse p-3 border rounded-lg hover:bg-muted/50 cursor-pointer">
              <RadioGroupItem value="single" id="scope-single" />
              <Label
                htmlFor="scope-single"
                className="flex-1 cursor-pointer flex items-center gap-2"
              >
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>
                  {isEdit ? t('calendar.series.editSingle') : t('calendar.series.deleteSingle')}
                </span>
              </Label>
            </div>

            {/* This and future occurrences */}
            <div className="flex items-center space-x-2 rtl:space-x-reverse p-3 border rounded-lg hover:bg-muted/50 cursor-pointer">
              <RadioGroupItem value="this_and_future" id="scope-future" />
              <Label
                htmlFor="scope-future"
                className="flex-1 cursor-pointer flex items-center gap-2"
              >
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className={`mx-1 text-muted-foreground ${isRTL ? 'rotate-180' : ''}`}>
                    &rarr;
                  </span>
                </div>
                <span>
                  {isEdit
                    ? t('calendar.series.editThisAndFuture')
                    : t('calendar.series.deleteThisAndFuture')}
                </span>
              </Label>
            </div>

            {/* All occurrences */}
            <div className="flex items-center space-x-2 rtl:space-x-reverse p-3 border rounded-lg hover:bg-muted/50 cursor-pointer">
              <RadioGroupItem value="all" id="scope-all" />
              <Label htmlFor="scope-all" className="flex-1 cursor-pointer flex items-center gap-2">
                <Repeat className="h-4 w-4 text-muted-foreground" />
                <span>
                  {isEdit ? t('calendar.series.editAll') : t('calendar.series.deleteAll')}
                </span>
              </Label>
            </div>
          </RadioGroup>

          {/* Cancellation reason (for delete only) */}
          {isDelete && (
            <div className="mt-4 space-y-2">
              <Label htmlFor="cancel-reason">{t('calendar.series.cancelReason')}</Label>
              <Textarea
                id="cancel-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={t('calendar.series.cancelReason')}
                rows={2}
              />
            </div>
          )}
        </div>

        <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
            className="w-full sm:w-auto"
          >
            {t('common.cancel')}
          </Button>
          <Button
            type="button"
            variant={isDelete ? 'destructive' : 'default'}
            onClick={handleConfirm}
            disabled={isLoading}
            className="w-full sm:w-auto"
          >
            {isLoading ? t('common.loading') : isEdit ? t('common.save') : t('common.delete')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default SeriesEditDialog
