import { FileText, Calendar, Users, Globe2 } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface Activity {
  id: string
  type: 'mou' | 'event' | 'meeting' | 'country'
  title: string
  description: string
  timestamp: Date
  user: string
}

export function ActivityFeed() {
  const activities: Activity[] = [
    {
      id: '1',
      type: 'mou',
      title: 'New MoU Signed',
      description: 'MoU with UNESCO for statistical cooperation',
      timestamp: new Date(Date.now() - 1000 * 60 * 30),
      user: 'Ahmad Al-Rashid',
    },
    {
      id: '2',
      type: 'event',
      title: 'Conference Registration',
      description: 'Registered for UN Statistical Commission 2025',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
      user: 'Fatima Al-Zahrani',
    },
    {
      id: '3',
      type: 'meeting',
      title: 'Bilateral Meeting Scheduled',
      description: 'Meeting with Japan Statistical Bureau',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5),
      user: 'Mohammed Al-Qahtani',
    },
    {
      id: '4',
      type: 'country',
      title: 'Country Dossier Updated',
      description: 'Updated economic indicators for Germany',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24),
      user: 'Sara Al-Mutairi',
    },
  ]

  const getIcon = (type: Activity['type']) => {
    switch (type) {
      case 'mou':
        return FileText
      case 'event':
        return Calendar
      case 'meeting':
        return Users
      case 'country':
        return Globe2
    }
  }

  const getIconColor = (type: Activity['type']) => {
    switch (type) {
      case 'mou':
        return 'text-purple-600 bg-purple-100 dark:text-purple-400 dark:bg-purple-900/20'
      case 'event':
        return 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/20'
      case 'meeting':
        return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/20'
      case 'country':
        return 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/20'
    }
  }

  return (
    <div className="space-y-4">
      {activities.map((activity) => {
        const Icon = getIcon(activity.type)
        const iconColor = getIconColor(activity.type)

        return (
          <div
            key={activity.id}
            className="flex gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
          >
            <div className={`p-2 rounded-lg ${iconColor} flex-shrink-0`}>
              <Icon className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 dark:text-white">
                {activity.title}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                {activity.description}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                {activity.user} • {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}