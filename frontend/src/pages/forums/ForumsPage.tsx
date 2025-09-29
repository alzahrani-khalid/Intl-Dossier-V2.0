import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { Plus, Calendar, Users, MapPin, Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { DataTable } from '@/components/Table/DataTable'
import { supabase } from '@/lib/supabase'
import { format } from 'date-fns'

interface Forum {
  id: string
  title_en: string
  title_ar: string
  start_datetime: string
  end_datetime: string
  location_en?: string
  location_ar?: string
  venue_en: string
  venue_ar: string
  is_virtual: boolean
  max_participants?: number
  number_of_sessions: number
  status: string
  organizer: {
    name_en: string
    name_ar: string
  }
}

export function ForumsPage() {
  const { t, i18n } = useTranslation()
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const isRTL = i18n.language === 'ar'

  const { data: forums, isLoading } = useQuery({
    queryKey: ['forums', searchTerm, filterStatus],
    queryFn: async () => {
      // Use the forum_details view which aligns to UI shape
      let query = supabase
        .from('forum_details')
        .select('*')
        .order('start_datetime', { ascending: false })

      if (searchTerm) {
        // Search over titles exposed by the view
        query = query.or(
          `title_en.ilike.%${searchTerm}%,title_ar.ilike.%${searchTerm}%`
        )
      }

      if (filterStatus !== 'all') {
        query = query.eq('status', filterStatus)
      }

      const { data, error } = await query
      if (error) throw error
      return data as Forum[]
    }
  })

  const columns = [
    {
      key: 'title',
      header: t('forums.title'),
      cell: (forum: Forum) => (
        <div className={`font-medium ${isRTL ? 'text-right' : 'text-left'}`}>
          {isRTL ? forum.title_ar : forum.title_en}
        </div>
      )
    },
    {
      key: 'dates',
      header: t('forums.dates'),
      cell: (forum: Forum) => (
        <div className="flex items-center gap-1">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">
            {format(new Date(forum.start_datetime), 'dd MMM yyyy')}
          </span>
        </div>
      )
    },
    {
      key: 'location',
      header: t('forums.location'),
      cell: (forum: Forum) => (
        <div className="flex items-center gap-1">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">
            {isRTL ? forum.location_ar : forum.location_en}
          </span>
        </div>
      )
    },
    {
      key: 'venue',
      header: t('forums.venue'),
      cell: (forum: Forum) => (
        <span className="text-sm">
          {forum.is_virtual 
            ? t('forums.virtual') 
            : isRTL ? forum.venue_ar : forum.venue_en}
        </span>
      )
    },
    {
      key: 'participants',
      header: t('forums.participants'),
      cell: (forum: Forum) => (
        <div className="flex items-center gap-1">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">{forum.max_participants || '-'}</span>
        </div>
      )
    },
    {
      key: 'sessions',
      header: t('forums.sessions'),
      cell: (forum: Forum) => (
        <span className="text-sm">{forum.number_of_sessions}</span>
      )
    },
    {
      key: 'status',
      header: t('forums.status'),
      cell: (forum: Forum) => (
        <span className={`
          inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
          ${forum.status === 'scheduled' ? 'bg-blue-100 text-blue-800' : ''}
          ${forum.status === 'ongoing' ? 'bg-green-100 text-green-800' : ''}
          ${forum.status === 'completed' ? 'bg-gray-100 text-gray-800' : ''}
          ${forum.status === 'cancelled' ? 'bg-red-100 text-red-800' : ''}
        `}>
          {t(`forums.statuses.${forum.status}`)}
        </span>
      )
    }
  ]

  const statusOptions = [
    { value: 'all', label: t('common.all') },
    { value: 'scheduled', label: t('forums.statuses.scheduled') },
    { value: 'ongoing', label: t('forums.statuses.ongoing') },
    { value: 'completed', label: t('forums.statuses.completed') },
    { value: 'cancelled', label: t('forums.statuses.cancelled') }
  ]

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">{t('navigation.forums')}</h1>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          {t('forums.addForum')}
        </Button>
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
              <Filter className="h-5 w-5 text-muted-foreground mt-2" />
              {statusOptions.map(option => (
                <Button
                  key={option.value}
                  variant={filterStatus === option.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterStatus(option.value)}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center">{t('common.loading')}</div>
          ) : forums && forums.length > 0 ? (
            <DataTable
              data={forums}
              columns={columns}
              onRowClick={(forum) => console.log('Forum clicked:', forum)}
            />
          ) : (
            <div className="p-8 text-center text-muted-foreground">
              {t('common.noData')}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
