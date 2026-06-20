import { Bell, Building2, CalendarDays, FileText, Globe, Target, Users } from 'lucide-react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { useDirection } from '@/hooks/useDirection'
import { formatDayFirst, formatTime } from '@/lib/format-date'
import type { Digest, DigestSummarySections } from '@/domains/signals/hooks/useDigests'

type DigestSectionKey = keyof DigestSummarySections

const DOSSIER_ICONS: Record<string, typeof Globe> = {
  country: Globe,
  organization: Building2,
  forum: Users,
  engagement: CalendarDays,
  topic: Target,
  working_group: Users,
  person: FileText,
}

const SEVERITY_CLASSES: Record<string, string> = {
  urgent: 'bg-[var(--danger-soft)] text-[var(--danger)]',
  high: 'bg-[var(--danger-soft)] text-[var(--danger)]',
  medium: 'bg-[var(--warn-soft)] text-[var(--warn)]',
  low: 'bg-[var(--ok-soft)] text-[var(--ok)]',
}

function asRecord(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === 'object' ? (value as Record<string, unknown>) : {}
}

function asItems(value: unknown): Array<Record<string, unknown>> {
  return Array.isArray(value) ? value.map(asRecord) : []
}

function text(value: unknown, fallback = ''): string {
  return typeof value === 'string' && value.trim().length > 0 ? value : fallback
}

export function getDigestSections(summary: string): DigestSummarySections {
  try {
    const parsed = asRecord(JSON.parse(summary))
    return {
      signals: asItems(parsed.signals),
      engagements: asItems(parsed.engagements),
      commitments: asItems(parsed.commitments_due ?? parsed.commitments),
      statusChanges: asItems(parsed.status_changes ?? parsed.statusChanges),
    }
  } catch {
    const lines = summary
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)

    return {
      signals: lines.map((line) => ({ title: line, severity: 'medium' })),
      engagements: [],
      commitments: [],
      statusChanges: [],
    }
  }
}

export function getDigestCounts(sections: DigestSummarySections): Record<DigestSectionKey, number> {
  return {
    signals: sections.signals.length,
    engagements: sections.engagements.length,
    commitments: sections.commitments.length,
    statusChanges: sections.statusChanges.length,
  }
}

export function getDigestDossierName(digest: Digest, isRTL: boolean, fallback: string): string {
  const localized = isRTL ? digest.dossier_name_ar : digest.dossier_name_en
  return localized ?? digest.dossier_name_en ?? digest.dossier_name_ar ?? fallback
}

export function formatDigestPeriod(period: string, locale: string): string {
  const normalized = period.replace(' - ', ' – ')
  const [start, end] = normalized.split(' – ')
  if (start && end) return `${formatDayFirst(start, locale)} – ${formatDayFirst(end, locale)}`
  return formatDayFirst(period, locale)
}

function severityClass(severity: unknown): string {
  const key = text(severity, 'medium')
  return SEVERITY_CLASSES[key] ?? SEVERITY_CLASSES.medium ?? ''
}

function signalTitle(item: Record<string, unknown>): string {
  return text(item.title, text(item.name, 'Intelligence signal'))
}

interface DossierGlyphProps {
  type: string
}

export function DossierGlyph({ type }: DossierGlyphProps): React.ReactElement {
  const Icon = DOSSIER_ICONS[type] ?? FileText
  return (
    <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-line-soft text-ink-mute">
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
    </span>
  )
}

interface DigestCardProps {
  digest: Digest
  onUnsubscribe: () => void
  onGenerateNow?: () => void
  onOpen?: () => void
  generateControl?: ReactNode
}

export function DigestCard({
  digest,
  onUnsubscribe,
  onGenerateNow,
  onOpen,
  generateControl,
}: DigestCardProps): React.ReactElement {
  const { t } = useTranslation('intelligence-digests')
  const { isRTL } = useDirection()
  const locale = isRTL ? 'ar' : 'en'
  const sections = getDigestSections(digest.summary)
  const counts = getDigestCounts(sections)
  const dossierName = getDigestDossierName(digest, isRTL, t('digest.untitledDossier'))
  const signalPreview = sections.signals.slice(0, 5)
  const overflow = Math.max(sections.signals.length - signalPreview.length, 0)

  return (
    <article
      className="rounded-[var(--radius)] border border-line bg-surface transition-[background-color,box-shadow] duration-[var(--dur-fast)] ease-out hover:bg-line-soft hover:shadow-sm"
      style={{ minHeight: 'var(--row-h)' }}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <button
        type="button"
        onClick={onOpen}
        className="block w-full text-start ps-4 pe-4 pt-4 pb-3 focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
      >
        <div className="flex flex-wrap items-center gap-2">
          <DossierGlyph type={digest.dossier_type} />
          <bdi className="font-semibold text-ink [font-size:var(--t-body)]">{dossierName}</bdi>
          <span className="rounded-full bg-accent-soft ps-2 pe-2 pt-1 pb-1 font-mono [font-size:var(--t-meta)] uppercase text-accent-ink">
            {t(`chip.${digest.frequency}`, {
              defaultValue: String(digest.frequency).toUpperCase(),
            })}
          </span>
          <span className="[font-size:var(--t-meta)] text-ink-mute">
            {formatDigestPeriod(digest.period, locale)}
          </span>
        </div>

        <div className="mt-4 grid grid-cols-3 rounded-sm border border-line bg-bg">
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
              <div className="mt-1 [font-size:var(--t-meta)] text-ink-mute">
                {t(`metric.${key}`)}
              </div>
            </div>
          ))}
        </div>

        <ul className="mt-4 space-y-2">
          {signalPreview.map((item, index) => (
            <li key={`${digest.id}-signal-${index}`} className="flex items-center gap-2">
              <span
                className={[
                  'inline-flex shrink-0 rounded-full ps-2 pe-2 pt-1 pb-1 [font-size:var(--t-meta)] font-medium',
                  severityClass(item.severity),
                ].join(' ')}
              >
                {text(item.severity, 'medium')}
              </span>
              <bdi className="min-w-0 truncate [font-size:var(--t-body)] text-ink-mute">
                {signalTitle(item)}
              </bdi>
            </li>
          ))}
          {overflow > 0 && (
            <li className="[font-size:var(--t-meta)] text-accent-ink">
              {t('digest.more', { count: overflow })}
            </li>
          )}
        </ul>
      </button>

      <div className="flex flex-wrap items-center gap-2 border-t border-line ps-4 pe-4 pt-3 pb-3 [font-size:var(--t-meta)] text-ink-faint">
        <span>
          {t('digest.generated', {
            date: formatDayFirst(digest.generated_at, locale),
            time: formatTime(digest.generated_at, locale),
          })}
        </span>
        <div className="ms-auto">
          {generateControl ??
            (onGenerateNow ? (
              <Button variant="ghost" size="sm" className="text-ink-mute" onClick={onGenerateNow}>
                <Bell className="h-4 w-4 me-2" aria-hidden="true" />
                {t('action.generateNow')}
              </Button>
            ) : null)}
        </div>
        <Button variant="ghost" size="sm" className="text-ink-mute" onClick={onUnsubscribe}>
          {t('action.unsubscribe')}
        </Button>
      </div>
    </article>
  )
}
