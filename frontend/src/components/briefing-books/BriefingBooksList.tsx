/**
 * BriefingBooksList Component
 * Feature: briefing-book-generator
 *
 * Displays the list of user's briefing books with status, download, and delete actions.
 * Mobile-first with RTL support.
 */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  FileText,
  Download,
  Trash2,
  Eye,
  Copy,
  RefreshCw,
  Loader2,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Plus,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ar, enUS } from 'date-fns/locale'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'

import { useBriefingBooks } from '@/hooks/useBriefingBooks'
import type { BriefingBook, BriefingBookStatus } from '@/types/briefing-book.types'

interface BriefingBooksListProps {
  onCreateNew?: () => void
}

// Status icon and color mapping
const statusConfig: Record<
  BriefingBookStatus,
  { icon: typeof CheckCircle; color: string; bgColor: string }
> = {
  draft: { icon: Clock, color: 'text-muted-foreground', bgColor: 'bg-muted' },
  generating: { icon: Loader2, color: 'text-blue-500', bgColor: 'bg-blue-50' },
  ready: { icon: CheckCircle, color: 'text-green-500', bgColor: 'bg-green-50' },
  expired: { icon: AlertTriangle, color: 'text-yellow-500', bgColor: 'bg-yellow-50' },
  failed: { icon: XCircle, color: 'text-red-500', bgColor: 'bg-red-50' },
}

