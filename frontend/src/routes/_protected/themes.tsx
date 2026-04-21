import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_protected/themes')({
  beforeLoad: (): never => {
    throw redirect({ to: '/' })
  },
})
