/**
 * WorkspaceShell
 * Layout container for the engagement workspace.
 *
 * Renders: sticky header with engagement name + actions,
 * LifecycleStepperBar (in LtrIsolate), WorkspaceTabNav (hidden on after-action),
 * and child content via Outlet.
 *
 * Mobile-first, RTL-compatible, logical properties only.
 */

import type { ReactElement, ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useMatchRoute } from '@tanstack/react-router'
import { useDirection } from '@/hooks/useDirection'
import { useEngagement } from '@/domains/engagements/hooks/useEngagements'
import { LifecycleStepperBar } from '@/components/engagements/LifecycleStepperBar'
import { LtrIsolate } from '@/components/ui/ltr-isolate'
import { WorkspaceTabNav } from '@/components/workspace/WorkspaceTabNav'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

// ============================================================================
// Props
// ============================================================================

interface WorkspaceShellProps {
  engagementId: string
  children: ReactNode
}

// ============================================================================
// Component
// ============================================================================

export function WorkspaceShell({ engagementId, children }: WorkspaceShellProps): ReactElement {
  const { t } = useTranslation('workspace')
  const { direction, isRTL } = useDirection()
  const matchRoute = useMatchRoute()

  const { data: profile, isLoading } = useEngagement(engagementId)

  // Hide tab navigation on after-action child route
  const isAfterAction = Boolean(
    matchRoute({
      to: '/engagements/$engagementId/after-action',
      params: { engagementId },
      fuzzy: true,
    }),
  )

  const engagement = profile?.engagement
  const displayName = isRTL
    ? (engagement?.name_ar ?? engagement?.name_en ?? '')
    : (engagement?.name_en ?? '')
  const currentStage = engagement?.lifecycle_stage ?? 'intake'

  return (
    <div dir={direction} className="flex min-h-screen flex-col bg-background">
      {/* Header bar — sticky */}
      <header
        className={cn(
          'sticky top-0 z-20 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60',
          'px-4 sm:px-6 lg:px-8 py-3',
        )}
      >
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          {/* Engagement title */}
          <div className="min-w-0 flex-1">
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-4 w-32" />
              </div>
            ) : (
              <>
                <h1 className="truncate text-2xl sm:text-3xl font-semibold">{displayName}</h1>
                {engagement?.engagement_type != null && (
                  <span className="inline-block mt-1 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                    {engagement.engagement_type}
                  </span>
                )}
              </>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              variant="outline"
              size="sm"
              className="min-h-11 min-w-11 text-xs sm:text-sm"
              disabled={isLoading}
            >
              {t('actions.transitionStage')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="min-h-11 min-w-11 text-xs sm:text-sm"
              asChild
            >
              <Link
                to="/engagements/$engagementId/after-action"
                params={{ engagementId }}
              >
                {t('actions.logAfterAction')}
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* LifecycleBar — sticky below header */}
      <div className="sticky top-[73px] z-[15] border-b bg-background px-4 sm:px-6 lg:px-8 py-2">
        <LtrIsolate className="w-full">
          <LifecycleStepperBar
            currentStage={currentStage}
            transitions={[]}
            onTransition={(): void => {
              // Transition handler — wired in Plan 02
            }}
            disabled={isLoading}
          />
        </LtrIsolate>
      </div>

      {/* Tab navigation — hidden on after-action */}
      {!isAfterAction && (
        <WorkspaceTabNav engagementId={engagementId} />
      )}

      {/* Content area */}
      <main className="flex-1 px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        {children}
      </main>
    </div>
  )
}
