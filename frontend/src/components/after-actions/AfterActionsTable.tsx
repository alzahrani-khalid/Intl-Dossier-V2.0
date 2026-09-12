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
import { Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { Icon } from '@/components/signature-visuals'
import { formatDayFirst } from '@/lib/format-date'
import type { AfterActionRecordWithJoins } from '@/hooks/useAfterAction'

export interface AfterActionsTableProps {
  rows: AfterActionRecordWithJoins[]
  isLoading: boolean
  error: Error | null
}

export function AfterActionsTable({
  rows,
  isLoading,
  error,
}: AfterActionsTableProps): React.JSX.Element {
  const { t, i18n } = useTranslation('after-actions-page')
  const locale = (i18n.language === 'ar' ? 'ar' : 'en') as 'en' | 'ar'

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
            // Phase 94-07 (D-13): `after-actions-list-all` composes the engagement in code and
            // emits null when the lookup misses. The row is LISTED and stays navigable — the old
            // inner-join embed deleted it from a list the user is told is complete. `text-warn`,
            // not danger: nothing failed, the record is incomplete. No role, no icon, no badge —
            // this is persistent state, not an interruption. Every other join-dependent cell
            // already falls back to an em dash (`formatDayFirst('')`, `?? '—'`).
            const engagementMissing = r.engagement === null || r.engagement === undefined
            const engagementTitle =
              locale === 'ar'
                ? (r.engagement?.title_ar ?? r.engagement?.title_en ?? '—')
                : (r.engagement?.title_en ?? r.engagement?.title_ar ?? '—')
            const dossierName =
              locale === 'ar' ? (r.dossier?.name_ar ?? '—') : (r.dossier?.name_en ?? '—')
            // WR-02: <tr role="button"> is invalid HTML/ARIA and trips
            // axe-core (presentation-role-conflict / aria-allowed-role).
            // Make the engagement cell own the row's keyboard activation
            // via a single focusable Link; the rest of the row stays
            // structural with no role swap.
            return (
              <tr key={r.id} data-testid="after-action-row">
                <td style={{ fontWeight: 500 }}>
                  <Link
                    to="/after-actions/$afterActionId"
                    params={{ afterActionId: r.id }}
                    className="row-affordance"
                    style={{ color: 'inherit', textDecoration: 'none' }}
                  >
                    {engagementMissing ? (
                      <span className="text-warn font-normal [font-size:var(--t-body)]">
                        {t('degraded.engagementMissing')}
                      </span>
                    ) : (
                      engagementTitle
                    )}
                  </Link>
                </td>
                <td dir="ltr" style={{ fontFamily: 'var(--font-mono)', color: 'var(--ink-mute)' }}>
                  {formatDayFirst(r.engagement?.engagement_date ?? '')}
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
                  {r.decisions?.length ?? 0}
                </td>
                <td className="text-end" style={{ fontFamily: 'var(--font-mono)' }}>
                  {r.commitments?.length ?? 0}
                </td>
                <td aria-hidden="true">
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
