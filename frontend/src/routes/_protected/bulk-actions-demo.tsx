import { createFileRoute } from '@tanstack/react-router'
import { devModeGuard } from '@/lib/dev-mode-guard'
import { BulkActionsDemo } from '@/pages/bulk-actions/BulkActionsDemo'

export const Route = createFileRoute('/_protected/bulk-actions-demo')({
  beforeLoad: devModeGuard,
  component: BulkActionsDemo,
})
