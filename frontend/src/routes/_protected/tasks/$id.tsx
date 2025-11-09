import { createFileRoute } from '@tanstack/react-router'
import { TaskDetailPage } from '../../../pages/TaskDetailPage'

export const Route = createFileRoute('/_protected/tasks/$id')({
 component: TaskDetailPage,

 // Loader to prefetch task data
 loader: async ({ params, context }) => {
 const { id } = params

 // Return task ID for the page to use
 // The actual data fetching will be done by the useTask hook
 // to leverage TanStack Query caching and real-time subscriptions
 return { taskId: id }
 },

 // Error handling for invalid routes
 errorComponent: ({ error }) => {
 return (
 <div className="flex flex-col items-center justify-center min-h-screen gap-4">
 <h1 className="text-2xl font-bold text-red-600">Error Loading Task</h1>
 <p className="text-gray-600">{error.message}</p>
 </div>
 )
 },
})
