import React from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from '@tanstack/react-router'
import { useMyAssignments } from '../hooks/useMyAssignments'
import { Alert, AlertDescription } from '../components/ui/alert'
import { Badge } from '../components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { AlertCircle, Clock, CheckCircle2, XCircle } from 'lucide-react'

export function MyAssignmentsPage() {
  const { t } = useTranslation('assignments')
  const navigate = useNavigate()
  const { data, isLoading, error } = useMyAssignments()

  const handleAssignmentClick = (assignment: any) => {
    // Navigate to assignment detail page
    navigate({ to: `/assignments/${assignment.id}` })
  }

  const formatTimeRemaining = (seconds: number): string => {
    if (seconds < 0) return t('sla_breached')
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    if (hours > 24) {
      const days = Math.floor(hours / 24)
      return `${days}d ${hours % 24}h`
    }
    return `${hours}h ${minutes}m`
  }

  const getPriorityColor = (priority: string): string => {
    const colors = {
      urgent: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      high: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      normal: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      low: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
    }
    return colors[priority as keyof typeof colors] || colors.normal
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error.message || 'Failed to load assignments. Edge Functions may not be deployed yet.'}
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t('my_assignments')}</h1>
        <p className="text-muted-foreground mt-1">
          {t('my_assignments_description')}
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Active
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? '...' : data?.summary.active_count || 0}
            </div>
          </CardContent>
        </Card>

        <Card className="border-yellow-200 dark:border-yellow-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-yellow-700 dark:text-yellow-300">
              At Risk (75%+ SLA)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">
              {isLoading ? '...' : data?.summary.at_risk_count || 0}
            </div>
          </CardContent>
        </Card>

        <Card className="border-red-200 dark:border-red-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-red-700 dark:text-red-300">
              SLA Breached
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-700 dark:text-red-300">
              {isLoading ? '...' : data?.summary.breached_count || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Assignments List */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Active Assignments</h2>
        {isLoading ? (
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
              Loading assignments...
            </CardContent>
          </Card>
        ) : data?.assignments && data.assignments.length > 0 ? (
          data.assignments.map((assignment) => (
            <Card
              key={assignment.id}
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => handleAssignmentClick(assignment)}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={getPriorityColor(assignment.priority)}>
                        {assignment.priority}
                      </Badge>
                      <Badge variant="outline">{assignment.work_item_type}</Badge>
                      {assignment.escalated && (
                        <Badge variant="destructive">Escalated</Badge>
                      )}
                    </div>
                    <h3 className="text-lg font-semibold mb-1">
                      {assignment.work_item_title || assignment.work_item_id}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Assigned: {new Date(assignment.assigned_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-end">
                    <div className="flex items-center gap-2 justify-end">
                      <Clock className={`h-4 w-4 ${
                        assignment.time_remaining_seconds < 0 ? 'text-red-500' :
                        assignment.warning_sent ? 'text-yellow-500' :
                        'text-green-500'
                      }`} />
                      <span className={`font-semibold ${
                        assignment.time_remaining_seconds < 0 ? 'text-red-500' :
                        assignment.warning_sent ? 'text-yellow-500' :
                        'text-green-500'
                      }`}>
                        {formatTimeRemaining(assignment.time_remaining_seconds)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Due: {new Date(assignment.sla_deadline).toLocaleString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
              <CheckCircle2 className="h-12 w-12 mx-auto mb-2 text-green-500" />
              <p>No active assignments</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
