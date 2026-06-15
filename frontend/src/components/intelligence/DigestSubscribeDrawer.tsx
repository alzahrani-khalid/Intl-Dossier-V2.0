import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Loader2 } from 'lucide-react'
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useDirection } from '@/hooks/useDirection'
import {
  useDigestSubscriptions,
  useSubscribeToDigest,
  useUnsubscribeFromDigest,
  type DigestFrequency,
} from '@/domains/signals/hooks/useDigests'
import type { DossierType } from '@/lib/dossier-type-guards'

const FREQUENCIES: DigestFrequency[] = ['daily', 'weekly', 'monthly']

interface DigestSubscribeDrawerProps {
  dossierId: string
  dossierType: DossierType
  dossierName: string
  isOpen: boolean
  onClose: () => void
}

export function DigestSubscribeDrawer({
  dossierId,
  dossierType,
  dossierName,
  isOpen,
  onClose,
}: DigestSubscribeDrawerProps): React.ReactElement {
  const { t } = useTranslation('intelligence-digests')
  const { isRTL } = useDirection()
  const [frequency, setFrequency] = useState<DigestFrequency>('weekly')
  const [confirmOpen, setConfirmOpen] = useState(false)

  const { data: subscriptions = [] } = useDigestSubscriptions(dossierId)
  const subscribe = useSubscribeToDigest()
  const unsubscribe = useUnsubscribeFromDigest()

  const activeSubscription = useMemo(
    () => subscriptions.find((item) => item.dossier_id === dossierId),
    [dossierId, subscriptions],
  )

  const isBusy = subscribe.isPending || unsubscribe.isPending

  const handleSubscribe = (): void => {
    subscribe.mutate(
      {
        dossierId,
        dossierType,
        frequency,
        frequencyConfig: { channels: ['in_app'] },
      },
      { onSuccess: onClose },
    )
  }

  const handleUnsubscribe = (): void => {
    unsubscribe.mutate({ dossierId }, { onSuccess: onClose })
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent
          className="max-w-none rounded-none ps-4 pe-4 sm:rounded-none sm:ps-6 sm:pe-6"
          style={{
            width: 'min(100vw, 480px)',
            height: '100dvh',
            insetInlineEnd: 0,
            insetInlineStart: 'auto',
            insetBlockStart: 0,
            insetBlockEnd: 0,
            transform: 'none',
            boxShadow: 'var(--shadow-lg)',
          }}
          dir={isRTL ? 'rtl' : 'ltr'}
        >
          <DialogHeader>
            <DialogTitle className="text-start [font-size:var(--t-card-title)]">
              {t('action.subscribe')}
            </DialogTitle>
            <DialogDescription className="text-start text-sm text-ink-mute">
              <bdi>{dossierName}</bdi>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-4 pb-4">
            {activeSubscription ? (
              <div className="rounded-sm border border-line bg-bg ps-3 pe-3 pt-3 pb-3">
                <span className="inline-flex rounded-full bg-accent-soft ps-2 pe-2 pt-0.5 pb-0.5 font-mono text-xs uppercase text-accent-ink">
                  {t(`chip.${activeSubscription.frequency}`)}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="ms-2 text-ink-mute"
                  onClick={() => setConfirmOpen(true)}
                >
                  {t('action.unsubscribe')}
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2" role="radiogroup">
                  {FREQUENCIES.map((value) => (
                    <button
                      key={value}
                      type="button"
                      role="radio"
                      aria-checked={frequency === value}
                      onClick={() => setFrequency(value)}
                      className={[
                        'rounded-sm border ps-3 pe-3 pt-2 pb-2 text-sm transition-colors',
                        frequency === value
                          ? 'border-[var(--accent)] bg-accent-soft text-accent-ink'
                          : 'border-line bg-surface text-ink-mute hover:bg-line-soft',
                      ].join(' ')}
                    >
                      {t(`frequency.${value}`)}
                    </button>
                  ))}
                </div>
                {subscribe.isError && (
                  <p className="text-start text-xs text-danger">{t('error.subscribe')}</p>
                )}
              </div>
            )}
          </div>

          <DialogFooter className="mt-auto">
            <Button type="button" variant="outline" onClick={onClose} disabled={isBusy}>
              {t('action.cancel')}
            </Button>
            {!activeSubscription && (
              <Button type="button" onClick={handleSubscribe} disabled={isBusy}>
                {isBusy && <Loader2 className="h-4 w-4 animate-spin me-2" aria-hidden="true" />}
                {t('action.subscribe')}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent dir={isRTL ? 'rtl' : 'ltr'}>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-start">
              {t('confirm.unsubscribe.heading')}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-start">
              {t('confirm.unsubscribe.body')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('confirm.unsubscribe.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleUnsubscribe}
              className="bg-danger text-[var(--danger-fg)] hover:bg-danger"
            >
              {t('confirm.unsubscribe.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
