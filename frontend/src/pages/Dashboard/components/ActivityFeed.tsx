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
 // Use theme-aware colors instead of hardcoded ones
 switch (type) {
 case 'mou':
 return 'text-primary bg-primary/10'
 case 'event':
 return 'text-primary bg-primary/10'
 case 'meeting':
 return 'text-primary bg-primary/10'
 case 'country':
 return 'text-primary bg-primary/10'
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
 className="flex gap-3 rounded-lg p-3 transition-colors hover:bg-accent"
 >
 <div className={`rounded-lg p-2 ${iconColor} shrink-0`}>
 <Icon className="size-5" />
 </div>
 <div className="min-w-0 flex-1">
 <p className="font-medium text-foreground">
 {activity.title}
 </p>
 <p className="truncate text-sm text-muted-foreground">
 {activity.description}
 </p>
 <p className="mt-1 text-xs text-muted-foreground">
 {activity.user} • {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
 </p>
 </div>
 </div>
 )
 })}
 </div>
 )
}