/**
 * DrawerCtaRow — Wave 1 (Phase 41 plan 02 Task 3) — 4-button CTA row.
 *
 * Buttons in handoff order (pages.jsx#L505):
 *   1. Log engagement (.btn-primary, wired → /dossiers/engagements/create)
 *   2. Brief        (visual stub: aria-disabled, opacity 0.55, Coming soon tooltip)
 *   3. Follow       (visual stub: same treatment)
 *   4. Open full dossier (.btn-ghost, ms-auto, trailing chevron)
 *
 * Decisions:
 *   - D-05: Brief + Follow render as stubs per Phase 39 D-06 pattern
 *   - D-06: Open full dossier wired via getDossierDetailPath
 *   - D-08: Log engagement wired (prefill deferred — RESEARCH §3)
 *   - D-11: 44×44 minimum touch target
 *   - RTL Rule 5: chevron flipped via global `.icon-flip` cascade (handoff
 *     pattern, see DossierShell + GenericListPage). Lucide-react icons
 *     accept `className` so the rule applies automatically when
 *     `html[dir='rtl']`.
 */
import type * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from '@tanstack/react-router'
import { Plus, BookOpen, UserPlus, ChevronRight } from 'lucide-react'
import { getDossierDetailPath } from '@/lib/dossier-routes'

export interface DrawerCtaRowProps {
  dossierId: string
  dossierType: string
}

const STUB_OPACITY = 0.55

export function DrawerCtaRow({ dossierId, dossierType }: DrawerCtaRowProps): React.JSX.Element {
  const { t } = useTranslation('dossier-drawer')
  const navigate = useNavigate()

  const handleLogEngagement = (): void => {
    // RESEARCH §3: prefill (dossier_id) deferred to a future phase.
    navigate({ to: '/dossiers/engagements/create' })
  }

  const handleOpenFull = (): void => {
    // D-06: getDossierDetailPath validates type internally.
    navigate({ to: getDossierDetailPath(dossierId, dossierType) })
  }

  const noop = (): void => undefined

  return (
    <div className="flex items-center gap-2 flex-wrap mt-3">
      <button
        type="button"
        className="btn-primary inline-flex items-center gap-1"
        style={{ minBlockSize: 44 }}
        onClick={handleLogEngagement}
        data-testid="cta-log-engagement"
      >
        <Plus size={14} />
        {t('cta.log_engagement')}
      </button>

      <button
        type="button"
        className="btn inline-flex items-center gap-1"
        style={{ minBlockSize: 44, opacity: STUB_OPACITY, cursor: 'not-allowed' }}
        aria-disabled="true"
        title={t('cta.coming_soon')}
        onClick={noop}
        data-testid="cta-brief"
      >
        <BookOpen size={14} />
        {t('cta.brief')}
      </button>

      <button
        type="button"
        className="btn inline-flex items-center gap-1"
        style={{ minBlockSize: 44, opacity: STUB_OPACITY, cursor: 'not-allowed' }}
        aria-disabled="true"
        title={t('cta.coming_soon')}
        onClick={noop}
        data-testid="cta-follow"
      >
        <UserPlus size={14} />
        {t('cta.follow')}
      </button>

      <button
        type="button"
        className="btn-ghost inline-flex items-center gap-1 ms-auto"
        style={{ minBlockSize: 44 }}
        onClick={handleOpenFull}
        aria-label={t('common.actions.viewMore', { ns: 'translation' })}
        data-testid="cta-open-full-dossier"
      >
        <span>{t('cta.open_full_dossier')}</span>
        <ChevronRight size={14} className="icon-flip" />
      </button>
    </div>
  )
}
