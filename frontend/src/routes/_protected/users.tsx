import { createFileRoute, Outlet } from '@tanstack/react-router'
import { requireAdmin } from '@/lib/auth/require-admin'

export const Route = createFileRoute('/_protected/users')({
  component: () => <Outlet />,
  beforeLoad: requireAdmin,
})
