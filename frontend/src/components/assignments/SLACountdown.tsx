import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Clock, AlertTriangle, CheckCircle2 } from 'lucide-react'

interface SLACountdownProps {
  sla: {
    deadline: string
    time_remaining_seconds: number
    percentage_elapsed: number
    health_status: 'safe' | 'warning' | 'breached'
  }
}

type HealthStatus = 'safe' | 'warning' | 'breached'

export function SLACountdown({ sla }: SLACountdownProps): React.JSX.Element {
  const { deadline, health_status } = sla
  const { t, i18n } = useTranslation('assignments')
  const isRTL = i18n.language === 'ar'
  const [timeRemaining, setTimeRemaining] = useState<number>(0)
  const [percentageRemaining, setPercentageRemaining] = useState<number>(100)

  useEffect(() => {
    const updateCountdown = (): void => {
      const now = new Date().getTime()
      const deadlineTime = new Date(deadline).getTime()
      const remaining = deadlineTime - now

      setTimeRemaining(Math.max(0, remaining))
      // Calculate percentage remaining (100 - percentage_elapsed)
      const percentage = Math.max(0, 100 - sla.percentage_elapsed)
      setPercentageRemaining(Math.min(100, percentage))
    }

    updateCountdown()
    const interval = setInterval(updateCountdown, 1000)

    return () => clearInterval(interval)
  }, [deadline, sla.percentage_elapsed])

  const formatTimeRemaining = (ms: number): string => {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (days > 0) return t('sla.days_remaining', { count: days })
    if (hours > 0) return t('sla.hours_remaining', { count: hours % 24 })
    if (minutes > 0) return t('sla.minutes_remaining', { count: minutes % 60 })
    return t('sla.seconds_remaining', { count: seconds % 60 })
  }

  // Health status helper (reserved for future use)
  // const getHealthStatus = (): HealthStatus => {
  // if (timeRemaining <= 0) return 'breached';
  // if (percentageRemaining < 25) return 'warning';
  // return 'safe';
  // };

  const getHealthColor = (health: HealthStatus): string => {
    switch (health) {
      case 'safe':
        return 'text-green-600 bg-green-50 dark:bg-green-950 dark:text-green-400'
      case 'warning':
        return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-950 dark:text-yellow-400'
      case 'breached':
        return 'text-red-600 bg-red-50 dark:bg-red-950 dark:text-red-400'
    }
  }

  const getIcon = (health: HealthStatus): React.JSX.Element => {
    switch (health) {
      case 'safe':
        return <CheckCircle2 className="h-5 w-5" />
      case 'warning':
        return <AlertTriangle className="h-5 w-5" />
      case 'breached':
        return <Clock className="h-5 w-5" />
    }
  }

  const healthStatus = health_status

  return (
    <Card dir={isRTL ? 'rtl' : 'ltr'}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          {t('sla.title', { defaultValue: 'SLA Tracking' })}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            {t('sla.health', { defaultValue: 'Status' })}:
          </span>
          <Badge className={getHealthColor(healthStatus)} variant="outline">
            <span className="inline-flex items-center gap-1">
              {getIcon(healthStatus)}
              {t(`sla.health_${healthStatus}`, { defaultValue: healthStatus })}
            </span>
          </Badge>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {t('sla.remaining', { defaultValue: 'Time Remaining' })}:
            </span>
            <span className="text-sm font-medium">{formatTimeRemaining(timeRemaining)}</span>
          </div>
          <Progress value={percentageRemaining} className="h-2" />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            {t('sla.percentage', { defaultValue: 'Progress' })}:
          </span>
          <span className={`text-lg font-bold ${getHealthColor(healthStatus)}`}>
            {`${Math.round(percentageRemaining)}%`}
          </span>
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{t('sla.deadline')}:</span>
          <span>
            {new Intl.DateTimeFormat(i18n.language, {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            }).format(new Date(deadline))}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
