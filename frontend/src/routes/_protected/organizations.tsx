import { createFileRoute } from '@tanstack/react-router'
import Organizations from '../../pages/Organizations'

export const Route = createFileRoute('/_protected/organizations')({
 component: Organizations,
})
