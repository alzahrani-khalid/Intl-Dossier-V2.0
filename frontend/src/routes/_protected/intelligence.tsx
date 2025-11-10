import { createFileRoute } from '@tanstack/react-router'
import Intelligence from '../../pages/Intelligence'

export const Route = createFileRoute('/_protected/intelligence')({
 component: Intelligence,
})
