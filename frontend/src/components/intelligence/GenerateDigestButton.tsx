import { useMemo, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { useDirection } from '@/hooks/useDirection'
import { supabase } from '@/lib/supabase'
import { digestKeys, type DigestFrequency } from '@/domains/signals/hooks/useDigests'

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
  const [preview, setPreview] = useState<DigestPreview | null>(null)

  const counts = useMemo(() => (preview ? countPreviewItems(preview) : null), [preview])

  const generateMutation = useMutation<DigestPreview, Error>({
    mutationFn: async (): Promise<DigestPreview> => {
      const { data, error } = await supabase.rpc('generate_digest', {
        p_dossier_id: dossierId,
        p_period: period,
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
        p_period: period,
        p_summary: renderSummaryText(digestPreview, period),
        p_clearance_level_at_generation: digestPreview.clearance_level ?? 1,
      })
      if (error) throw error
      return data
    },
    onSuccess: () => {
      setPreview(null)
      void queryClient.invalidateQueries({ queryKey: digestKeys.all })
    },
  })

  const isBusy = generateMutation.isPending || publishMutation.isPending

  if (preview === null) {
    return (
      <div className="space-y-2" dir={isRTL ? 'rtl' : 'ltr'}>
        <Button
          type="button"
          size="sm"
          onClick={() => generateMutation.mutate()}
          disabled={generateMutation.isPending}
        >
          {generateMutation.isPending && (
            <Loader2 className="h-4 w-4 animate-spin me-2" aria-hidden="true" />
          )}
          {t('action.generateNow')}
        </Button>
        {generateMutation.isError && (
          <p className="text-start text-xs text-danger" role="alert">
            {t('error.generate')}
          </p>
        )}
      </div>
    )
  }

  return (
    <div
      className="w-full max-w-[520px] rounded-[var(--radius)] border border-line bg-surface text-start"
      dir={isRTL ? 'rtl' : 'ltr'}
      aria-live="polite"
    >
      <div className="border-b border-line bg-[var(--warn-soft)] ps-3 pe-3 pt-2 pb-2 font-mono uppercase text-[var(--warn)] [font-size:var(--t-mono-tiny)]">
        {t('preview.banner')}
      </div>

      <div className="ps-3 pe-3 pt-3 pb-3">
        <div className="grid grid-cols-3 rounded-sm border border-line bg-bg">
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
          <p className="mt-3 text-start text-xs text-danger" role="alert">
            {t('error.publish')}
          </p>
        )}

        <div className="mt-3 flex flex-wrap items-center justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setPreview(null)}
            disabled={isBusy}
          >
            {t('action.discard')}
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={() => publishMutation.mutate(preview)}
            disabled={isBusy}
          >
            {publishMutation.isPending && (
              <Loader2 className="h-4 w-4 animate-spin me-2" aria-hidden="true" />
            )}
            {t('action.publish')}
          </Button>
        </div>
      </div>
    </div>
  )
}
