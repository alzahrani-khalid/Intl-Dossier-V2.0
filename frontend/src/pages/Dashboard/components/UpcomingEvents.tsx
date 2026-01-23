import { Calendar, MapPin, Users } from 'lucide-react'
import { format } from 'date-fns'

interface Event {
 id: string
 title: string
 type: 'conference' | 'meeting' | 'workshop' | 'visit'
 date: Date
 location: string
 participants: number
 priority: 'high' | 'medium' | 'low'
}

export function UpcomingEvents() {
 const events: Event[] = [
 {
 id: '1',
 title: 'UN Statistical Commission',
 type: 'conference',
 date: new Date('2025-02-15'),
 location: 'New York, USA',
 participants: 150,
 priority: 'high',
 },
 {
 id: '2',
 title: 'GCC Statistics Meeting',
 type: 'meeting',
 date: new Date('2025-02-20'),
 location: 'Riyadh, Saudi Arabia',
 participants: 25,
 priority: 'high',
 },
 {
 id: '3',
 title: 'Data Innovation Workshop',
 type: 'workshop',
 date: new Date('2025-03-05'),
 location: 'Dubai, UAE',
 participants: 40,
 priority: 'medium',
 },
 {
 id: '4',
 title: 'OECD Delegation Visit',
 type: 'visit',
 date: new Date('2025-03-10'),
 location: 'Riyadh, Saudi Arabia',
 participants: 12,
 priority: 'medium',
 },
 ]

 const getPriorityColor = (priority: Event['priority']) => {
 switch (priority) {
 case 'high':
 return 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
 case 'medium':
 return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400'
 case 'low':
 return 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
 }
 }

 const getTypeIcon = (type: Event['type']) => {
 switch (type) {
 case 'conference':
 return '🎯'
 case 'meeting':
 return '🤝'
 case 'workshop':
 return '💡'
 case 'visit':
 return '✈️'
 }
 }

 return (
 <div className="space-y-3">
 {events.map((event) => (
 <div
 key={event.id}
 className="rounded-lg border border-gray-200 p-3 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700/50"
 >
 <div className="flex items-start gap-3">
 <span className="text-2xl" role="img" aria-label={event.type}>
 {getTypeIcon(event.type)}
 </span>
 <div className="flex-1">
 <h4 className="font-medium text-gray-900 dark:text-white">
 {event.title}
 </h4>
 <div className="mt-1 flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
 <Calendar className="size-3" />
 <span>{format(event.date, 'MMM dd, yyyy')}</span>
 </div>
 <div className="mt-1 flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
 <MapPin className="size-3" />
 <span>{event.location}</span>
 </div>
 <div className="mt-2 flex items-center gap-2">
 <span
 className={`rounded-full px-2 py-0.5 text-xs ${getPriorityColor(
 event.priority
 )}`}
 >
 {event.priority}
 </span>
 <div className="flex items-center gap-1 text-xs text-gray-500">
 <Users className="size-3" />
 <span>{event.participants}</span>
 </div>
 </div>
 </div>
 </div>
 </div>
 ))}
 </div>
 )
}