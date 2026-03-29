import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_protected/contacts')({
  beforeLoad: () => {
    throw redirect({ to: '/dossiers/persons' })
  },
})
