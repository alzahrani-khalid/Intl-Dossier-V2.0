/**
 * DossierTabNav
 * URL-driven tab navigation for dossier detail pages.
 *
 * Uses TanStack Router Link components (not local state) so every tab
 * is deep-linkable and shareable. Active tab determined by current route.
 * Mobile: horizontal scroll with snap, auto-scrolls active tab into view.
 *
 * Mirrors WorkspaceTabNav pattern. RTL-compatible, logical properties only.
 */

import { type ReactElement, useEffect, useRef } from 'react'
import { Link, useMatchRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { useDirection } from '@/hooks/useDirection'
import { getDossierRouteSegment } from '@/lib/dossier-routes'
import { cn } from '@/lib/utils'

// ============================================================================
// Types
// ============================================================================

export interface DossierTabConfig {
  key: string
  labelKey: string
  path: string
}

// ============================================================================
// Base tabs — shared across all dossier types
// ============================================================================

const BASE_DOSSIER_TABS: DossierTabConfig[] = [
  { key: 'overview', labelKey: 'tabs.overview', path: 'overview' },
  { key: 'engagements', labelKey: 'tabs.engagements', path: 'engagements' },
  { key: 'docs', labelKey: 'tabs.docs', path: 'docs' },
  { key: 'tasks', labelKey: 'tabs.tasks', path: 'tasks' },
  { key: 'timeline', labelKey: 'tabs.timeline', path: 'timeline' },
  { key: 'audit', labelKey: 'tabs.audit', path: 'audit' },
]

// ============================================================================
// Props
// ============================================================================

interface DossierTabNavProps {
  dossierId: string
  dossierType: string
  extraTabs?: DossierTabConfig[]
}

// ============================================================================
// Component
// ============================================================================

export function DossierTabNav({
  dossierId,
  dossierType,
  extraTabs,
}: DossierTabNavProps): ReactElement {
  const { t } = useTranslation('dossier-shell')
  const { direction } = useDirection()
  const matchRoute = useMatchRoute()
  const activeTabRef = useRef<HTMLAnchorElement | null>(null)

  const allTabs = [...BASE_DOSSIER_TABS, ...(extraTabs ?? [])]
  const routeSegment = getDossierRouteSegment(dossierType)

  // Auto-scroll active tab into view on mount
  useEffect(() => {
    if (activeTabRef.current !== null) {
      activeTabRef.current.scrollIntoView({
        behavior: 'smooth',
        inline: 'center',
        block: 'nearest',
      })
    }
  }, [dossierId])

  return (
    <nav
      dir={direction}
      role="tablist"
      aria-label={t('tabs.ariaLabel')}
      className="sticky top-[57px] z-10 bg-muted/50 border-b overflow-x-auto snap-x snap-mandatory scrollbar-none"
    >
      <div className="flex min-w-max">
        {allTabs.map((tab) => {
          const isActive = matchRoute({
            to: `/dossiers/${routeSegment}/$id/${tab.path}` as string,
            params: { id: dossierId },
            fuzzy: true,
          })

          return (
            <Link
              key={tab.key}
              ref={isActive ? activeTabRef : undefined}
              to={`/dossiers/${routeSegment}/$id/${tab.path}` as string}
              params={{ id: dossierId }}
              role="tab"
              aria-selected={Boolean(isActive)}
              className={cn(
                'min-h-11 min-w-11 px-3 py-2 text-sm font-normal whitespace-nowrap snap-center rounded-t-md transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring',
                isActive
                  ? 'border-b-2 border-primary text-foreground bg-background'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {t(tab.labelKey)}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
