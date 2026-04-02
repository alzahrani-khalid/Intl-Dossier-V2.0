import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_protected/briefing-books')({
  beforeLoad: () => {
    throw redirect({ to: '/dashboard' })
  },
})
