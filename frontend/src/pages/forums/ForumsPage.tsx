import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { ColumnDef } from '@tanstack/react-table'
import { Plus, Calendar, Users, MapPin, Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { AdvancedDataTable } from '@/components/Table/AdvancedDataTable'
import { ForumDetailsDialog } from '@/components/forums/ForumDetailsDialog'
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
  const { t, i18n } = useTranslation('forums')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [selectedForum, setSelectedForum] = useState<Forum | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
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

  const columns: ColumnDef<Forum>[] = [
    {
      accessorKey: 'title_en',
      header: t('title'),
      cell: ({ row }) => (
        <div className={`font-medium ${isRTL ? 'text-end' : 'text-start'}`}>
          {isRTL ? row.original.title_ar : row.original.title_en}
        </div>
      )
    },
    {
      accessorKey: 'start_datetime',
      header: t('dates'),
      cell: ({ row }) => {
        const startDate = row.original.start_datetime ? new Date(row.original.start_datetime) : null
        const isValidDate = startDate && !isNaN(startDate.getTime())

        return (
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">
              {isValidDate ? format(startDate, 'dd MMM yyyy') : '-'}
            </span>
          </div>
        )
      }
    },
    {
      accessorKey: 'location_en',
      header: t('location'),
      cell: ({ row }) => {
        const location = isRTL ? row.original.location_ar : row.original.location_en
        return (
          <div className="flex items-center gap-1">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">
              {location || '-'}
            </span>
          </div>
        )
      }
    },
    {
      accessorKey: 'venue_en',
      header: t('venue'),
      cell: ({ row }) => {
        const venue = isRTL ? row.original.venue_ar : row.original.venue_en
        return (
          <span className="text-sm">
            {row.original.is_virtual
              ? t('virtual')
              : (venue || '-')}
          </span>
        )
      }
    },
    {
      accessorKey: 'max_participants',
      header: t('participants'),
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">{row.original.max_participants || '-'}</span>
        </div>
      )
    },
    {
      accessorKey: 'number_of_sessions',
      header: t('sessions'),
      cell: ({ row }) => (
        <span className="text-sm">{row.original.number_of_sessions}</span>
      )
    },
    {
      accessorKey: 'status',
      header: t('status'),
      cell: ({ row }) => {
        if (!row.original.status) {
          return <span className="text-sm text-muted-foreground">-</span>
        }

        return (
          <span className={`
            inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
            ${row.original.status === 'scheduled' ? 'bg-blue-100 text-blue-800' : ''}
            ${row.original.status === 'ongoing' ? 'bg-green-100 text-green-800' : ''}
            ${row.original.status === 'completed' ? 'bg-gray-100 text-gray-800' : ''}
            ${row.original.status === 'cancelled' ? 'bg-red-100 text-red-800' : ''}
          `}>
            {t(`statuses.${row.original.status}`)}
          </span>
        )
      }
    }
  ]

  const statusOptions = [
    { value: 'all', label: t('common:all') },
    { value: 'scheduled', label: t('statuses.scheduled') },
    { value: 'ongoing', label: t('statuses.ongoing') },
    { value: 'completed', label: t('statuses.completed') },
    { value: 'cancelled', label: t('statuses.cancelled') }
  ]

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
      {/* Header - Mobile First */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold">{t('common:navigation.forums')}</h1>
        <Button className="w-full sm:w-auto min-h-[44px] sm:min-h-0">
          <Plus className="h-4 w-4 me-2" />
          {t('addForum')}
        </Button>
      </div>

      {/* Filters - Mobile First */}
      <Card className="mb-4 sm:mb-6">
        <CardHeader className="pb-3 sm:pb-6">
          <CardTitle className="text-base sm:text-lg">{t('common:filter')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 sm:space-y-4">
          <Input
            placeholder={t('common:search')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm:max-w-sm"
          />
          <div className="flex flex-wrap items-center gap-2">
            <Filter className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground flex-shrink-0" />
            {statusOptions.map(option => (
              <Button
                key={option.value}
                variant={filterStatus === option.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterStatus(option.value)}
                className="min-h-[36px] text-xs sm:text-sm"
              >
                {option.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center">{t('common:loading')}</div>
          ) : forums && forums.length > 0 ? (
            <AdvancedDataTable
              data={forums}
              columns={columns}
              searchPlaceholder={t('common:searchAll')}
              onRowClick={(forum) => {
                setSelectedForum(forum)
                setDialogOpen(true)
              }}
              enableExport={true}
              exportFileName="forums"
            />
          ) : (
            <div className="p-8 text-center text-muted-foreground">
              {t('common:noData')}
            </div>
          )}
        </CardContent>
      </Card>

      <ForumDetailsDialog
        forumId={selectedForum?.id || null}
        forum={selectedForum}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  )
}
