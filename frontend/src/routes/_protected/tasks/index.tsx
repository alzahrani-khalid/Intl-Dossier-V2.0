import { createFileRoute } from '@tanstack/react-router'
import { MyTasksPage } from '../../../pages/MyTasks'

export const Route = createFileRoute('/_protected/tasks/')({
  component: MyTasksPage,
})
