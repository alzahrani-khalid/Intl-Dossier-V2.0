import { createFileRoute } from '@tanstack/react-router'
import { MyAssignmentsPage } from '../../../pages/MyAssignments'

export const Route = createFileRoute('/_protected/tasks/')({
 component: MyAssignmentsPage,
})
