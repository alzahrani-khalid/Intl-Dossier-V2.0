import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_protected/availability-polling')({
  beforeLoad: () => {
    throw redirect({ to: '/dashboard' })
  },
})
