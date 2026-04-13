import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { FileText, Plus } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '../../../components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../../components/ui/card'

export const Route = createFileRoute('/_protected/after-actions/')({
  component: AfterActionsIndexPage,
})

function AfterActionsIndexPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <PageHeader
            icon={<FileText className="h-6 w-6" />}
            title="After Action Records"
            subtitle="Manage engagement outcomes and commitments"
            className="pb-0"
            actions={
              <Button className="gap-2" onClick={() => navigate({ to: '/engagements' })}>
                <Plus className="h-5 w-5" />
                Create After Action
              </Button>
            }
          />
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <CardTitle>After Actions</CardTitle>
            <CardDescription>
              After action records are created from engagement details.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 dark:text-gray-400 text-center py-8">
              No after action records available. Create an engagement to get started.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
