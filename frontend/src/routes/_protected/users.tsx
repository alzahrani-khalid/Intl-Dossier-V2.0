import { createFileRoute } from '@tanstack/react-router'
import { UsersPage } from '../../pages/users/UsersPage'
import { requireAdmin } from '@/lib/auth/requireAdmin'

export const Route = createFileRoute('/_protected/users')({
  component: UsersPage,
  beforeLoad: requireAdmin,
})
