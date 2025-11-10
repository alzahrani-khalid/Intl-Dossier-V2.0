import { createFileRoute } from '@tanstack/react-router'
import ExportDialog from '@/components/export/ExportDialog'

export const Route = createFileRoute('/_protected/export')({
 component: ExportDialog,
})
