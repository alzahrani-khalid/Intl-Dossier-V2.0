import { createFileRoute } from '@tanstack/react-router'
import { ForumsPage } from '@/pages/forums/ForumsPage'

export const Route = createFileRoute('/_protected/forums')({
 component: ForumsPage
})