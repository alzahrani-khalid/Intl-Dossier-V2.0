/**
 * Single Report Page
 *
 * Page for editing a specific saved report.
 *
 * TRUST-03 (93-13). This route had NO fetch at all: `useReportBuilderState`
 * (`domains/misc/hooks/useReportBuilder.ts`) ignores `initialReportId` entirely, so
 * `/reports/<any-id>` rendered a fresh empty builder — a confident lie about a record that may
 * not exist. The loader below is the fetch the route never had; it exists only to answer
 * "does this report exist", and it does not feed the builder. The builder's behavior for an id
 * that DOES exist is unchanged.
 */

import type { JSX } from 'react'
import {
  createFileRoute,
  notFound,
  useRouter,
  type ErrorComponentProps,
} from '@tanstack/react-router'
import { ReportBuilder } from '@/components/report-builder'
import { QueryErrorState } from '@/components/error-states/QueryErrorState'
import { queryClient } from '@/lib/query-client'
import { supabase } from '@/lib/supabase'

export const Route = createFileRoute('/_protected/reports/$reportId')({
  component: ReportDetailPage,

  // Existence gate. Two outcomes, both honest:
  //   row absent  -> throw notFound()  -> the root 404 page (routes/__root.tsx notFoundComponent)
  //   read reject -> propagates        -> this route's errorComponent (QueryErrorState, below)
  loader: async ({ params }) => {
    // KNOWN HAZARD — WRITE-06 / 42P17, owned by Phase 94, NOT by this route.
    // `custom_reports` and `report_shares` carry mutually recursive SELECT policies, so Postgres
    // may answer this read with `42P17 infinite recursion detected in policy`. When it does, the
    // rejection below renders the shared error state. That is the intended pre-Phase-94 render —
    // an honest "this failed", not this route being broken. Phase 94 fixes the recursion, after
    // which an absent id takes the notFound() arm instead.
    const report = await queryClient.ensureQueryData({
      queryKey: ['custom_reports', 'exists', params.reportId],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('custom_reports')
          .select('id')
          .eq('id', params.reportId)
          .maybeSingle()

        // Surface the rejection instead of swallowing it into "no such report".
        if (error) throw error
        return data
      },
    })

    if (report === null) throw notFound()

    return { reportId: params.reportId }
  },

  errorComponent: ReportRouteError,
})

function ReportRouteError({ error }: ErrorComponentProps): JSX.Element {
  const router = useRouter()

  // The rejection is internal — console only (D-08). The DOM gets i18n copy and nothing else.
  console.error('Report route error:', error)

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
      <QueryErrorState variant="page" onRetry={() => void router.invalidate()} />
    </div>
  )
}

function ReportDetailPage(): JSX.Element {
  const { reportId } = Route.useParams()
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 h-[calc(100vh-4rem)]">
      <ReportBuilder initialReportId={reportId} />
    </div>
  )
}
