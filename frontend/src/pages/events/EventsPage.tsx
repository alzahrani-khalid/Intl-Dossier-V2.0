import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { Plus, Calendar as CalendarIcon, MapPin, Users, Video, List, Building2, Flag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { supabase } from '@/lib/supabase'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay } from 'date-fns'

interface Event {
  id: string
  title_en: string
  title_ar: string
  type: string
  start_datetime: string
  end_datetime: string
  location_en: string
  location_ar: string
  venue_en: string
  venue_ar: string
  is_virtual: boolean
  virtual_link: string | null
  max_participants: number | null
  status: string
  organizer?: { name_en: string; name_ar: string }
  organizer_id?: string
  organizer_name_en?: string
  organizer_name_ar?: string
  country_id?: string
  country_name_en?: string
  country_name_ar?: string
}

export function EventsPage() {
  const { t, i18n } = useTranslation()
  const [searchTerm, setSearchTerm] = useState('')
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar')
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [filterType, setFilterType] = useState<string>('all')
  const isRTL = i18n.language === 'ar'

  const { data: events, isLoading } = useQuery({
    queryKey: ['events', searchTerm, filterType, selectedDate],
    queryFn: async () => {
      let query = supabase
        .from('event_details')
        .select('*')
        .gte('start_datetime', startOfMonth(selectedDate).toISOString())
        .lte('start_datetime', endOfMonth(selectedDate).toISOString())
        .order('start_datetime', { ascending: true })

      if (searchTerm) {
        query = query.or(`title_en.ilike.%${searchTerm}%,title_ar.ilike.%${searchTerm}%`)
      }

      if (filterType !== 'all') {
        query = query.eq('type', filterType)
      }

      const { data, error } = await query

      if (error) throw error
      return data as Event[]
    }
  })

  const CalendarView = () => {
    const monthStart = startOfMonth(selectedDate)
    const monthEnd = endOfMonth(selectedDate)
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd })
    
    const getEventsForDay = (date: Date) => {
      return events?.filter(event => 
        isSameDay(new Date(event.start_datetime), date)
      ) || []
    }

    const eventTypeColors = {
      meeting: 'bg-blue-500',
      conference: 'bg-purple-500',
      workshop: 'bg-green-500',
      training: 'bg-yellow-500',
      ceremony: 'bg-pink-500',
      other: 'bg-gray-500'
    }

    return (
      <div className="grid grid-cols-7 gap-1">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="p-2 text-center font-semibold text-sm">
            {t(`calendar.${day.toLowerCase()}`)}
          </div>
        ))}
        {days.map((day, index) => {
          const dayEvents = getEventsForDay(day)
          const isCurrentMonth = isSameMonth(day, selectedDate)
          
          return (
            <Card
              key={index}
              className={`min-h-[100px] p-2 cursor-pointer hover:shadow-md transition-shadow ${
                !isCurrentMonth ? 'opacity-50' : ''
              }`}
              onClick={() => setSelectedDate(day)}
            >
              <div className="font-semibold text-sm mb-1">
                {format(day, 'd')}
              </div>
              <div className="space-y-1">
                {dayEvents.slice(0, 3).map((event, i) => (
                  <div
                    key={i}
                    className={`text-xs p-1 rounded text-white truncate ${
                      eventTypeColors[event.type as keyof typeof eventTypeColors]
                    }`}
                  >
                    {isRTL ? event.title_ar : event.title_en}
                  </div>
                ))}
                {dayEvents.length > 3 && (
                  <div className="text-xs text-muted-foreground">
                    +{dayEvents.length - 3} {t('events.more')}
                  </div>
                )}
              </div>
            </Card>
          )
        })}
      </div>
    )
  }

  const ListView = () => {
    const columns = [
      {
        key: 'title',
        header: t('events.eventName'),
        cell: (event: Event) => (
          <div className={`font-medium ${isRTL ? 'text-end' : 'text-start'}`}>
            {isRTL ? event.title_ar : event.title_en}
          </div>
        )
      },
      {
        key: 'type',
        header: t('events.eventType'),
        cell: (event: Event) => (
          <span className={`
            inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
            ${event.type === 'meeting' ? 'bg-blue-100 text-blue-800' : ''}
            ${event.type === 'conference' ? 'bg-purple-100 text-purple-800' : ''}
            ${event.type === 'workshop' ? 'bg-green-100 text-green-800' : ''}
            ${event.type === 'training' ? 'bg-yellow-100 text-yellow-800' : ''}
            ${event.type === 'ceremony' ? 'bg-pink-100 text-pink-800' : ''}
            ${event.type === 'other' ? 'bg-gray-100 text-gray-800' : ''}
          `}>
            {t(`events.types.${event.type}`)}
          </span>
        )
      },
      {
        key: 'datetime',
        header: t('events.dateTime'),
        cell: (event: Event) => (
          <div className="text-sm">
            <div>{format(new Date(event.start_datetime), 'dd MMM yyyy')}</div>
            <div className="text-muted-foreground">
              {format(new Date(event.start_datetime), 'HH:mm')} - 
              {format(new Date(event.end_datetime), 'HH:mm')}
            </div>
          </div>
        )
      },
      {
        key: 'location',
        header: t('events.location'),
        cell: (event: Event) => (
          <div className="text-sm">
            {event.is_virtual ? (
              <div className="flex items-center gap-1">
                <Video className="h-4 w-4 text-blue-500" />
                <span>{t('events.virtual')}</span>
              </div>
            ) : (
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>{isRTL ? event.location_ar : event.location_en}</span>
              </div>
            )}
          </div>
        )
      },
      {
        key: 'organizer',
        header: t('events.organizer'),
        cell: (event: Event) => (
          <div className="flex items-center gap-1 text-sm">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <span>{isRTL ? (event.organizer_name_ar || '-') : (event.organizer_name_en || '-')}</span>
          </div>
        )
      },
      {
        key: 'country',
        header: t('events.country'),
        cell: (event: Event) => (
          <div className="flex items-center gap-1 text-sm">
            <Flag className="h-4 w-4 text-muted-foreground" />
            <span>{isRTL ? (event.country_name_ar || '-') : (event.country_name_en || '-')}</span>
          </div>
        )
      },
      {
        key: 'participants',
        header: t('events.participants'),
        cell: (event: Event) => (
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">{event.max_participants || '-'}</span>
          </div>
        )
      },
      {
        key: 'status',
        header: t('events.status'),
        cell: (event: Event) => (
          <span className={`
            inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
            ${event.status === 'draft' ? 'bg-gray-100 text-gray-800' : ''}
            ${event.status === 'scheduled' ? 'bg-blue-100 text-blue-800' : ''}
            ${event.status === 'ongoing' ? 'bg-green-100 text-green-800' : ''}
            ${event.status === 'completed' ? 'bg-gray-100 text-gray-800' : ''}
            ${event.status === 'cancelled' ? 'bg-red-100 text-red-800' : ''}
          `}>
            {t(`events.statuses.${event.status}`)}
          </span>
        )
      }
    ]

    return (
      <div className="space-y-4">
        {events?.map(event => (
          <Card key={event.id} className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-4">
              <div className="grid grid-cols-6 gap-4">
                {columns.map(col => (
                  <div key={col.key}>
                    <div className="text-xs text-muted-foreground mb-1">{col.header}</div>
                    {col.cell(event)}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const eventTypes = ['all', 'meeting', 'conference', 'workshop', 'training', 'ceremony', 'other']

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">{t('navigation.calendar')}</h1>
        <div className="flex gap-2">
          <Button
            variant={viewMode === 'calendar' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('calendar')}
          >
            <CalendarIcon className="h-4 w-4 me-2" />
            {t('events.calendarView')}
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            <List className="h-4 w-4 me-2" />
            {t('events.listView')}
          </Button>
          <Button>
            <Plus className="h-4 w-4 me-2" />
            {t('events.addEvent')}
          </Button>
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{t('common.filter')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Input
              placeholder={t('common.search')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
            <div className="flex gap-2">
              {eventTypes.map(type => (
                <Button
                  key={type}
                  variant={filterType === type ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterType(type)}
                >
                  {type === 'all' ? t('common.all') : t(`events.types.${type}`)}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          {isLoading ? (
            <div className="p-8 text-center">{t('common.loading')}</div>
          ) : viewMode === 'calendar' ? (
            <CalendarView />
          ) : (
            <ListView />
          )}
          {!isLoading && (!events || events.length === 0) && (
            <div className="p-8 text-center text-muted-foreground">
              {t('common.noData')}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
