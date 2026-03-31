/**
 * Dossier Engagement Redirect Route
 *
 * Route: /dossiers/engagements/$id
 * Redirects to the engagement workspace at /engagements/$engagementId/overview.
 *
 * This ensures old dossier-style links continue working after the
 * engagement workspace was introduced in Phase 11.
 *
 * CRITICAL: Maps params.id -> engagementId (param name mismatch
 * between dossier route $id and workspace route $engagementId).
 */

import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_protected/dossiers/engagements/$id')({
  beforeLoad: ({ params }): never => {
    throw redirect({
      to: '/engagements/$engagementId/overview',
      params: { engagementId: params.id },
    })
  },
})
