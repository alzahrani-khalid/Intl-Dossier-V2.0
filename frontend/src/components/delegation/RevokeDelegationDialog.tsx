/**
 * RevokeDelegationDialog Component
 * Dialog for revoking an existing delegation
 *
 * Feature: delegation-management
 */

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
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Loader2, XCircle, AlertTriangle } from 'lucide-react'
import { useRevokeDelegation } from '@/hooks/use-delegation'
import { useToast } from '@/hooks/use-toast'

interface RevokeDelegationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  delegationId: string
  granteeEmail: string
  onSuccess?: () => void
}

export function RevokeDelegationDialog({
  open,
  onOpenChange,
  delegationId,
  granteeEmail,
  onSuccess,
}: RevokeDelegationDialogProps) {
  const { t, i18n } = useTranslation('delegation')
  const { toast } = useToast()
  const isRTL = i18n.language === 'ar'

  const [reason, setReason] = useState('')
  const [showConfirm, setShowConfirm] = useState(false)

  const revokeMutation = useRevokeDelegation()

  const handleRevoke = async () => {
    try {
      await revokeMutation.mutateAsync({
        delegation_id: delegationId,
        reason: reason || undefined,
      })
      toast({
        title: t('revoke.success'),
        variant: 'default',
      })
      onOpenChange(false)
      setShowConfirm(false)
      setReason('')
      onSuccess?.()
    } catch (error) {
      toast({
        title: t('revoke.error'),
        description: error instanceof Error ? error.message : undefined,
        variant: 'destructive',
      })
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setShowConfirm(true)
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[425px]" dir={isRTL ? 'rtl' : 'ltr'}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <XCircle className="h-5 w-5" />
              {t('revoke.title')}
            </DialogTitle>
            <DialogDescription>{t('revoke.description')}</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            {/* Info about who we're revoking from */}
            <div className="bg-muted/50 rounded-lg p-4">
              <p className="text-sm">
                <span className="text-muted-foreground">{t('card.to')}: </span>
                <span className="font-medium">{granteeEmail}</span>
              </p>
            </div>

            {/* Reason (optional) */}
            <div className="space-y-2">
              <Label htmlFor="revoke-reason">{t('revoke.form.reason')}</Label>
              <Textarea
                id="revoke-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={t('revoke.form.reasonPlaceholder')}
                className="min-h-[80px] resize-none"
              />
            </div>
          </form>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="min-h-11"
            >
              {t('common:common.cancel')}
            </Button>
            <Button
              type="submit"
              variant="destructive"
              onClick={handleSubmit}
              disabled={revokeMutation.isPending}
              className="min-h-11"
            >
              {revokeMutation.isPending ? (
                <>
                  <Loader2 className={`h-4 w-4 animate-spin ${isRTL ? 'ms-2' : 'me-2'}`} />
                  {t('common:common.loading')}
                </>
              ) : (
                <>
                  <XCircle className={`h-4 w-4 ${isRTL ? 'ms-2' : 'me-2'}`} />
                  {t('revoke.buttonText')}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent dir={isRTL ? 'rtl' : 'ltr'}>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              {t('revoke.title')}
            </AlertDialogTitle>
            <AlertDialogDescription>{t('revoke.description')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel className="min-h-11">{t('common:common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRevoke}
              className="min-h-11 bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {revokeMutation.isPending ? (
                <>
                  <Loader2 className={`h-4 w-4 animate-spin ${isRTL ? 'ms-2' : 'me-2'}`} />
                  {t('common:common.loading')}
                </>
              ) : (
                t('revoke.confirm')
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
