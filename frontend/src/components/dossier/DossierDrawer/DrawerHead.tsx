/**
 * DrawerHead — Wave 1 (Phase 41 plan 02 Task 1) full handoff-anatomy port.
 *
 * Renders the sticky drawer head per pages.jsx#L482-505:
 *   - chip row (DOSSIER + optional CONFIDENTIAL)  +  close button (44×44, top-end)
 *   - drawer-title (display font, RTL-aware Tajawal override via index.css)
 *   - DrawerMetaStrip (location · lead · engagements · last touched)
 *   - DrawerCtaRow (Log engagement + Brief/Follow stubs + Open full dossier)
 *
 * Decisions:
 *   - D-05: Brief + Follow rendered as visual stubs in DrawerCtaRow
 *   - D-08: Log engagement wired (DrawerCtaRow)
 *   - D-11: Close button is min 44×44
 *   - RESEARCH §1: CONFIDENTIAL chip threshold is sensitivity_level >= 3
 *
 * Lucide-react `X` icon retained from Wave 0 (signature-visuals barrel does
 * not export a generic Icon component — see 41-01-SUMMARY deviation D-1).
 */
import type * as React from 'react'
import { useTranslation } from 'react-i18next'
import { X, ChevronUp, ChevronDown } from 'lucide-react'
import { useDossier } from '@/hooks/useDossier'
import { useDossierOverview } from '@/hooks/useDossierOverview'
import { DrawerMetaStrip } from './DrawerMetaStrip'
import { DrawerCtaRow } from './DrawerCtaRow'

export interface DrawerHeadProps {
  dossierId: string
  dossierType: string
  onClose: () => void
  // F23 peek paging (optional — absent when the drawer is opened from a non-list context,
  // e.g. a dashboard widget or a deep link, in which case no counter/chevrons render).
  position?: number | null
  total?: number
  canPrev?: boolean
  canNext?: boolean
  goPrev?: () => void
  goNext?: () => void
}

interface DossierLite {
  id: string
  name_en: string
  name_ar?: string | null
  type: string
  sensitivity_level?: number
  metadata?: Record<string, unknown> | null
  updated_at?: string
}

interface OverviewLite {
  stats?: { calendar_events_count?: number }
}

export function DrawerHead({
  dossierId,
  dossierType,
  onClose,
  position,
  total,
  canPrev,
  canNext,
  goPrev,
  goNext,
}: DrawerHeadProps): React.JSX.Element {
  const { t, i18n } = useTranslation('dossier-drawer')
  const { data: dossierRaw, isError: dossierIsError } = useDossier(dossierId, undefined, {
    enabled: Boolean(dossierId),
  })
  const { data: overviewRaw } = useDossierOverview(dossierId, {
    enabled: Boolean(dossierId),
    includeSections: ['work_items', 'calendar_events', 'activity_timeline'],
  })

  const dossier = dossierRaw as DossierLite | undefined | null
  const overview = overviewRaw as OverviewLite | undefined | null

  const lang = i18n.language
  // RESEARCH §1: threshold >= 3 — handoff visual chip-warn appears at level 3.
  // Matches SENSITIVITY_CHIP map (level 3 = chip-warn, level 4 = chip-danger).
  const showConfidential = (dossier?.sensitivity_level ?? 0) >= 3

  const titleAr = dossier?.name_ar
  const resolvedName =
    lang === 'ar' && typeof titleAr === 'string' && titleAr.length > 0
      ? titleAr
      : (dossier?.name_en ?? '')
  // OVRERR-01 / T-66-13: the head must never strand in its own skeleton. When the
  // core dossier query errors with no data, fall the title back to '—' (the body
  // error branch carries the message) and keep all chrome — chip + close — functional.
  const name = resolvedName.length > 0 ? resolvedName : dossierIsError ? '—' : resolvedName

  const engagementCount =
    typeof overview?.stats?.calendar_events_count === 'number'
      ? overview.stats.calendar_events_count
      : 0

  // F23: the peek counter + chevrons render only when a list registered a pageable window.
  const showPeek = position != null && total != null

  const closeButton = (
    <button
      type="button"
      className="btn-ghost"
      style={{ minBlockSize: 44, minInlineSize: 44 }}
      onClick={onClose}
      aria-label={t('cta.close')}
      data-testid="dossier-drawer-close"
    >
      <X size={14} />
    </button>
  )

  return (
    <div className="drawer-head">
      <div className="flex items-center justify-between mb-2">
        <div className="flex gap-2">
          <span className="chip">{t('chip.dossier')}</span>
          {showConfidential && (
            <span className="chip chip-warn" data-testid="confidential-chip">
              {t('chip.confidential')}
            </span>
          )}
        </div>
        {showPeek ? (
          <div className="flex items-center gap-1" data-testid="dossier-drawer-peek">
            {/* Mono, Latin-digit, dir=ltr-isolated counter (inline span — NOT LtrIsolate,
                which is a block div and would break this flex row; DESIGN.md §RTL cascade). */}
            <span
              dir="ltr"
              className="font-mono text-sm text-ink-mute"
              data-testid="dossier-drawer-peek-counter"
            >
              {t('peek.counter', { position, total })}
            </span>
            <button
              type="button"
              className="btn-ghost"
              style={{ minBlockSize: 44, minInlineSize: 44 }}
              onClick={goPrev}
              disabled={canPrev !== true}
              aria-disabled={canPrev !== true}
              aria-label={t('peek.prev')}
              data-testid="dossier-drawer-peek-prev"
            >
              <ChevronUp size={14} />
            </button>
            <button
              type="button"
              className="btn-ghost"
              style={{ minBlockSize: 44, minInlineSize: 44 }}
              onClick={goNext}
              disabled={canNext !== true}
              aria-disabled={canNext !== true}
              aria-label={t('peek.next')}
              data-testid="dossier-drawer-peek-next"
            >
              <ChevronDown size={14} />
            </button>
            {closeButton}
          </div>
        ) : (
          closeButton
        )}
      </div>

      <h2 className="drawer-title">{name}</h2>

      <DrawerMetaStrip
        dossierId={dossierId}
        metadata={dossier?.metadata ?? undefined}
        updatedAt={dossier?.updated_at}
        engagementCount={engagementCount}
      />

      <DrawerCtaRow dossierId={dossierId} dossierType={dossierType} />
    </div>
  )
}
