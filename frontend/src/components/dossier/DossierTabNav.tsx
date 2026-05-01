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
      className="tabs sticky top-0 z-10 overflow-x-auto snap-x snap-mandatory scrollbar-none px-4 sm:px-6 lg:px-8"
    >
      <div className="flex min-w-max gap-6">
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
                'tab min-h-11 min-w-11 snap-center outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]',
                isActive && 'active',
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
