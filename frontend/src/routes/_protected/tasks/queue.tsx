import { createFileRoute } from '@tanstack/react-router'
import { AssignmentQueuePage } from '../../../pages/AssignmentQueue'

export const Route = createFileRoute('/_protected/tasks/queue')({
  component: AssignmentQueuePage,
})
