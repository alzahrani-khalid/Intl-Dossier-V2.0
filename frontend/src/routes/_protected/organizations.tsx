import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_protected/organizations')({
  beforeLoad: () => {
    throw redirect({ to: '/dossiers/organizations' })
  },
})
