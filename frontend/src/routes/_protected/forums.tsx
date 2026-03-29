import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_protected/forums')({
  beforeLoad: () => {
    throw redirect({ to: '/dossiers/forums' })
  },
})
