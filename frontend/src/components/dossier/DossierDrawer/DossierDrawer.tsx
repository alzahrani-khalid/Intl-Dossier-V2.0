/**
 * DossierDrawer — Wave 0 (Phase 41) shell.
 *
 * Mounts a Radix Sheet (right-anchored, end-0 logical) on every protected route,
 * driven by the URL search params `?dossier=<id>&dossierType=<type>`. While the
 * dossier overview query is loading the body renders DrawerSkeleton; otherwise
 * each Wave 1 plan replaces a single section file body without touching the shell.
 *
 * Decisions:
 *   - D-02: URL search-param mounting (browser-back closes, refresh restores)
 *   - D-03: single useDossierOverview hook, top-4 fixed activity slice, per-section skeletons
 *   - D-09: logical-property only (max-md:w-screen is direction-neutral; end-0 from sheet variant)
 *   - D-10: mobile = full-screen (border-0 + shadow-none); desktop = min(720px, 92vw)
 */
import type * as React from 'react'
import { useSyncExternalStore } from 'react'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { useTranslation } from 'react-i18next'
import { useDossierDrawer } from '@/hooks/useDossierDrawer'
import { useDossier } from '@/hooks/useDossier'
import { useDossierOverview } from '@/hooks/useDossierOverview'
import { DrawerHead } from './DrawerHead'
import { MiniKpiStrip } from './MiniKpiStrip'
import { SummarySection } from './SummarySection'
import { UpcomingSection } from './UpcomingSection'
import { RecentActivitySection } from './RecentActivitySection'
import { OpenCommitmentsSection } from './OpenCommitmentsSection'
import { DrawerSkeleton } from './DrawerSkeleton'

export function DossierDrawer(): React.JSX.Element | null {
  const { open, dossierId, dossierType, closeDossier } = useDossierDrawer()
  const { t } = useTranslation('dossier-drawer')

  // Conditional fetch: only fire when the drawer is open with a valid dossier id.
  // useDossier signature: (id, include?, options?) — pass empty string when closed
  // and gate via options.enabled so React Query never executes.
  const dossierQuery = useDossier(dossierId ?? '', undefined, {
    enabled: open && Boolean(dossierId),
  })
  const dossier = dossierQuery.data

  const { data: overview, isLoading: overviewLoading } = useDossierOverview(
    dossierId ?? undefined,
    {
      enabled: open && Boolean(dossierId),
      includeSections: ['work_items', 'calendar_events', 'activity_timeline'],
    },
  )

  // G5 (Phase 41-08): force box-shadow:none at viewport ≤768px. The Tailwind
  // utility `max-md:shadow-none` cannot beat the cva-base
  // `shadow-[var(--shadow-drawer)]` because both are arbitrary-value utilities
  // with identical specificity and tailwind-merge does not treat the
  // responsive variant as conflicting with the unprefixed base. An inline
  // style override wins at the cascade level (inline > class). 768px matches
  // the codebase's `max-md` breakpoint per CLAUDE.md responsive ladder.
  // Guards against environments without matchMedia (jsdom default) so the
  // unit test harness — and any SSR pass — gracefully fall back to desktop.
  const isMobileNarrow = useSyncExternalStore(
    (cb): (() => void) => {
      if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
        return (): void => {}
      }
      const mq = window.matchMedia('(max-width: 768px)')
      mq.addEventListener('change', cb)
      return (): void => mq.removeEventListener('change', cb)
    },
    (): boolean => {
      if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
        return false
      }
      return window.matchMedia('(max-width: 768px)').matches
    },
    (): boolean => false, // SSR fallback — desktop default
  )

  if (!open || !dossierId || !dossierType) return null

  return (
    <Sheet
      open={open}
      onOpenChange={(v) => {
        if (!v) closeDossier()
      }}
    >
      <SheetContent
        side="right"
        accessibleTitle={t('accessible_title')}
        className="drawer w-[min(720px,92vw)] max-md:w-screen max-md:border-0 max-md:shadow-none p-0 gap-0"
        style={{ boxShadow: isMobileNarrow ? 'none' : undefined }}
      >
        <DrawerHead
          dossierId={dossierId}
          dossierType={dossierType}
          onClose={closeDossier}
        />
        <div
          className="drawer-body"
          data-loading={overviewLoading || !overview ? 'true' : 'false'}
        >
          {overviewLoading || !overview ? (
            <DrawerSkeleton />
          ) : (
            <>
              <MiniKpiStrip overview={overview} />
              <SummarySection dossier={dossier as never} />
              <UpcomingSection overview={overview} />
              <RecentActivitySection overview={overview} />
              <OpenCommitmentsSection overview={overview} />
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
