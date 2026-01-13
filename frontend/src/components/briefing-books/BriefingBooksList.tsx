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
        <div className="flex justify-between items-center">
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
          <XCircle className="h-12 w-12 text-destructive mb-4" />
          <p className="text-destructive font-medium">{t('errors.loadFailed')}</p>
          <Button variant="outline" onClick={() => refresh()} className="mt-4">
            <RefreshCw className="h-4 w-4 me-2" />
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
          <FileText className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">{t('list.empty')}</h3>
          <p className="text-muted-foreground mb-6 max-w-md">{t('list.emptyDescription')}</p>
          {onCreateNew && (
            <Button onClick={onCreateNew} className="min-h-[44px]">
              <Plus className="h-4 w-4 me-2" />
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-xl font-semibold">{t('list.title')}</h2>
        <div className="flex items-center gap-2 w-full sm:w-auto">
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
            <Button onClick={onCreateNew} className="min-h-[44px] shrink-0">
              <Plus className="h-4 w-4 me-2" />
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
            <Card key={book.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  {/* Icon */}
                  <div
                    className={`
                      shrink-0 w-12 h-12 rounded-lg flex items-center justify-center
                      ${statusBgColor}
                    `}
                  >
                    <StatusIcon
                      className={`h-6 w-6 ${statusColor} ${
                        book.status === 'generating' ? 'animate-spin' : ''
                      }`}
                    />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1">
                      <h3 className="font-semibold truncate">
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
                    <div className="flex flex-wrap gap-1 mt-2">
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
                  <div className="flex items-center gap-2 shrink-0">
                    {book.status === 'ready' && book.fileUrl && (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleDownload(book)}
                        className="min-h-[44px] sm:min-h-[36px]"
                      >
                        <Download className="h-4 w-4 me-2" />
                        {t('list.actions.download')}
                      </Button>
                    )}

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="min-h-[44px] min-w-[44px]">
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
                            className="h-4 w-4"
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
                            <Download className="h-4 w-4 me-2" />
                            {t('list.actions.download')}
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem>
                          <Eye className="h-4 w-4 me-2" />
                          {t('list.actions.view')}
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Copy className="h-4 w-4 me-2" />
                          {t('list.actions.duplicate')}
                        </DropdownMenuItem>
                        {(book.status === 'failed' || book.status === 'expired') && (
                          <DropdownMenuItem>
                            <RefreshCw className="h-4 w-4 me-2" />
                            {t('list.actions.regenerate')}
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => setDeleteDialogId(book.id)}
                        >
                          <Trash2 className="h-4 w-4 me-2" />
                          {t('list.actions.delete')}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {/* Error message for failed books */}
                {book.status === 'failed' && book.errorMessage && (
                  <div className="mt-3 p-3 bg-red-50 rounded-lg text-sm text-red-600">
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
        <div className="text-center py-8 text-muted-foreground">
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
          <AlertDialogFooter className="flex-col-reverse sm:flex-row gap-2">
            <AlertDialogCancel disabled={isDeleting}>{t('confirmDelete.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 me-2 animate-spin" />
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
