/**
 * Phase 42-06 — After-actions list `.tbl` presentation component (PAGE-02).
 *
 * Verbatim port of the handoff `.tbl` 6-column anatomy from
 * `frontend/design-system/inteldossier_handoff_design/src/pages.jsx`.
 *
 * Pure presentational: receives `rows` from a caller that wires the
 * `useAfterActionsAll()` hook. Empty / loading / error are rendered
 * inline so the route file stays a thin shell.
 */
import { useNavigate } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { Icon } from '@/components/signature-visuals'
import { toArDigits } from '@/lib/i18n/toArDigits'
import type { AfterActionRecordWithJoins } from '@/hooks/useAfterAction'

export interface AfterActionsTableProps {
  rows: AfterActionRecordWithJoins[]
  isLoading: boolean
  error: Error | null
}

function formatDayFirst(date: string | null | undefined): string {
  if (date === null || date === undefined || date === '') return '—'
  const d = new Date(date)
  if (Number.isNaN(d.getTime())) return '—'
  // Day-first format: "Tue 28 Apr". Always use en-GB locale to keep the
  // mono numeric/short-month format identical regardless of UI language;
  // toArDigits later swaps Western digits to Arabic-Indic when needed.
  return d.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
  })
}

export function AfterActionsTable({
  rows,
  isLoading,
  error,
}: AfterActionsTableProps): React.JSX.Element {
  const { t, i18n } = useTranslation('after-actions-page')
  const locale = (i18n.language === 'ar' ? 'ar' : 'en') as 'en' | 'ar'
  const navigate = useNavigate()

  function navigateToDetail(id: string): void {
    void navigate({ to: '/after-actions/$afterActionId', params: { afterActionId: id } })
  }

  if (error !== null) {
    return (
      <div className="card" role="alert">
        <Icon name="alert" size={16} style={{ color: 'var(--danger)' }} aria-hidden />
        <span className="ms-2">{t('error.list')}</span>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="card" data-testid="after-actions-skeleton">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="mb-2 h-[var(--row-h)] w-full animate-pulse rounded-[var(--radius-sm)] bg-[var(--line-soft)]"
          />
        ))}
      </div>
    )
  }

  if (rows.length === 0) {
    return (
      <div className="py-12 text-center text-[var(--ink-mute)]">
        <h2 className="text-lg" style={{ fontFamily: 'var(--font-display)' }}>
          {t('empty.heading')}
        </h2>
      </div>
    )
  }

  return (
    <div className="card">
      <table className="tbl" role="table">
        <thead>
          <tr>
            <th className="text-start">{t('columns.engagement')}</th>
            <th className="text-start">{t('columns.date')}</th>
            <th className="text-start">{t('columns.dossier')}</th>
            <th className="text-end">{t('columns.decisions')}</th>
            <th className="text-end">{t('columns.commitments')}</th>
            {/* Decorative chevron column — empty header by design.
                Use scope without aria-label rather than aria-label="" which
                axe-core flags as aria-valid-attr-value. */}
            <th scope="col" />
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const engagementTitle =
              locale === 'ar'
                ? (r.engagement?.title_ar ?? r.engagement?.title_en ?? '—')
                : (r.engagement?.title_en ?? r.engagement?.title_ar ?? '—')
            const dossierName =
              locale === 'ar' ? (r.dossier?.name_ar ?? '—') : (r.dossier?.name_en ?? '—')
            return (
              <tr
                key={r.id}
                data-testid="after-action-row"
                role="button"
                tabIndex={0}
                style={{ cursor: 'pointer', minHeight: 44 }}
                onClick={() => {
                  navigateToDetail(r.id)
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    navigateToDetail(r.id)
                  }
                }}
              >
                <td style={{ fontWeight: 500 }}>{engagementTitle}</td>
                <td
                  dir="ltr"
                  style={{ fontFamily: 'var(--font-mono)', color: 'var(--ink-mute)' }}
                >
                  {toArDigits(formatDayFirst(r.engagement?.engagement_date), locale)}
                </td>
                <td>
                  <span
                    className="chip"
                    style={{
                      background: 'var(--accent-soft)',
                      color: 'var(--accent-ink)',
                    }}
                  >
                    {dossierName}
                  </span>
                </td>
                <td className="text-end" style={{ fontFamily: 'var(--font-mono)' }}>
                  {toArDigits(r.decisions?.length ?? 0, locale)}
                </td>
                <td className="text-end" style={{ fontFamily: 'var(--font-mono)' }}>
                  {toArDigits(r.commitments?.length ?? 0, locale)}
                </td>
                <td>
                  <Icon name="chevron-right" size={16} className="icon-flip" aria-hidden />
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
