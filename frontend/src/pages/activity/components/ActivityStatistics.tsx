/**
 * Activity Statistics Component
 *
 * Displays activity statistics cards:
 * - Following count
 * - Activity today
 * - Activity this week
 *
 * Mobile-first and RTL-ready
 */

import { useTranslation } from 'react-i18next'
import { Users, Calendar, CalendarDays } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'

interface ActivityStatisticsProps {
  followingCount: number
  className?: string
}

export function ActivityStatistics({ followingCount, className }: ActivityStatisticsProps) {
  const { t, i18n } = useTranslation('activity-feed')
  const isRTL = i18n.language === 'ar'

  const stats = [
    {
      key: 'followingCount',
      icon: Users,
      value: followingCount,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    },
    {
      key: 'activityToday',
      icon: Calendar,
      value: '—', // Could be connected to real data
      color: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-900/30',
    },
    {
      key: 'activityWeek',
      icon: CalendarDays,
      value: '—', // Could be connected to real data
      color: 'text-purple-600',
      bgColor: 'bg-purple-100 dark:bg-purple-900/30',
    },
  ]

  return (
    <div
      className={cn('grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4', className)}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {stats.map((stat) => {
        const Icon = stat.icon
        return (
          <Card key={stat.key} className="overflow-hidden">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center gap-4">
                <div
                  className={cn(
                    'flex items-center justify-center w-12 h-12 rounded-lg flex-shrink-0',
                    stat.bgColor,
                  )}
                >
                  <Icon className={cn('h-6 w-6', stat.color)} />
                </div>
                <div className="min-w-0">
                  <p className="text-2xl sm:text-3xl font-bold truncate">{stat.value}</p>
                  <p className="text-sm text-muted-foreground truncate">
                    {t(`statistics.${stat.key}`)}
                  </p>
                  <p className="text-xs text-muted-foreground/70 truncate hidden sm:block">
                    {t(`statistics.${stat.key}Description`)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

export default ActivityStatistics
