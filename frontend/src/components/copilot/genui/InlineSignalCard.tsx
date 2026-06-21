/**
 * InlineSignalCard — the read-only generative-UI signal card rendered inline in the
 * copilot surface for a read_signals result (GENUI-01, D-07 fixed allowlist).
 *
 * read_signals hands the renderer PARTIAL rows (`Record<string, unknown>`) carrying
 * id / title / status / severity / category / sensitivity_level. We render a thin
 * token-bound card mirroring SignalRow's badge language (SignalStatusBadge + the severity
 * token map) but as a clickable READ-ONLY card — NO dismiss / escalate buttons inline
 * (those go through the HITL propose path, 73-03).
 *
 * Deep-link: clicking navigates in-app to the signals triage queue (`/intelligence`) via
 * the TanStack Router — the canonical signals surface (the queue selects a row by internal
 * focus, there is no per-signal detail route). CitationCard precedent (T-73-04-04).
 *
 * Bidi (D-09): the free-text title is wrapped in <bdi> and carries writingDirection so AR
 * content lays out correctly; NEVER a physical text alignment. Arabic chrome resolves via
 * the registered intelligence-signals / copilot namespaces (the i18n parity trap).
 *
 * @module components/copilot/genui/InlineSignalCard
 */
import type { ReactElement } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from '@tanstack/react-router'
import { useDirection } from '@/hooks/useDirection'
import { SignalStatusBadge } from '@/components/signals/SignalStatusBadge'
import type { SignalStatus, SignalSeverity, SignalCategory } from '@/domains/signals'

/** Severity → semantic token classes (mirrors SignalRow; token-bound, no color literals). */
const SEVERITY_CONFIGS: Record<SignalSeverity, string> = {
  urgent: 'bg-[var(--danger-soft)] text-danger',
  high: 'bg-[var(--warn-soft)] text-warning',
  medium: 'bg-line-soft text-ink-mute',
  low: 'bg-line-soft text-ink-faint',
}

const STATUSES: readonly SignalStatus[] = ['new', 'acknowledged', 'dismissed', 'escalated']
const SEVERITIES: readonly SignalSeverity[] = ['low', 'medium', 'high', 'urgent']
const CATEGORIES: readonly SignalCategory[] = [
  'political',
  'economic',
  'security',
  'diplomatic',
  'other',
]

/** The partial signal row from read_signals — every field is defensively optional. */
export type InlineSignalRow = Record<string, unknown>

interface NormalizedSignal {
  id: string | null
  title: string
  status: SignalStatus | null
  severity: SignalSeverity | null
  category: SignalCategory | null
  sensitivityLevel: number | null
}

function asString(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null
}

/** Narrow an untrusted read_signals row to the display fields, validating each enum. */
function normalize(row: InlineSignalRow): NormalizedSignal {
  const statusRaw = asString(row.status)
  const severityRaw = asString(row.severity)
  const categoryRaw = asString(row.category)
  const sensitivity = typeof row.sensitivity_level === 'number' ? row.sensitivity_level : null
  return {
    id: asString(row.id),
    title: asString(row.title) ?? '',
    status: STATUSES.includes(statusRaw as SignalStatus) ? (statusRaw as SignalStatus) : null,
    severity: SEVERITIES.includes(severityRaw as SignalSeverity)
      ? (severityRaw as SignalSeverity)
      : null,
    category: CATEGORIES.includes(categoryRaw as SignalCategory)
      ? (categoryRaw as SignalCategory)
      : null,
    sensitivityLevel: sensitivity,
  }
}

export function InlineSignalCard({ signal }: { signal: InlineSignalRow }): ReactElement {
  const { t } = useTranslation('intelligence-signals')
  const { t: tCopilot } = useTranslation('copilot')
  const { isRTL } = useDirection()
  const navigate = useNavigate()
  const s = normalize(signal)

  const handleActivate = (): void => {
    void navigate({ to: '/intelligence' })
  }

  // Free-text title direction follows the active language. On the web, the HTML `dir`
  // attribute (not a CSS `writingDirection`, which is React-Native-only and not in
  // CSSProperties) is the bidi mechanism; <bdi> isolates the run either way. We compute
  // the writingDirection here and apply it via the dir attribute — NEVER a physical
  // textAlign — so AR titles lay out correctly.
  const writingDirection: 'rtl' | 'ltr' = isRTL ? 'rtl' : 'ltr'

  return (
    <button
      type="button"
      className="copilot-genui-signal"
      onClick={handleActivate}
      aria-label={tCopilot('genui.signal.open')}
      data-signal-id={s.id ?? undefined}
    >
      <span className="copilot-genui-signal__title" dir={writingDirection}>
        <bdi>{s.title.length > 0 ? s.title : tCopilot('genui.signal.untitled')}</bdi>
      </span>
      <span className="copilot-genui-signal__badges">
        {s.severity != null && (
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${SEVERITY_CONFIGS[s.severity]}`}
          >
            {t(`severity.${s.severity}`, { defaultValue: s.severity })}
          </span>
        )}
        {s.category != null && (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-line-soft text-ink-mute">
            {t(`category.${s.category}`)}
          </span>
        )}
        {s.sensitivityLevel != null && (
          <span className="font-mono text-xs bg-line-soft text-ink-mute px-1.5 py-0.5 rounded">
            {t('badge.sensitivity', { n: s.sensitivityLevel })}
          </span>
        )}
        {s.status != null && <SignalStatusBadge status={s.status} />}
      </span>
    </button>
  )
}
