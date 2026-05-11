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
import { X } from 'lucide-react'
import { useDossier } from '@/hooks/useDossier'
import { useDossierOverview } from '@/hooks/useDossierOverview'
import { DrawerMetaStrip } from './DrawerMetaStrip'
import { DrawerCtaRow } from './DrawerCtaRow'

export interface DrawerHeadProps {
  dossierId: string
  dossierType: string
  onClose: () => void
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

export function DrawerHead({ dossierId, dossierType, onClose }: DrawerHeadProps): React.JSX.Element {
  const { t, i18n } = useTranslation('dossier-drawer')
  const { data: dossierRaw } = useDossier(dossierId, undefined, {
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
  const name =
    lang === 'ar' && typeof titleAr === 'string' && titleAr.length > 0
      ? titleAr
      : dossier?.name_en ?? ''

  const engagementCount =
    typeof overview?.stats?.calendar_events_count === 'number'
      ? overview.stats.calendar_events_count
      : 0

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
