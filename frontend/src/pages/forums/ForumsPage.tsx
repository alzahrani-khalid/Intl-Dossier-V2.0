import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ColumnDef } from '@tanstack/react-table'
import { Plus, Calendar, Users, MapPin, Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { AdvancedDataTable } from '@/components/Table/AdvancedDataTable'
import { ForumDetailsDialog } from '@/components/forums/ForumDetailsDialog'
import { useDossiersByType } from '@/hooks/useDossier'
import { format } from 'date-fns'
import type { DossierWithExtension, ForumExtension } from '@/services/dossier-api'

interface Forum extends DossierWithExtension {
  extension?: ForumExtension
}

export function ForumsPage() {
  const { t, i18n } = useTranslation('forums')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [selectedForum, setSelectedForum] = useState<Forum | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const isRTL = i18n.language === 'ar'

  // Fetch forums from unified dossiers table
  const { data, isLoading } = useDossiersByType('forum', 1, 1000)

  // Filter forums based on search and status
  const forums = (data?.dossiers || []).filter(forum => {
    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      const matchesName =
        forum.name_en?.toLowerCase().includes(searchLower) ||
        forum.name_ar?.toLowerCase().includes(searchLower)
      if (!matchesName) return false
    }

    // Status filter
    if (filterStatus !== 'all' && forum.status !== filterStatus) {
      return false
    }

    return true
  })

  const columns: ColumnDef<Forum>[] = [
    {
      accessorKey: 'name_en',
      header: t('title'),
      cell: ({ row }) => (
        <div className={`font-medium ${isRTL ? 'text-end' : 'text-start'}`}>
          {isRTL ? row.original.name_ar : row.original.name_en}
        </div>
      )
    },
    {
      accessorKey: 'created_at',
      header: t('dates'),
      cell: ({ row }) => {
        const extension = row.original.extension as ForumExtension | undefined
        const createdDate = row.original.created_at ? new Date(row.original.created_at) : null
        const isValidDate = createdDate && !isNaN(createdDate.getTime())

        return (
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">
              {isValidDate ? format(createdDate, 'dd MMM yyyy') : '-'}
            </span>
          </div>
        )
      }
    },
    {
      accessorKey: 'description_en',
      header: t('location'),
      cell: ({ row }) => {
        const description = isRTL ? row.original.description_ar : row.original.description_en
        return (
          <div className="flex items-center gap-1">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm truncate max-w-xs">
              {description || '-'}
            </span>
          </div>
        )
      }
    },
    {
      accessorKey: 'extension',
      header: t('sessions'),
      cell: ({ row }) => {
        const extension = row.original.extension as ForumExtension | undefined
        return (
          <span className="text-sm">{extension?.number_of_sessions || '-'}</span>
        )
      }
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
            ${row.original.status === 'active' ? 'bg-green-100 text-green-800' : ''}
            ${row.original.status === 'inactive' ? 'bg-gray-100 text-gray-800' : ''}
            ${row.original.status === 'archived' ? 'bg-yellow-100 text-yellow-800' : ''}
          `}>
            {row.original.status}
          </span>
        )
      }
    }
  ]

  const statusOptions = [
    { value: 'all', label: t('common:all') },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'archived', label: 'Archived' }
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