export function BriefingBooksList({ onCreateNew }: BriefingBooksListProps) {
  const { t, i18n } = useTranslation('briefing-books')
  const isRTL = i18n.language === 'ar'

  const { briefingBooks, isLoading, error, deleteBriefingBook, downloadBriefingBook, refresh } =
    useBriefingBooks()

  const [statusFilter, setStatusFilter] = useState<BriefingBookStatus | 'all'>('all')
  const [deleteDialogId, setDeleteDialogId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Filter books by status
  const filteredBooks =
    statusFilter === 'all'
      ? briefingBooks
      : briefingBooks.filter((book) => book.status === statusFilter)

  // Handle delete
  const handleDelete = async () => {
    if (!deleteDialogId) return

    setIsDeleting(true)
    try {
      await deleteBriefingBook(deleteDialogId)
    } finally {
      setIsDeleting(false)
      setDeleteDialogId(null)
    }
  }

  // Handle download
  const handleDownload = async (book: BriefingBook) => {
    if (book.fileUrl) {
      window.open(book.fileUrl, '_blank')
    }
  }

  // Format date
  const formatDate = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), {
      addSuffix: true,
      locale: isRTL ? ar : enUS,
    })
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-4" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <Card className="border-destructive" dir={isRTL ? 'rtl' : 'ltr'}>
        <CardContent className="flex flex-col items-center justify-center py-8 text-center">
          <XCircle className="mb-4 size-12 text-destructive" />
          <p className="font-medium text-destructive">{t('errors.loadFailed')}</p>
          <Button variant="outline" onClick={() => refresh()} className="mt-4">
            <RefreshCw className="me-2 size-4" />
            {t('actions.retry') || 'Retry'}
          </Button>
        </CardContent>
      </Card>
    )
  }

  // Empty state
  if (briefingBooks.length === 0) {
    return (
      <Card dir={isRTL ? 'rtl' : 'ltr'}>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <FileText className="mb-4 size-16 text-muted-foreground" />
          <h3 className="mb-2 text-lg font-semibold">{t('list.empty')}</h3>
          <p className="mb-6 max-w-md text-muted-foreground">{t('list.emptyDescription')}</p>
          {onCreateNew && (
            <Button onClick={onCreateNew} className="min-h-touch-sm">
              <Plus className="me-2 size-4" />
              {t('list.createFirst')}
            </Button>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header with filters */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <h2 className="text-xl font-semibold">{t('list.title')}</h2>
        <div className="flex w-full items-center gap-2 sm:w-auto">
          <Select
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(v as BriefingBookStatus | 'all')}
          >
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder={t('list.filters.all')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('list.filters.all')}</SelectItem>
              <SelectItem value="ready">{t('list.filters.ready')}</SelectItem>
              <SelectItem value="generating">{t('list.filters.generating')}</SelectItem>
              <SelectItem value="failed">{t('list.filters.failed')}</SelectItem>
            </SelectContent>
          </Select>
          {onCreateNew && (
            <Button onClick={onCreateNew} className="min-h-touch-sm shrink-0">
              <Plus className="me-2 size-4" />
              <span className="hidden sm:inline">{t('newBriefingBook')}</span>
            </Button>
          )}
        </div>
      </div>

      {/* Books list */}
      <div className="space-y-3">
        {filteredBooks.map((book) => {
          const StatusIcon = statusConfig[book.status].icon
          const statusColor = statusConfig[book.status].color
          const statusBgColor = statusConfig[book.status].bgColor

          return (
            <Card key={book.id} className="transition-shadow hover:shadow-md">
              <CardContent className="p-4">
                <div className="flex flex-col gap-4 sm:flex-row">
                  {/* Icon */}
                  <div
                    className={`
                      flex size-12 shrink-0 items-center justify-center rounded-lg
                      ${statusBgColor}
                    `}
                  >
                    <StatusIcon
                      className={`size-6 ${statusColor} ${
                        book.status === 'generating' ? 'animate-spin' : ''
                      }`}
                    />
                  </div>

                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex flex-col gap-2 sm:flex-row sm:items-center">
                      <h3 className="truncate font-semibold">
                        {isRTL ? book.config.title_ar : book.config.title_en}
                      </h3>
                      <Badge
                        variant={book.status === 'ready' ? 'default' : 'secondary'}
                        className="w-fit"
                      >
                        {t(`list.status.${book.status}`)}
                      </Badge>
                    </div>

                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                      <span>
                        {book.config.entities.length} {t('list.columns.entities').toLowerCase()}
                      </span>
                      <span className="uppercase">{book.config.format}</span>
                      <span>{formatDate(book.createdAt)}</span>
                      {book.pageCount && <span>{book.pageCount} pages</span>}
                    </div>

                    {/* Entity badges */}
                    <div className="mt-2 flex flex-wrap gap-1">
                      {book.config.entities.slice(0, 3).map((entity) => (
                        <Badge key={entity.id} variant="outline" className="text-xs">
                          {isRTL ? entity.name_ar : entity.name_en}
                        </Badge>
                      ))}
                      {book.config.entities.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{book.config.entities.length - 3}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex shrink-0 items-center gap-2">
                    {book.status === 'ready' && book.fileUrl && (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleDownload(book)}
                        className="min-h-touch-sm sm:min-h-[36px]"
                      >
                        <Download className="me-2 size-4" />
                        {t('list.actions.download')}
                      </Button>
                    )}

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="min-h-touch-sm min-w-touch-sm">
                          <span className="sr-only">Actions</span>
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="size-4"
                          >
                            <circle cx="12" cy="12" r="1" />
                            <circle cx="12" cy="5" r="1" />
                            <circle cx="12" cy="19" r="1" />
                          </svg>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align={isRTL ? 'start' : 'end'}>
                        {book.status === 'ready' && book.fileUrl && (
                          <DropdownMenuItem onClick={() => handleDownload(book)}>
                            <Download className="me-2 size-4" />
                            {t('list.actions.download')}
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem>
                          <Eye className="me-2 size-4" />
                          {t('list.actions.view')}
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Copy className="me-2 size-4" />
                          {t('list.actions.duplicate')}
                        </DropdownMenuItem>
                        {(book.status === 'failed' || book.status === 'expired') && (
                          <DropdownMenuItem>
                            <RefreshCw className="me-2 size-4" />
                            {t('list.actions.regenerate')}
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => setDeleteDialogId(book.id)}
                        >
                          <Trash2 className="me-2 size-4" />
                          {t('list.actions.delete')}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {/* Error message for failed books */}
                {book.status === 'failed' && book.errorMessage && (
                  <div className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-600">
                    {book.errorMessage}
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Empty filtered state */}
      {filteredBooks.length === 0 && briefingBooks.length > 0 && (
        <div className="py-8 text-center text-muted-foreground">
          <p>No briefing books match the selected filter.</p>
          <Button variant="link" onClick={() => setStatusFilter('all')}>
            {t('list.filters.all')}
          </Button>
        </div>
      )}

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!deleteDialogId} onOpenChange={() => setDeleteDialogId(null)}>
        <AlertDialogContent dir={isRTL ? 'rtl' : 'ltr'}>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('confirmDelete.title')}</AlertDialogTitle>
            <AlertDialogDescription>{t('confirmDelete.message')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col-reverse gap-2 sm:flex-row">
            <AlertDialogCancel disabled={isDeleting}>{t('confirmDelete.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="me-2 size-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                t('confirmDelete.confirm')
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default BriefingBooksList
