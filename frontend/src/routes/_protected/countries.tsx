import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_protected/countries')({
  beforeLoad: () => {
    throw redirect({ to: '/dossiers/countries' })
  },
})
