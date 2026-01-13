import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { ColumnDef } from '@tanstack/react-table'
import {
  Plus,
  Calendar,
  Users,
  MapPin,
  Filter,
  Loader2,
  Search,
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FloatingActionButton, useShowMobileFAB } from '@/components/ui/floating-action-button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { AdvancedDataTable } from '@/components/Table/AdvancedDataTable'
import { ForumDetailsDialog } from '@/components/forums/ForumDetailsDialog'
import { useForums, useCreateForum, useDeleteForum } from '@/hooks/useForums'
import { format } from 'date-fns'
import type { Forum, ForumCreateRequest } from '@/types/forum.types'
import type { DossierStatus } from '@/types/dossier'

export function ForumsPage() {
  const { t, i18n } = useTranslation('forums')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<DossierStatus | 'all'>('all')
  const [selectedForum, setSelectedForum] = useState<Forum | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [page, setPage] = useState(1)
  const isRTL = i18n.language === 'ar'
  const showMobileFAB = useShowMobileFAB()

  // Form state for create dialog
  const [formData, setFormData] = useState<ForumCreateRequest>({
    name_en: '',
    name_ar: '',
    description_en: '',
    description_ar: '',
  })

  // Fetch forums using new hook with extension data
  const { data, isLoading, error } = useForums({
    search: searchTerm || undefined,
    status: filterStatus !== 'all' ? filterStatus : undefined,
    page,
    limit: 20,
  })

  const createMutation = useCreateForum()
  const deleteMutation = useDeleteForum()

  // Get forums from response
  const forums = data?.data || []
  const pagination = data?.pagination

  // Compute active forums count
  const activeForumsCount = useMemo(() => {
    return forums.filter((f) => f.status === 'active').length
  }, [forums])

  // Handlers
  const handleCreateForum = async () => {
    if (!formData.name_en || !formData.name_ar) return
    await createMutation.mutateAsync(formData)
    setCreateDialogOpen(false)
    setFormData({ name_en: '', name_ar: '', description_en: '', description_ar: '' })
  }

  const handleDeleteForum = async () => {
    if (!selectedForum) return
    await deleteMutation.mutateAsync(selectedForum.id)
    setDeleteDialogOpen(false)
    setSelectedForum(null)
  }

  const openDeleteDialog = (forum: Forum) => {
    setSelectedForum(forum)
    setDeleteDialogOpen(true)
  }

  const columns: ColumnDef<Forum>[] = [
    {
      accessorKey: 'name_en',
      header: t('table.name'),
      cell: ({ row }) => (
        <div className={`font-medium ${isRTL ? 'text-end' : 'text-start'}`}>
          <div>{isRTL ? row.original.name_ar : row.original.name_en}</div>
          {row.original.description_en && (
            <div className="text-xs text-muted-foreground mt-1 line-clamp-1">
              {isRTL ? row.original.description_ar : row.original.description_en}
            </div>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'created_at',
      header: t('table.created'),
      cell: ({ row }) => {
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
      },
    },
    {
      accessorKey: 'extension.number_of_sessions',
      header: t('table.sessions'),
      cell: ({ row }) => {
        const extension = row.original.extension
        return <span className="text-sm">{extension?.number_of_sessions || '-'}</span>
      },
    },
    {
      accessorKey: 'status',
      header: t('table.status'),
      cell: ({ row }) => {
        if (!row.original.status) {
          return <span className="text-sm text-muted-foreground">-</span>
        }

        const statusVariant =
          row.original.status === 'active'
            ? 'default'
            : row.original.status === 'inactive'
              ? 'secondary'
              : 'outline'

        return <Badge variant={statusVariant}>{t(`statuses.${row.original.status}`)}</Badge>
      },
    },
    {
      id: 'actions',
      header: t('table.actions'),
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="min-h-11 min-w-11">
              <MoreHorizontal className="size-4" />
              <span className="sr-only">{t('table.actions')}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align={isRTL ? 'start' : 'end'}>
            <DropdownMenuItem
              onClick={() => {
                setSelectedForum(row.original)
                setDialogOpen(true)
              }}
            >
              <Eye className="size-4 me-2" />
              {t('viewDetails')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => console.log('Edit:', row.original.id)}>
              <Pencil className="size-4 me-2" />
              {t('editForum')}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => openDeleteDialog(row.original)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="size-4 me-2" />
              {t('deleteForum')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]

  const statusOptions = [
    { value: 'all', label: t('allStatuses') },
    { value: 'active', label: t('statuses.active') },
    { value: 'inactive', label: t('statuses.inactive') },
    { value: 'archived', label: t('statuses.archived') },
  ]

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-6">
      {/* Header - Mobile First */}
      <header className="flex flex-col gap-2">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">{t('pageTitle')}</h1>
            <p className="text-sm sm:text-base text-muted-foreground">{t('pageSubtitle')}</p>
          </div>
          {/* Hide button on mobile where FAB is used */}
          <Button
            className="hidden sm:flex sm:w-auto min-h-11"
            onClick={() => setCreateDialogOpen(true)}
          >
            <Plus className="h-4 w-4 me-2" />
            {t('addForum')}
          </Button>
        </div>
      </header>

      {/* Metrics Cards */}
      <section className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold">{t('metrics.totalForums')}</CardTitle>
            <Users className="size-5 text-primary" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{pagination?.total || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold">{t('metrics.activeForums')}</CardTitle>
            <Calendar className="size-5 text-primary" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{activeForumsCount}</p>
          </CardContent>
        </Card>
        <Card className="sm:col-span-2 lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold">{t('sessions')}</CardTitle>
            <Users className="size-5 text-primary" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {forums.reduce((acc, f) => acc + (f.extension?.number_of_sessions || 0), 0)}
            </p>
          </CardContent>
        </Card>
      </section>

      {/* Filters - Mobile First */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute start-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  placeholder={t('searchPlaceholder')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="ps-10 min-h-11"
                />
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              {statusOptions.map((option) => (
                <Button
                  key={option.value}
                  variant={filterStatus === option.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterStatus(option.value as DossierStatus | 'all')}
                  className="min-h-11 text-xs sm:text-sm"
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Forums Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="size-8 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="px-5 py-8 text-center text-sm text-destructive">
              {error.message || 'Error loading forums'}
            </div>
          ) : forums && forums.length > 0 ? (
            <AdvancedDataTable
              data={forums}
              columns={columns}
              searchPlaceholder={t('searchPlaceholder')}
              onRowClick={(forum) => {
                setSelectedForum(forum)
                setDialogOpen(true)
              }}
              enableExport={true}
              exportFileName="forums"
            />
          ) : (
            <div className="px-5 py-12 text-center">
              <Users className="mx-auto size-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-semibold">{t('noForumsFound')}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{t('noForumsDescription')}</p>
              <Button className="mt-6 gap-2" onClick={() => setCreateDialogOpen(true)}>
                <Plus className="size-4" />
                {t('addForum')}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="min-h-11"
          >
            {isRTL ? 'التالي' : 'Previous'}
          </Button>
          <span className="text-sm text-muted-foreground">
            {page} / {pagination.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
            disabled={page === pagination.totalPages}
            className="min-h-11"
          >
            {isRTL ? 'السابق' : 'Next'}
          </Button>
        </div>
      )}

      {/* Forum Details Dialog */}
      <ForumDetailsDialog
        forumId={selectedForum?.id || null}
        forum={selectedForum as any}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />

      {/* Create Forum Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('createDialog.title')}</DialogTitle>
            <DialogDescription>{t('createDialog.description')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name_en">{t('form.nameEn')}</Label>
              <Input
                id="name_en"
                value={formData.name_en}
                onChange={(e) => setFormData((prev) => ({ ...prev, name_en: e.target.value }))}
                placeholder="e.g., UN Statistical Commission"
                className="min-h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name_ar">{t('form.nameAr')}</Label>
              <Input
                id="name_ar"
                value={formData.name_ar}
                onChange={(e) => setFormData((prev) => ({ ...prev, name_ar: e.target.value }))}
                placeholder="مثال: لجنة الأمم المتحدة الإحصائية"
                dir="rtl"
                className="min-h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description_en">{t('form.descriptionEn')}</Label>
              <Textarea
                id="description_en"
                value={formData.description_en}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, description_en: e.target.value }))
                }
                placeholder="Enter forum description..."
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description_ar">{t('form.descriptionAr')}</Label>
              <Textarea
                id="description_ar"
                value={formData.description_ar}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, description_ar: e.target.value }))
                }
                placeholder="أدخل وصف المنتدى..."
                dir="rtl"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter thumbZone>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              {t('form.cancel')}
            </Button>
            <Button
              onClick={handleCreateForum}
              disabled={!formData.name_en || !formData.name_ar || createMutation.isPending}
            >
              {createMutation.isPending && <Loader2 className="size-4 me-2 animate-spin" />}
              {t('form.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('deleteDialog.title')}</AlertDialogTitle>
            <AlertDialogDescription>{t('deleteDialog.description')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel className="min-h-11">{t('deleteDialog.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteForum}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 min-h-11"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending && <Loader2 className="size-4 me-2 animate-spin" />}
              {t('deleteDialog.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Mobile FAB for thumb-zone accessibility */}
      <FloatingActionButton
        icon={Plus}
        label={t('addForum')}
        labelDisplay="hover"
        onClick={() => setCreateDialogOpen(true)}
        visible={showMobileFAB}
        hideOnScroll={true}
        aria-label={t('addForum')}
      />
    </div>
  )
}
