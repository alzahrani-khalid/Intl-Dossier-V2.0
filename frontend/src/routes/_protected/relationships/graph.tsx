import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_protected/relationships/graph')({
  beforeLoad: () => {
    throw redirect({ to: '/dossiers' })
  },
})
