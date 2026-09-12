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
import { Link, notFound, rootRouteId, useMatchRoute } from '@tanstack/react-router'
import { AlertTriangle, Pencil } from 'lucide-react'
import { useDirection } from '@/hooks/useDirection'
import { useEngagement } from '@/domains/engagements/hooks/useEngagements'
import { LifecycleStepperBar } from '@/components/engagements/LifecycleStepperBar'
import { LtrIsolate } from '@/components/ui/ltr-isolate'
import { WorkspaceTabNav } from '@/components/workspace/WorkspaceTabNav'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { QueryErrorState } from '@/components/error-states/QueryErrorState'
import { Skeleton } from '@/components/ui/skeleton'
import { ApiError } from '@/lib/api-client'
import { cn } from '@/lib/utils'
import { ENGAGEMENT_TYPE_LABELS } from '@/types/engagement.types'

// ============================================================================
// Props
// ============================================================================

interface WorkspaceShellProps {
  engagementId: string
  children: ReactNode
}

// ============================================================================
// Degraded body (TRUST-04 / D-07)
// ============================================================================

/**
 * The degraded body `engagement-dossiers` returns for an engagement dossier whose
 * `engagement_dossiers` extension row is missing: 200, a null engagement, and the base row's
 * identity. Before 93-12 the function collapsed that case into the same 404 as an absent id, so
 * this shape could not exist and the client could not tell the two apart.
 *
 * It is narrowed here rather than widened into `EngagementFullProfile`, which describes the
 * healthy `get_engagement_full` shape and is consumed by every other engagement surface.
 */
interface DegradedEngagementBody {
  engagement: null
  dossier: {
    id: string
    name_en: string
    name_ar: string
    type: string
    status: string
  }
}

function asDegraded(profile: unknown): DegradedEngagementBody | null {
  if (profile === null || typeof profile !== 'object') return null
  const body = profile as Partial<DegradedEngagementBody>
  if (body.engagement != null) return null
  if (body.dossier == null || typeof body.dossier !== 'object') return null
  return body as DegradedEngagementBody
}

// ============================================================================
// Component
// ============================================================================

