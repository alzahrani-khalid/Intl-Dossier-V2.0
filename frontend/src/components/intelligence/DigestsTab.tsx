import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useDirection } from '@/hooks/useDirection'
import {
  useDigestSubscriptions,
  useDigests,
  useUnsubscribeFromDigest,
  type Digest,
} from '@/domains/signals/hooks/useDigests'
import type { DossierType } from '@/lib/dossier-type-guards'
import { DigestCard, DossierGlyph, getDigestDossierName } from './DigestCard'
import { DigestReader } from './DigestReader'
import { DigestSubscribeDrawer } from './DigestSubscribeDrawer'

interface DigestsTabProps {
  dossierId?: string
}

export function DigestsTab({ dossierId }: DigestsTabProps): React.ReactElement {
  const { t } = useTranslation('intelligence-digests')
  const { isRTL } = useDirection()
  const { data: digests = [], isLoading, isError, refetch } = useDigests({ dossierId })
  const { data: subscriptions = [] } = useDigestSubscriptions(dossierId)
  const unsubscribe = useUnsubscribeFromDigest()
  const [selectedDigestId, setSelectedDigestId] = useState<string | null>(null)
  const [subscribeOpen, setSubscribeOpen] = useState(false)

  const selectedDigest = selectedDigestId
    ? digests.find((digest) => digest.id === selectedDigestId)
    : null
  const canSubscribeFromContext = dossierId !== undefined
  const contextDigest = digests[0]
  const contextName = contextDigest
    ? getDigestDossierName(contextDigest, isRTL, t('digest.untitledDossier'))
    : t('digest.untitledDossier')
  const contextType =
    contextDigest?.dossier_type === 'elected_official' ? 'person' : contextDigest?.dossier_type

  const handleUnsubscribe = (digest: Digest): void => {
    unsubscribe.mutate({ dossierId: digest.dossier_id })
  }

  if (selectedDigest) {
    return <DigestReader digestId={selectedDigest.id} onBack={() => setSelectedDigestId(null)} />
  }

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-start font-semibold text-ink [font-size:var(--t-page-title)]">
          {t('header')}
        </h2>
        <Button
          variant="outline"
          size="sm"
          className="ms-auto text-ink-mute"
          disabled={!canSubscribeFromContext}
          onClick={() => setSubscribeOpen(true)}
        >
          <Plus className="h-4 w-4 me-2" aria-hidden="true" />
          {t('action.subscribe')}
        </Button>
      </div>

      <details className="rounded-sm border border-line bg-surface">
        <summary className="cursor-pointer ps-4 pe-4 pt-3 pb-3 text-start [font-size:var(--t-body)] font-medium text-ink">
          {t('subscriptions')}
        </summary>
        <div className="border-t border-line">
          {subscriptions.length === 0 ? (
            <p className="ps-4 pe-4 pt-3 pb-3 text-start text-sm text-ink-mute">
              {t('empty.noSubscriptions.body')}
            </p>
          ) : (
            subscriptions.map((subscription) => (
              <div
                key={subscription.id}
                className="flex flex-wrap items-center gap-2 border-b border-line ps-4 pe-4 pt-2 pb-2 last:border-0"
                style={{ minHeight: 'var(--row-h)' }}
              >
                <DossierGlyph type={subscription.dossier_type} />
                <bdi className="font-medium text-ink">
                  {isRTL
                    ? (subscription.dossier_name_ar ?? subscription.dossier_name_en)
                    : (subscription.dossier_name_en ?? subscription.dossier_name_ar)}
                </bdi>
                <span className="rounded-full bg-accent-soft ps-2 pe-2 pt-0.5 pb-0.5 font-mono text-xs uppercase text-accent-ink">
                  {t(`chip.${subscription.frequency}`)}
                </span>
                <Button variant="ghost" size="sm" className="ms-auto text-ink-mute">
                  {t('action.editFrequency')}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-ink-mute"
                  onClick={() => unsubscribe.mutate({ dossierId: subscription.dossier_id })}
                >
                  {t('action.unsubscribe')}
                </Button>
              </div>
            ))
          )}
        </div>
      </details>

      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((index) => (
            <div
              key={index}
              className="animate-pulse rounded-[var(--radius)] border border-line bg-surface ps-4 pe-4 pt-4 pb-4"
              style={{ minHeight: 'var(--row-h)' }}
            >
              <div className="mb-3 h-5 w-2/3 rounded bg-line-soft" />
              <div className="h-12 w-full rounded bg-line-soft" />
            </div>
          ))}
        </div>
      )}

      {!isLoading && isError && (
        <div
          className="rounded-sm border border-line bg-surface ps-4 pe-4 pt-4 pb-4 text-start"
          role="alert"
        >
          <p className="text-sm text-danger">{t('error.load')}</p>
          <Button
            variant="ghost"
            size="sm"
            className="mt-2 text-accent-ink"
            onClick={() => void refetch()}
          >
            <RefreshCw className="h-4 w-4 me-2" aria-hidden="true" />
            {t('action.retry')}
          </Button>
        </div>
      )}

      {!isLoading && !isError && digests.length === 0 && (
        <div className="rounded-sm border border-line bg-surface ps-4 pe-4 pt-8 pb-8 text-center">
          <p className="text-sm font-medium text-ink">
            {subscriptions.length === 0
              ? t('empty.noSubscriptions.heading')
              : t('empty.noDraftPublished.heading')}
          </p>
          <p className="mt-1 text-sm text-ink-mute">
            {subscriptions.length === 0
              ? t('empty.noSubscriptions.body')
              : t('empty.noDraftPublished.body')}
          </p>
        </div>
      )}

      {!isLoading && !isError && digests.length > 0 && (
        <div className="grid gap-4 2xl:grid-cols-2">
          {digests.map((digest) => (
            <DigestCard
              key={digest.id}
              digest={digest}
              onOpen={() => setSelectedDigestId(digest.id)}
              onUnsubscribe={() => handleUnsubscribe(digest)}
              onGenerateNow={() => setSelectedDigestId(digest.id)}
            />
          ))}
        </div>
      )}

      {canSubscribeFromContext && contextType !== undefined && (
        <DigestSubscribeDrawer
          dossierId={dossierId}
          dossierType={contextType as DossierType}
          dossierName={contextName}
          isOpen={subscribeOpen}
          onClose={() => setSubscribeOpen(false)}
        />
      )}
    </div>
  )
}
