import { createFileRoute } from '@tanstack/react-router'
import { AuditLogsPage } from '@/pages/audit-logs/AuditLogsPage'

export const Route = createFileRoute('/_protected/audit-logs')({
  component: AuditLogsPage,
})
