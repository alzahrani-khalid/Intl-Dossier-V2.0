import { ArrowLeft, ArrowRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { useDirection } from '@/hooks/useDirection'
import { formatDayFirst, formatTime } from '@/lib/format-date'
import { useDigests } from '@/domains/signals/hooks/useDigests'
import {
  formatDigestPeriod,
  getDigestCounts,
  getDigestDossierName,
  getDigestSections,
} from './DigestCard'

function text(value: unknown, fallback = ''): string {
  return typeof value === 'string' && value.trim().length > 0 ? value : fallback
}

function sectionItemLabel(item: Record<string, unknown>, fallback: string): string {
  return text(item.title, text(item.name_en, text(item.name_ar, text(item.summary, fallback))))
}

interface DigestReaderProps {
  digestId: string
  onBack?: () => void
}

export function DigestReader({ digestId, onBack }: DigestReaderProps): React.ReactElement | null {
  const { t } = useTranslation('intelligence-digests')
  const { isRTL } = useDirection()
  const locale = isRTL ? 'ar' : 'en'
  const { data: digests = [] } = useDigests({ limit: 100 })
  const digest = digests.find((item) => item.id === digestId)

  if (!digest) return null

  const sections = getDigestSections(digest.summary)
  const counts = getDigestCounts(sections)
  const dossierName = getDigestDossierName(digest, isRTL, t('digest.untitledDossier'))
  const BackIcon = isRTL ? ArrowRight : ArrowLeft

  const sectionRows = [
    { key: 'signals', items: sections.signals },
    { key: 'engagements', items: sections.engagements },
    { key: 'commitments', items: sections.commitments },
    { key: 'statusChanges', items: sections.statusChanges },
  ] as const

  return (
    <section dir={isRTL ? 'rtl' : 'ltr'} className="space-y-4">
      <Button variant="ghost" size="sm" className="text-ink-mute" onClick={onBack}>
        <BackIcon className="h-4 w-4 me-2" aria-hidden="true" />
        {t('digest.back')}
      </Button>

      <div>
        <h2 className="text-start font-semibold text-ink [font-size:var(--t-page-title)]">
          {dossierName}
        </h2>
        <p className="mt-1 [font-size:var(--t-meta)] text-ink-mute">
          {t(`frequency.${digest.frequency}`, { defaultValue: digest.frequency })} ·{' '}
          {formatDigestPeriod(digest.period, locale)}
        </p>
      </div>

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
              {counts[key]}
            </div>
            <div className="mt-1 [font-size:var(--t-meta)] text-ink-mute">{t(`metric.${key}`)}</div>
          </div>
        ))}
      </div>

      <div className="space-y-2">
        {sectionRows.map(({ key, items }) => (
          <details key={key} className="rounded-sm border border-line bg-surface" open>
            <summary className="flex cursor-pointer items-center justify-between gap-3 ps-4 pe-4 pt-3 pb-3">
              <span className="font-mono text-xs uppercase text-ink-mute">
                {t(`section.${key}`)}
              </span>
              <span className="rounded-full bg-line-soft ps-2 pe-2 pt-0.5 pb-0.5 text-xs text-ink-mute">
                {items.length}
              </span>
            </summary>
            {items.length > 0 && (
              <ul className="border-t border-line">
                {items.map((item, index) => (
                  <li
                    key={`${key}-${index}`}
                    className="flex flex-wrap items-center gap-2 border-b border-line ps-4 pe-4 pt-2 pb-2 last:border-0"
                  >
                    <bdi className="min-w-0 flex-1 [font-size:var(--t-body)] text-ink">
                      {sectionItemLabel(item, t(`section.${key}`))}
                    </bdi>
                    {item.severity !== undefined && (
                      <span className="rounded-full bg-[var(--warn-soft)] ps-2 pe-2 pt-0.5 pb-0.5 text-xs text-warning">
                        {text(item.severity)}
                      </span>
                    )}
                    {(item.occurred_at !== undefined || item.updated_at !== undefined) && (
                      <span className="font-mono [font-size:var(--t-mono-small)] text-ink-faint">
                        {formatDayFirst(text(item.occurred_at, text(item.updated_at)), locale)}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </details>
        ))}
      </div>

      <footer className="flex flex-wrap items-center gap-2 [font-size:var(--t-meta)] text-ink-faint">
        <span>
          {t('digest.published', {
            date: formatDayFirst(digest.published_at, locale),
            time: formatTime(digest.published_at, locale),
          })}
        </span>
      </footer>
    </section>
  )
}
