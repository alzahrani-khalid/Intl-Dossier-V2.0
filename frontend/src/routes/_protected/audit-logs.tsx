import { createFileRoute } from '@tanstack/react-router'
import { AuditLogsPage } from '@/pages/audit-logs/AuditLogsPage'
import { requireAdmin } from '@/lib/auth/require-admin'

export const Route = createFileRoute('/_protected/audit-logs')({
  component: AuditLogsPage,
  beforeLoad: requireAdmin,
})
