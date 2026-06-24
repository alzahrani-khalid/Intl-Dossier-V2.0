import { useMemo, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useDirection } from '@/hooks/useDirection'
import { supabase } from '@/lib/supabase'
import { digestKeys, type DigestFrequency } from '@/domains/signals/hooks/useDigests'

const FREQUENCIES: DigestFrequency[] = ['daily', 'weekly', 'monthly']

interface GenerateDigestButtonProps {
  dossierId: string
  period: DigestFrequency
}

interface DigestPreview {
  dossier_id?: string
  period?: string
  period_key?: string
  period_start?: string
  period_end?: string
  clearance_level?: number
  counts?: {
    signals?: number
    engagements?: number
    commitments_due?: number
    commitments?: number
    status_changes?: number
  }
  signals?: Array<Record<string, unknown>>
  engagements?: Array<Record<string, unknown>>
  commitments_due?: Array<Record<string, unknown>>
  commitments?: Array<Record<string, unknown>>
  status_changes?: Array<Record<string, unknown>>
}

function arrayCount(value: unknown): number {
  return Array.isArray(value) ? value.length : 0
}

function countPreviewItems(preview: DigestPreview): {
  signals: number
  engagements: number
  commitments: number
} {
  return {
    signals: preview.counts?.signals ?? arrayCount(preview.signals),
    engagements: preview.counts?.engagements ?? arrayCount(preview.engagements),
    commitments:
      preview.counts?.commitments_due ??
      preview.counts?.commitments ??
      arrayCount(preview.commitments_due ?? preview.commitments),
  }
}

function periodLabel(period: DigestFrequency): string {
  return period.charAt(0).toUpperCase() + period.slice(1)
}

function renderSummaryText(preview: DigestPreview, period: DigestFrequency): string {
  const counts = countPreviewItems(preview)
  return `${periodLabel(period)} digest: ${counts.signals} signals, ${counts.engagements} engagements, ${counts.commitments} commitments.`
}

export function GenerateDigestButton({
  dossierId,
  period,
}: GenerateDigestButtonProps): React.ReactElement {
  const { t } = useTranslation('intelligence-digests')
  const { isRTL } = useDirection()
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [pickedPeriod, setPickedPeriod] = useState<DigestFrequency>(period)
  const [preview, setPreview] = useState<DigestPreview | null>(null)

  const counts = useMemo(() => (preview ? countPreviewItems(preview) : null), [preview])

  const generateMutation = useMutation<DigestPreview, Error>({
    mutationFn: async (): Promise<DigestPreview> => {
      const { data, error } = await supabase.rpc('generate_digest', {
        p_dossier_id: dossierId,
        p_period: pickedPeriod,
      })
      if (error) throw error
      return data as DigestPreview
    },
    onSuccess: (data) => setPreview(data),
  })

  const publishMutation = useMutation<string | null, Error, DigestPreview>({
    mutationFn: async (digestPreview): Promise<string | null> => {
      const { data, error } = await supabase.rpc('publish_digest', {
        p_dossier_id: dossierId,
        p_period: pickedPeriod,
        p_summary: renderSummaryText(digestPreview, pickedPeriod),
        p_clearance_level_at_generation: digestPreview.clearance_level ?? null,
      })
      if (error) throw error
      return data
    },
    onSuccess: () => {
      setPreview(null)
      setOpen(false)
      void queryClient.invalidateQueries({ queryKey: digestKeys.all })
    },
  })

  const isBusy = generateMutation.isPending || publishMutation.isPending

  const resetAndClose = (): void => {
    setPreview(null)
    generateMutation.reset()
    publishMutation.reset()
    setOpen(false)
  }

  const handleOpenChange = (next: boolean): void => {
    if (!next) {
      resetAndClose()
      return
    }
    setOpen(true)
  }

  return (
    <>
      <Button type="button" size="sm" onClick={() => setOpen(true)} disabled={isBusy}>
        {t('action.generateNow')}
      </Button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent
          className="max-w-none rounded-none ps-4 pe-4 sm:rounded-none sm:ps-6 sm:pe-6"
          style={{
            width: 'min(100vw, 720px)',
            height: '100dvh',
            insetInlineEnd: 0,
            insetInlineStart: 'auto',
            insetBlockStart: 0,
            insetBlockEnd: 0,
            transform: 'none',
            translate: 'none',
            boxShadow: 'var(--shadow-lg)',
          }}
          dir={isRTL ? 'rtl' : 'ltr'}
        >
          <DialogHeader>
            <DialogTitle className="text-start [font-size:var(--t-card-title)]">
              {t('action.generate')}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5 pt-4 pb-4">
            <div className="space-y-2">
              <p className="text-start [font-size:var(--t-meta)] font-medium uppercase text-ink-mute">
                {t('picker.step1')}
              </p>
              <div
                className="flex flex-wrap gap-2"
                role="radiogroup"
                aria-label={t('picker.step1')}
              >
                {FREQUENCIES.map((value) => (
                  <button
                    key={value}
                    type="button"
                    role="radio"
                    aria-checked={pickedPeriod === value}
                    onClick={() => setPickedPeriod(value)}
                    disabled={isBusy}
                    className={[
                      'rounded-sm border ps-3 pe-3 pt-2 pb-2 [font-size:var(--t-body)] transition-colors',
                      pickedPeriod === value
                        ? 'border-[var(--accent)] bg-accent-soft text-accent-ink'
                        : 'border-line bg-surface text-ink-mute hover:bg-line-soft',
                    ].join(' ')}
                  >
                    {t(`frequency.${value}`)}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => generateMutation.mutate()}
                disabled={isBusy}
              >
                {generateMutation.isPending && (
                  <Loader2 className="h-4 w-4 animate-spin me-2" aria-hidden="true" />
                )}
                {t('picker.generatePreview')}
              </Button>

              {generateMutation.isError && (
                <p className="text-start [font-size:var(--t-meta)] text-danger" role="alert">
                  {t('error.generate')}
                </p>
              )}

              {preview !== null && (
                <div aria-live="polite">
                  <div className="border border-line bg-[var(--warn-soft)] ps-3 pe-3 pt-2 pb-2 font-mono uppercase text-[var(--warn)] [font-size:var(--t-mono-tiny)]">
                    {t('preview.banner')}
                  </div>
                  <div className="mt-3 grid grid-cols-3 rounded-sm border border-line bg-bg">
                    {(['signals', 'engagements', 'commitments'] as const).map((key, index) => (
                      <div
                        key={key}
                        className={[
                          'ps-3 pe-3 pt-3 pb-3 text-center',
                          index === 0 ? '' : 'border-s border-line',
                        ].join(' ')}
                      >
                        <div className="font-mono text-ink [font-size:var(--t-kpi-value)] leading-none">
                          {counts?.[key] ?? 0}
                        </div>
                        <div className="mt-1 [font-size:var(--t-meta)] text-ink-mute">
                          {t(`metric.${key}`)}
                        </div>
                      </div>
                    ))}
                  </div>

                  {publishMutation.isError && (
                    <p
                      className="mt-3 text-start [font-size:var(--t-meta)] text-danger"
                      role="alert"
                    >
                      {t('error.publish')}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="mt-auto">
            <Button type="button" variant="outline" onClick={resetAndClose} disabled={isBusy}>
              {t('action.discard')}
            </Button>
            <Button
              type="button"
              onClick={() => preview && publishMutation.mutate(preview)}
              disabled={isBusy || preview === null}
            >
              {publishMutation.isPending && (
                <Loader2 className="h-4 w-4 animate-spin me-2" aria-hidden="true" />
              )}
              {t('action.publish')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
