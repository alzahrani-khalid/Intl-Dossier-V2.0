/**
 * Forum Dossier Index — redirects bare URL to overview tab
 */

import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_protected/dossiers/forums/$id/')({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: '/dossiers/forums/$id/overview',
      params: { id: params.id },
    })
  },
})
