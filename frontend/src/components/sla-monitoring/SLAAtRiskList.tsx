/**
 * SLA At-Risk List Component
 * Feature: sla-monitoring
 *
 * Displays items at risk of SLA breach with live countdown and RTL support
 */

import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Clock, AlertTriangle, User, ExternalLink, RefreshCw } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import type { SLAAtRiskItem } from '@/types/sla.types'
import { formatSLADuration, formatSLADurationAr, getSLAProgressColor } from '@/types/sla.types'
import { cn } from '@/lib/utils'

interface SLAAtRiskListProps {
  data?: SLAAtRiskItem[]
  isLoading?: boolean
  onRefresh?: () => void
  onItemClick?: (item: SLAAtRiskItem) => void
  className?: string
}

export function SLAAtRiskList({
  data,
  isLoading,
  onRefresh,
  onItemClick,
  className,
}: SLAAtRiskListProps) {
  const { t, i18n } = useTranslation('sla')
  const isRTL = i18n.language === 'ar'
  const [now, setNow] = useState(Date.now())

  // Update countdown every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now())
    }, 60000)
    return () => clearInterval(interval)
  }, [])

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  const formatDuration = (minutes: number) =>
    isRTL ? formatSLADurationAr(minutes) : formatSLADuration(minutes)

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-700 border-red-200'
      case 'high':
        return 'bg-orange-100 text-orange-700 border-orange-200'
      case 'medium':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200'
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  // Calculate real-time remaining time
  const getRemainingTime = (item: SLAAtRiskItem) => {
    const deadline = new Date(item.deadline_at).getTime()
    const remaining = Math.max(0, Math.floor((deadline - now) / 60000))
    return remaining
  }

  return (
    <Card className={className} dir={isRTL ? 'rtl' : 'ltr'}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            {t('atRisk.title')}
          </CardTitle>
          <CardDescription>{t('atRisk.description')}</CardDescription>
        </div>
        {onRefresh && (
          <Button variant="outline" size="sm" onClick={onRefresh}>
            <RefreshCw className={cn('h-4 w-4', isRTL ? 'ms-2' : 'me-2')} />
            {t('atRisk.refresh')}
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {data && data.length > 0 ? (
          <ScrollArea className="h-[400px] pe-4">
            <div className="space-y-4">
              {data.map((item) => {
                const remainingMinutes = getRemainingTime(item)
                const isBreached = remainingMinutes === 0
                const progressColor = getSLAProgressColor(item.progress_pct)

                return (
                  <div
                    key={item.entity_id}
                    className={cn(
                      'border rounded-lg p-4 transition-colors cursor-pointer hover:bg-muted/50',
                      isBreached && 'border-red-300 bg-red-50',
                    )}
                    onClick={() => onItemClick?.(item)}
                  >
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium truncate">{item.title}</h4>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <Badge variant="outline" className={getPriorityColor(item.priority)}>
                            {t(`priority.${item.priority}`, item.priority)}
                          </Badge>
                          <Badge variant="secondary">{item.status}</Badge>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" className="shrink-0">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{t('atRisk.slaProgress')}</span>
                        <span className={cn('font-medium', isBreached && 'text-red-600')}>
                          {item.progress_pct}%
                        </span>
                      </div>
                      <Progress value={item.progress_pct} className={cn('h-2', progressColor)} />
                    </div>

                    <div className="flex items-center justify-between mt-3 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>
                          {isBreached
                            ? t('atRisk.breached')
                            : `${formatDuration(remainingMinutes)} ${t('atRisk.remaining')}`}
                        </span>
                      </div>
                      {item.assignee_name && (
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <User className="h-4 w-4" />
                          <span>{item.assignee_name}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </ScrollArea>
        ) : (
          <div className="h-32 flex flex-col items-center justify-center text-muted-foreground">
            <AlertTriangle className="h-8 w-8 mb-2 text-green-500" />
            <p>{t('atRisk.noItemsAtRisk')}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
