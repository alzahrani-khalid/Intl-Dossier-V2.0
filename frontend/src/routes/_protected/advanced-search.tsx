import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_protected/advanced-search')({
  beforeLoad: () => {
    throw redirect({ to: '/dashboard' })
  },
})
