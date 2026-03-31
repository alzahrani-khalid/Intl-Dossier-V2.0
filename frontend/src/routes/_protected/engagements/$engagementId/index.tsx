/**
 * Engagement Index Route — Redirect to Overview
 *
 * Handles /engagements/:id by redirecting to /engagements/:id/overview.
 * Ensures existing links without a tab suffix land on the overview tab.
 */

import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_protected/engagements/$engagementId/')({
  beforeLoad: ({ params }): never => {
    throw redirect({
      to: '/engagements/$engagementId/overview',
      params: { engagementId: params.engagementId },
    })
  },
})
