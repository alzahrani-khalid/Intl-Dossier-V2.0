import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_protected/working-groups')({
  beforeLoad: () => {
    throw redirect({ to: '/dossiers/working_groups' })
  },
})
