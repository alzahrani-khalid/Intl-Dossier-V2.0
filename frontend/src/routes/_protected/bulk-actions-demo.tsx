import { createFileRoute } from '@tanstack/react-router'
import { BulkActionsDemo } from '@/pages/bulk-actions/BulkActionsDemo'

export const Route = createFileRoute('/_protected/bulk-actions-demo')({
  component: BulkActionsDemo,
})
