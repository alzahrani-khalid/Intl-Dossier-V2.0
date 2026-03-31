/**
 * Elected Official Detail Index Route
 * Redirects to overview tab.
 */

import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_protected/dossiers/elected-officials/$id/')({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: '/dossiers/elected-officials/$id/overview',
      params: { id: params.id },
    })
  },
})
