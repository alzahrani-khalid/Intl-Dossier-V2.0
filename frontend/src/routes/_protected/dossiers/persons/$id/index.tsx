/**
 * Person Dossier Index — redirects bare URL to overview tab
 */

import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_protected/dossiers/persons/$id/')({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: '/dossiers/persons/$id/overview',
      params: { id: params.id },
    })
  },
})
