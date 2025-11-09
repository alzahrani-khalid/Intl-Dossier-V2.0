import { createFileRoute } from '@tanstack/react-router'
import { EscalationsPage } from '../../../pages/Escalations'

export const Route = createFileRoute('/_protected/tasks/escalations')({
 component: EscalationsPage,
})
