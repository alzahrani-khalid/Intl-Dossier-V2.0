/**
 * WorkspaceTabNav
 * URL-driven tab navigation for the engagement workspace.
 *
 * Uses TanStack Router Link components (not local state) so every tab
 * is deep-linkable and shareable. Active tab determined by current route.
 * Mobile: horizontal scroll with snap, auto-scrolls active tab into view.
 */

import { type ReactElement, useEffect, useRef } from 'react'
import { Link, useMatchRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { useDirection } from '@/hooks/useDirection'
import { cn } from '@/lib/utils'

// ============================================================================
// Tab definitions
// ============================================================================

interface WorkspaceTab {
  key: string
  labelKey: string
  path: string
}

const WORKSPACE_TABS: WorkspaceTab[] = [
  { key: 'overview', labelKey: 'tabs.overview', path: 'overview' },
  { key: 'context', labelKey: 'tabs.context', path: 'context' },
  { key: 'tasks', labelKey: 'tabs.tasks', path: 'tasks' },
  { key: 'calendar', labelKey: 'tabs.calendar', path: 'calendar' },
  { key: 'docs', labelKey: 'tabs.docs', path: 'docs' },
  { key: 'audit', labelKey: 'tabs.audit', path: 'audit' },
]

// ============================================================================
// Props
// ============================================================================

interface WorkspaceTabNavProps {
  engagementId: string
}

// ============================================================================
// Component
// ============================================================================

export function WorkspaceTabNav({ engagementId }: WorkspaceTabNavProps): ReactElement {
  const { t } = useTranslation('workspace')
  const { direction } = useDirection()
  const matchRoute = useMatchRoute()
  const activeTabRef = useRef<HTMLAnchorElement | null>(null)

  // Auto-scroll active tab into view on mount
  useEffect(() => {
    if (activeTabRef.current !== null) {
      activeTabRef.current.scrollIntoView({
        behavior: 'smooth',
        inline: 'center',
        block: 'nearest',
      })
    }
  }, [engagementId])

  return (
    <nav
      dir={direction}
      role="tablist"
      aria-label={t('tabs.ariaLabel')}
      className="sticky top-0 z-10 bg-muted/50 border-b overflow-x-auto snap-x snap-mandatory scrollbar-none"
    >
      <div className="flex min-w-max">
        {WORKSPACE_TABS.map((tab) => {
          const isActive = matchRoute({
            to: '/engagements/$engagementId/' + tab.path,
            params: { engagementId },
            fuzzy: true,
          })

          return (
            <Link
              key={tab.key}
              ref={isActive ? activeTabRef : undefined}
              to={`/engagements/$engagementId/${tab.path}` as string}
              params={{ engagementId }}
              role="tab"
              aria-selected={Boolean(isActive)}
              className={cn(
                'min-h-11 min-w-11 px-3 py-2 text-sm font-medium whitespace-nowrap snap-center rounded-t-md transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring',
                isActive
                  ? 'border-b-2 border-primary text-primary bg-background'
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
