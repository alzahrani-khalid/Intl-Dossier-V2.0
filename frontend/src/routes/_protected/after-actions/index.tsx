import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { FileText, Plus } from 'lucide-react'
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <FileText className="h-8 w-8" />
            After Action Records
          </h1>
          <p className="text-muted-foreground">Manage engagement outcomes and commitments</p>
        </div>
        <Button className="gap-2" onClick={() => navigate({ to: '/engagements' })}>
          <Plus className="h-5 w-5" />
          Create After Action
        </Button>
      </div>

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
