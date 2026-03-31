/**
 * Topic Dossier Index — redirects bare URL to overview tab
 */

import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_protected/dossiers/topics/$id/')({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: '/dossiers/topics/$id/overview',
      params: { id: params.id },
    })
  },
})
