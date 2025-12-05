import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Calendar, User, AlertCircle } from 'lucide-react'
import type { Database } from '@/types/database'

type Assignment = Database['public']['Tables']['assignments']['Row']

interface AssignmentMetadataCardProps {
  assignment: Assignment
  assigneeName?: string
  assigneeAvatar?: string
}

export function AssignmentMetadataCard({
  assignment,
  assigneeName,
  assigneeAvatar,
}: AssignmentMetadataCardProps): React.JSX.Element {
  const { t, i18n } = useTranslation('assignments')
  const isRTL = i18n.language === 'ar'

  const getPriorityColor = (
    priority: string,
  ): 'default' | 'secondary' | 'outline' | 'destructive' => {
    switch (priority) {
      case 'urgent':
        return 'destructive'
      case 'high':
        return 'default'
      case 'medium':
        return 'secondary'
      case 'low':
        return 'outline'
      default:
        return 'secondary'
    }
  }

  const getStatusColor = (status: string): 'default' | 'secondary' | 'outline' | 'destructive' => {
    switch (status) {
      case 'completed':
        return 'default'
      case 'in_progress':
        return 'secondary'
      case 'assigned':
        return 'outline'
      case 'cancelled':
        return 'destructive'
      default:
        return 'secondary'
    }
  }

  const formatDate = (dateString: string): string => {
    return new Intl.DateTimeFormat(i18n.language, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(dateString))
  }

  return (
    <Card dir={isRTL ? 'rtl' : 'ltr'}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          {t('metadata.title')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Assignment ID */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">{t('metadata.id')}:</span>
          <span className="font-mono text-sm font-medium">{assignment.id}</span>
        </div>

        {/* Created Date */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground inline-flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            {t('metadata.created')}:
          </span>
          <span className="text-sm">{formatDate(assignment.created_at)}</span>
        </div>

        {/* Assignee */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground inline-flex items-center gap-1">
            <User className="h-4 w-4" />
            {t('metadata.assignee')}:
          </span>
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={assigneeAvatar} alt={assigneeName} />
              <AvatarFallback>
                {assigneeName
                  ?.split(' ')
                  .map((n) => n[0])
                  .join('')
                  .toUpperCase() || '??'}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium">{assigneeName || t('metadata.unknown')}</span>
          </div>
        </div>

        {/* Priority */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">{t('metadata.priority')}:</span>
          <Badge variant={getPriorityColor(assignment.priority)}>
            {t(`priority.${assignment.priority}`)}
          </Badge>
        </div>

        {/* Status */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">{t('metadata.status')}:</span>
          <Badge variant={getStatusColor(assignment.status)}>
            {t(`status.${assignment.status}`)}
          </Badge>
        </div>
      </CardContent>
    </Card>
  )
}