export function WorkspaceShell({ engagementId, children }: WorkspaceShellProps): ReactElement {
  const { t } = useTranslation('workspace')
  const { direction, isRTL } = useDirection()
  const matchRoute = useMatchRoute()

  const {
    data: profile,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useEngagement(engagementId)

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

  // The query is `enabled: !!id`, so a falsy id leaves it pending-but-not-fetching: `isLoading`
  // false with no data. Skeletons, not an <h1> whose name resolved to '' — the same titleless
  // chrome the three branches below exist to make unreachable.
  const isIdentityPending = isLoading || profile == null

  // ==========================================================================
  // Three distinct states (D-05 / D-06 / D-07), in this order.
  //
  // Until 93-12's server half, a missing extension row and an absent id were the SAME 404 here,
  // and both fell through to the chrome below — which paints an <h1> whose displayName has
  // resolved to '' — the titleless shell. The three branches below make that fall-through
  // unreachable: a rejection is a failure, a well-formed absent id is a not-found, and an
  // incomplete record is named as incomplete. The happy path is untouched.
  // ==========================================================================

  // 2. Not-found — a well-formed id that resolves to no row. Thrown into the root
  //    notFoundComponent (routes/__root.tsx:72). `apiGet` rejects with `ApiError`, which carries
  //    `status`, so query-client.ts's 4xx short-circuit means this arrives after ONE round-trip.
  //
  //    `routeId: rootRouteId` is LOAD-BEARING, not decoration — measured, not reasoned. A bare
  //    `notFound()` thrown from a component never reaches the root 404 page in this router
  //    (v1.170.8): `Match.js:74` builds a `CatchNotFound` only for a route that declares its OWN
  //    `notFoundComponent` (`defaultNotFoundComponent` is NOT consulted there), so the nearest
  //    boundary is this route's `CatchBoundary`, whose `onCatch` stamps `error.routeId ??=` with
  //    THIS route's id and rethrows. The root's `CatchNotFound` then rejects it — its fallback
  //    throws when `error.routeId !== matchState.routeId` — and the throw lands in the router's
  //    `defaultErrorComponent`: "Something went wrong" for a record that is merely absent, the
  //    exact collapse D-05 forbids. Pre-stamping the root's id makes `??=` a no-op and the root
  //    boundary accept it. Verified live by `tests/e2e/93-degraded-engagement.spec.ts`.
  // 3. Every other rejection is a failure, and renders the shared error state — never the
  //    not-found page, never a confident-empty shell.
  if (isError) {
    if (error instanceof ApiError && error.status === 404) {
      throw notFound({ routeId: rootRouteId })
    }
    return (
      <QueryErrorState variant="page" onRetry={() => void refetch()} isRetrying={isRefetching} />
    )
  }

  // 1. Degraded — 200 with the base row's identity and no extension row. Identity first, then a
  //    named callout; dependent regions (lifecycle bar, tab nav, tab content) need extension data
  //    and are SUPPRESSED rather than rendered as empty states with create CTAs, which would be a
  //    second confident lie. Warn, not danger: nothing failed, the record is incomplete. No retry.
  const degraded = asDegraded(profile)
  if (degraded !== null) {
    const degradedName = isRTL ? degraded.dossier.name_ar : degraded.dossier.name_en
    return (
      <div dir={direction} className="flex min-h-screen flex-col bg-background">
        <header
          className={cn('sticky top-0 z-20 border-b bg-background', 'px-4 sm:px-6 lg:px-8 py-3')}
        >
          <h1 className="truncate text-2xl sm:text-3xl font-semibold text-start">{degradedName}</h1>
        </header>

        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <Alert role="status">
            <AlertTriangle className="h-4 w-4 text-warn" />
            <AlertTitle>{t('common:errors.incompleteRecord.title')}</AlertTitle>
            <AlertDescription>{t('common:errors.incompleteRecord.description')}</AlertDescription>
          </Alert>
        </main>
      </div>
    )
  }

  return (
    <div dir={direction} className="flex min-h-screen flex-col bg-background">
      {/* Header bar — sticky */}
      <header
        className={cn('sticky top-0 z-20 border-b bg-background', 'px-4 sm:px-6 lg:px-8 py-3')}
      >
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          {/* Engagement title */}
          <div className="min-w-0 flex-1">
            {isIdentityPending ? (
              <div className="space-y-2">
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-4 w-32" />
              </div>
            ) : (
              <>
                <h1 className="truncate text-2xl sm:text-3xl font-semibold">{displayName}</h1>
                {engagement?.engagement_type != null && (
                  <span className="inline-block mt-1 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                    {ENGAGEMENT_TYPE_LABELS[engagement.engagement_type]?.[isRTL ? 'ar' : 'en'] ??
                      engagement.engagement_type}
                  </span>
                )}
              </>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Edit affordance — engagement detail uses this workspace (not
                DossierShell), so its Edit entry point lives here. Opens the
                dossier edit wizard at /dossiers/edit/engagements/$id, mirroring
                the DossierShell Edit button treatment (A-1 follow-up). */}
            <Button
              variant="outline"
              size="sm"
              className="min-h-11 min-w-11 text-xs sm:text-sm"
              asChild
            >
              <Link
                to="/dossiers/edit/$type/$id"
                params={{ type: 'engagements', id: engagementId }}
              >
                <Pencil className="h-4 w-4 sm:me-2" />
                <span className="hidden sm:inline">{t('workspace:actions.edit')}</span>
              </Link>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="min-h-11 min-w-11 text-xs sm:text-sm"
              asChild
            >
              <Link to="/engagements/$engagementId/after-action" params={{ engagementId }}>
                {t('actions.logAfterAction')}
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* LifecycleBar — sticky below header, hidden until engagement loads */}
      <div className="sticky top-[73px] z-[15] border-b bg-background px-4 sm:px-6 lg:px-8 py-2">
        {isIdentityPending ? (
          <Skeleton className="h-10 w-full rounded-md" />
        ) : (
          <LtrIsolate className="w-full">
            <LifecycleStepperBar
              engagementId={engagementId}
              currentStage={currentStage}
              compact={false}
            />
          </LtrIsolate>
        )}
      </div>

      {/* Tab navigation — hidden on after-action */}
      {!isAfterAction && <WorkspaceTabNav engagementId={engagementId} />}

      {/* Content area */}
      <main className="flex-1 px-4 sm:px-6 lg:px-8 py-4 sm:py-6">{children}</main>
    </div>
  )
}
