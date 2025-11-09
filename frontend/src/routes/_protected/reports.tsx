import { createFileRoute } from '@tanstack/react-router'
import { ReportsPage } from '@/pages/reports/ReportsPage'

export const Route = createFileRoute('/_protected/reports')({
 component: ReportsPage
})