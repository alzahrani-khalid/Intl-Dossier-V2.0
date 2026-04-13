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
    <div className="space-y-6">
      <PageHeader
        icon={<FileText className="h-6 w-6" />}
        title="After Action Records"
        subtitle="Manage engagement outcomes and commitments"
        actions={
          <Button className="gap-2" onClick={() => navigate({ to: '/engagements' })}>
            <Plus className="h-5 w-5" />
            Create After Action
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>After Actions</CardTitle>
          <CardDescription>
            After action records are created from engagement details.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            No after action records available. Create an engagement to get started.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
