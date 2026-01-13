import { createFileRoute } from '@tanstack/react-router'
import WorkingGroupsPage from '../../pages/WorkingGroupsPage'

export const Route = createFileRoute('/_protected/working-groups')({
  component: WorkingGroupsPage,
})
