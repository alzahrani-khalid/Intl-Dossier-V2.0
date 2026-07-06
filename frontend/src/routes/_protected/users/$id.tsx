import type { ReactElement } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { UserDetailPage } from '@/pages/users/UserDetailPage'

export const Route = createFileRoute('/_protected/users/$id')({
  component: UserDetailRoute,
})

function UserDetailRoute(): ReactElement {
  const { id } = Route.useParams()
  return <UserDetailPage userId={id} />
}
