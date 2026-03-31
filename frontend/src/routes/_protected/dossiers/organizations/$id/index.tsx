/**
 * Organization Dossier Index — redirects bare URL to overview tab
 */

import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_protected/dossiers/organizations/$id/')({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: '/dossiers/organizations/$id/overview',
      params: { id: params.id },
    })
  },
})
