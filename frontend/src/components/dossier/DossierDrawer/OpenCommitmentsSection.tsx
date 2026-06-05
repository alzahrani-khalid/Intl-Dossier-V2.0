/**
 * OpenCommitmentsSection — Phase 41 Plan 05 (DRAWER-02).
 *
 * Verbatim port of handoff `app.css#L331-338` `.overdue-item` 4-column grid
 * (severity dot + title + days mono + owner mono) wired against
 * `overview.work_items.by_source.commitments` (already pre-filtered server-side
 * to source='commitment'; this component additionally drops completed +
 * cancelled rows so only actionable open commitments render).
 *
 * Decisions:
 *  - D-04: read from `work_items.by_source.commitments` (pre-filtered).
 *  - D-08 (revised, quick 260605-htw): row click opens CommitmentDetailDrawer in
 *    place via the `commitment` search param (useCommitmentDrawer) so the analyst
 *    keeps quick-look context, instead of navigating away to `/commitments?id=`.
 *  - D-11: row min-block-size = 44 regardless of density (touch target).
 *
 * Severity color (per UI-SPEC Color anti-list + handoff app.css):
 *   urgent | high → var(--danger)
 *   medium       → var(--warn)
 *   low | other  → var(--ink-faint)
 *
 * XSS posture: title and assignee_name render as React JSX text (auto-escaped).
 * `ownerInitials` only emits A–Z–derived chars from .toUpperCase()[0]; cannot
 * inject HTML. The row click passes only the item's own id to the drawer (no
 * free-form redirect target). Invalid deadlines short-circuit to '—'
 * (T-41-05-03).
 */
import type * as React from 'react'
import { useTranslation } from 'react-i18next'
import { differenceInCalendarDays } from 'date-fns'
import type { DossierOverviewResponse, DossierWorkItem } from '@/types/dossier-overview.types'
import { toArDigits } from '@/lib/i18n/toArDigits'
import { LtrIsolate } from '@/components/ui/ltr-isolate'
import { useCommitmentDrawer } from '@/hooks/useCommitmentDrawer'

export interface OpenCommitmentsSectionProps {
  overview?: DossierOverviewResponse | undefined
}

function severityColor(priority: DossierWorkItem['priority']): string {
  if (priority === 'urgent' || priority === 'high') return 'var(--danger)'
  if (priority === 'medium') return 'var(--warn)'
  return 'var(--ink-faint)'
}

function ownerInitials(name: string | null | undefined): string {
  if (name === null || name === undefined) return '—'
  const trimmed = name.trim()
  if (trimmed === '') return '—'
  const parts = trimmed.split(/\s+/).filter((p) => p.length > 0)
  if (parts.length === 0) return '—'
  return parts
    .slice(0, 2)
    .map((p) => p.charAt(0).toUpperCase())
    .join('')
}

function daysLabel(
  deadline: string | null | undefined,
  lang: string,
  now: Date = new Date(),
): string {
  if (deadline === null || deadline === undefined) return '—'
  const d = new Date(deadline)
  if (Number.isNaN(d.getTime())) return '—'
  const days = differenceInCalendarDays(d, now)
  const sign = days < 0 ? '-' : '+'
  const abs = Math.abs(days)
  return `T${sign}${toArDigits(abs, lang)}`
}

function isOpenStatus(status: DossierWorkItem['status']): boolean {
  return status !== 'completed' && status !== 'cancelled'
}

export function OpenCommitmentsSection({
  overview,
}: OpenCommitmentsSectionProps): React.JSX.Element {
  const { t, i18n } = useTranslation('dossier-drawer')
  const { openCommitment } = useCommitmentDrawer()
  const lang = i18n.language

  const all: DossierWorkItem[] = overview?.work_items?.by_source?.commitments ?? []
  const rows = all.filter((it) => isOpenStatus(it.status))

  const handleRowClick = (id: string): void => {
    // Open the commitment detail drawer in place (a `commitment` search param the
    // globally-mounted CommitmentDrawer reads) so the analyst keeps dashboard /
    // dossier quick-look context instead of navigating away to `/commitments`.
    openCommitment(id)
  }

  return (
    <section className="flex flex-col gap-2" data-testid="dossier-drawer-commitments">
      <h3
        className="t-label"
        style={{
          fontSize: 'var(--t-label, 10.5px)',
          fontWeight: 600,
          letterSpacing: 'var(--tracking-label, 0.1em)',
          color: 'var(--ink-mute)',
          textTransform: 'uppercase',
        }}
      >
        {t('section.open_commitments')}
      </h3>

      {rows.length === 0 ? (
        <p style={{ color: 'var(--ink-mute)', fontSize: 'var(--t-body, 13px)' }}>
          {t('empty.open_commitments')}
        </p>
      ) : (
        <ul className="flex flex-col gap-1" data-testid="dossier-drawer-commitments-list">
          {rows.map((it) => {
            const title =
              lang === 'ar' && it.title_ar !== null && it.title_ar !== ''
                ? it.title_ar
                : it.title_en
            return (
              <li key={it.id}>
                <button
                  type="button"
                  className="overdue-item w-full text-start"
                  style={{ minBlockSize: 44 }}
                  onClick={() => handleRowClick(it.id)}
                  data-testid="dossier-drawer-commitment-row"
                >
                  <span
                    className="overdue-sev"
                    aria-hidden="true"
                    style={{
                      display: 'inline-block',
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      backgroundColor: severityColor(it.priority),
                    }}
                  />
                  <span className="overdue-title" style={{ fontSize: 'var(--t-body, 13px)' }}>
                    {title}
                  </span>
                  <LtrIsolate>
                    <span
                      className="overdue-days"
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: 'var(--t-mono-small, 11px)',
                        color: 'var(--ink-mute)',
                      }}
                    >
                      {daysLabel(it.deadline, lang)}
                    </span>
                  </LtrIsolate>
                  <LtrIsolate>
                    <span
                      className="overdue-owner"
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: 'var(--t-mono-small, 11px)',
                        color: 'var(--ink-mute)',
                      }}
                    >
                      {ownerInitials(it.assignee_name)}
                    </span>
                  </LtrIsolate>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
