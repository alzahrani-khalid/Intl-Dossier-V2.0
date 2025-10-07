import { createFileRoute } from '@tanstack/react-router'
import { AssignmentQueuePage } from '../../../pages/AssignmentQueue'

export const Route = createFileRoute('/_protected/assignments/queue')({
  component: AssignmentQueuePage,
})
