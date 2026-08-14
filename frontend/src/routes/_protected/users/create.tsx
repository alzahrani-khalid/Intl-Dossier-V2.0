import { createFileRoute } from '@tanstack/react-router'
import { UserCreatePage } from '@/pages/users/UserCreatePage'

export const Route = createFileRoute('/_protected/users/create')({
  component: UserCreatePage,
})
