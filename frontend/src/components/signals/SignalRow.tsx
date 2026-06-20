/**
 * SignalRow — a single triage row inside the signals queue (Phase 69, Wave 3).
 *
 * Renders as a `<li>` inside the queue `<ul role="list">`. Free-text title and body
 * are wrapped in `<bdi>` for bidirectional isolation (D-09) — never `textAlign: right`.
 * The focused (keyboard) row shows an accent outline ring. All colors resolve to
 * IntelDossier design tokens; all spacing uses logical properties.
 *
 * @module components/signals/SignalRow
 */

import { format } from 'date-fns'
import type { TFunction } from 'i18next'
import type { Signal, SignalSeverity } from '@/domains/signals'
import { SignalStatusBadge } from './SignalStatusBadge'

// Severity → semantic token classes (UI-SPEC Color section). Soft backgrounds that are
// not @theme utilities use arbitrary `bg-[var(--*-soft)]` to hit the real soft token.
const SEVERITY_CONFIGS: Record<SignalSeverity, string> = {
  urgent: 'bg-[var(--danger-soft)] text-danger',
  high: 'bg-[var(--warn-soft)] text-warning',
  medium: 'bg-line-soft text-ink-mute',
  low: 'bg-line-soft text-ink-faint',
}

interface SignalRowProps {
  signal: Signal
  isFocused: boolean
  isRTL: boolean
  t: TFunction<'intelligence-signals'>
  onClick: () => void
}

export function SignalRow({ signal, isFocused, t, onClick }: SignalRowProps): React.ReactElement {
  const showAiConfidence = signal.source_type === 'ai_generated' && signal.ai_confidence !== null
  const aiPercent = Math.round((signal.ai_confidence ?? 0) * 100)

  return (
    <li
      data-signal-id={signal.id}
      aria-selected={isFocused}
      onClick={onClick}
      className={[
        'border-b border-line last:border-0 px-[var(--pad)] py-[var(--space-3)] cursor-pointer',
        'transition-colors hover:bg-line-soft hover:shadow-sm',
        isFocused
          ? 'outline outline-2 outline-offset-[-2px] outline-[var(--accent)] bg-accent-soft'
          : '',
      ].join(' ')}
      style={{ minHeight: 'var(--row-h)' }}
    >
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0 space-y-1">
          {/* Title + badge cluster */}
          <div className="flex flex-wrap items-center gap-2">
            <bdi className="font-medium [font-size:var(--t-body)]">{signal.title}</bdi>
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${SEVERITY_CONFIGS[signal.severity]}`}
            >
              {t(`severity.${signal.severity}`, { defaultValue: signal.severity })}
            </span>
            {signal.category !== null && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-line-soft text-ink-mute">
                {t(`category.${signal.category}`)}
              </span>
            )}
            <span className="font-mono text-xs bg-line-soft text-ink-mute px-1.5 py-0.5 rounded">
              {t('badge.sensitivity', { n: signal.sensitivity_level })}
            </span>
            <SignalStatusBadge status={signal.status} />
          </div>

          {/* Content preview */}
          {signal.content.length > 0 && (
            <p className="line-clamp-2 [font-size:var(--t-body)] text-ink-mute">
              <bdi>{signal.content}</bdi>
            </p>
          )}

          {/* Meta line: date · source type, plus AI confidence badge when applicable */}
          <div className="flex flex-wrap items-center gap-2 [font-size:var(--t-meta)] text-ink-faint">
            <span>{format(new Date(signal.occurred_at), 'EEE dd MMM')}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono">{signal.source_type}</span>
            {showAiConfidence && (
              <span
                className="font-mono [font-size:var(--t-mono-small)] bg-accent-soft text-accent-ink ps-2 pe-2 rounded"
                aria-label={t('badge.aiConfidenceAria', { n: aiPercent })}
              >
                {t('badge.aiConfidence', { n: aiPercent })}
              </span>
            )}
          </div>
        </div>
      </div>
    </li>
  )
}
