import { createFileRoute } from '@tanstack/react-router'
import WorkingGroups from '../../pages/WorkingGroups'

export const Route = createFileRoute('/_protected/working-groups')({
 component: WorkingGroups,
})
