/**
 * Legislation LAYOUT
 *
 * Phase 95 DEAD-08: this file used to render the list body directly and had no
 * <Outlet/>, so `legislation/$id.tsx` was registered but never reachable in
 * render. It is now a layout; the list body lives in `legislation/index.tsx`.
 *
 * `validateSearch` stays HERE (on the layout) so `/legislation?type=…` deep
 * links keep validating for the whole subtree; the index child reads the
 * validated search via `getRouteApi`.
 */

import { createFileRoute, Outlet } from '@tanstack/react-router'

// Search params schema for URL filter synchronization
export interface LegislationSearchParams {
  type?: string // Comma-separated type values
  status?: string // Comma-separated status values
  priority?: string // Comma-separated priority values
  jurisdiction?: string
  search?: string
  dossierId?: string
  hasOpenCommentPeriod?: boolean
  hasUpcomingDeadlines?: boolean
}

export const Route = createFileRoute('/_protected/legislation')({
  component: () => <Outlet />,
  validateSearch: (search: Record<string, unknown>): LegislationSearchParams => {
    return {
      type: search.type as string | undefined,
      status: search.status as string | undefined,
      priority: search.priority as string | undefined,
      jurisdiction: search.jurisdiction as string | undefined,
      search: search.search as string | undefined,
      dossierId: search.dossierId as string | undefined,
      hasOpenCommentPeriod:
        search.hasOpenCommentPeriod === 'true' || search.hasOpenCommentPeriod === true,
      hasUpcomingDeadlines:
        search.hasUpcomingDeadlines === 'true' || search.hasUpcomingDeadlines === true,
    }
  },
})
