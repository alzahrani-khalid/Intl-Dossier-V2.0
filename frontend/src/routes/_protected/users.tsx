import { createFileRoute } from '@tanstack/react-router'
import { UsersPage } from '../../pages/users/UsersPage'

export const Route = createFileRoute('/_protected/users')({
  component: UsersPage,
})
