import { useState } from 'react'
import { useAssignmentQueue } from '../hooks/useAssignmentQueue'
import { Alert, AlertDescription } from '../components/ui/alert'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select'
import { AlertCircle, Clock, UserPlus } from 'lucide-react'

export function AssignmentQueuePage() {
  const [priorityFilter, setPriorityFilter] = useState<string | undefined>()
  const [typeFilter, setTypeFilter] = useState<string | undefined>()

  const { data, isLoading, error } = useAssignmentQueue({
    priority: priorityFilter,
    work_item_type: typeFilter,
  })

  const getPriorityColor = (priority: string): string => {
    const colors = {
      urgent: 'bg-danger/10 text-danger dark:bg-danger/30',
      high: 'bg-warning/10 text-warning dark:bg-warning/30',
      normal: 'bg-accent/10 text-accent dark:bg-accent/30',
      low: 'bg-muted text-ink-mute dark:bg-muted/30',
    }
    return colors[priority as keyof typeof colors] || colors.normal
  }

  const urgentCount = data?.items.filter((i) => i.priority === 'urgent').length || 0
  const highCount = data?.items.filter((i) => i.priority === 'high').length || 0
  const normalLowCount =
    data?.items.filter((i) => ['normal', 'low'].includes(i.priority)).length || 0

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertDescription>
            {error.message || 'Failed to load queue. Edge Functions may not be deployed yet.'}
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container mx-auto space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Assignment Queue</h1>
        <p className="mt-1 text-muted-foreground">Manage queued work items awaiting capacity</p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Queued
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? '...' : data?.total_count || 0}</div>
          </CardContent>
        </Card>

        <Card className="border-danger/20 dark:border-danger/70">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-danger">Urgent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-danger">{isLoading ? '...' : urgentCount}</div>
          </CardContent>
        </Card>

        <Card className="border-warning/20 dark:border-warning/70">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-warning">High</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{isLoading ? '...' : highCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Normal/Low</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? '...' : normalLowCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priorities</SelectItem>
            <SelectItem value="urgent">Urgent</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="normal">Normal</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>

        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="dossier">Dossier</SelectItem>
            <SelectItem value="ticket">Ticket</SelectItem>
            <SelectItem value="position">Position</SelectItem>
            <SelectItem value="task">Task</SelectItem>
          </SelectContent>
        </Select>

        {(priorityFilter || typeFilter) && (
          <Button
            variant="outline"
            onClick={() => {
              setPriorityFilter(undefined)
              setTypeFilter(undefined)
            }}
          >
            Clear Filters
          </Button>
        )}
      </div>

      {/* Queue Items */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Queued Items</h2>
        {isLoading ? (
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
              Loading queue...
            </CardContent>
          </Card>
        ) : data?.items && data.items.length > 0 ? (
          data.items.map((item) => (
            <Card key={item.queue_id} className="transition-shadow hover:shadow-md">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="mb-2 flex items-center gap-2">
                      <Badge className={getPriorityColor(item.priority)}>{item.priority}</Badge>
                      <Badge variant="outline">{item.work_item_type}</Badge>
                      <Badge variant="secondary">Position #{item.position}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">Work Item: {item.work_item_id}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Queued: {new Date(item.queued_at).toLocaleString()}
                    </p>
                    {item.required_skills && item.required_skills.length > 0 && (
                      <div className="mt-2">
                        <p className="mb-1 text-xs text-muted-foreground">Required Skills:</p>
                        <div className="flex flex-wrap gap-1">
                          {item.required_skills.map((skill) => (
                            <Badge key={skill.skill_id} variant="outline" className="text-xs">
                              {skill.skill_name_en}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-2 text-end">
                    <Button size="sm" className="gap-2">
                      <UserPlus className="size-4" />
                      Assign
                    </Button>
                    {item.attempts > 0 && (
                      <p className="text-xs text-muted-foreground">
                        {item.attempts} failed attempt{item.attempts > 1 ? 's' : ''}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
              <Clock className="mx-auto mb-2 size-12 text-accent" />
              <p>No items in queue</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
