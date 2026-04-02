import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_protected/export')({
  beforeLoad: () => {
    throw redirect({ to: '/dossiers' })
  },
})
