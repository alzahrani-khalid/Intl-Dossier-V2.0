/**
 * Saved Reports List Component
 *
 * Displays and manages saved reports.
 */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'
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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Search,
  FileText,
  MoreVertical,
  Star,
  StarOff,
  Copy,
  Share2,
  Calendar,
  Download,
  Trash2,
  Edit,
  Eye,
  Lock,
  Users,
  Building2,
  Globe,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import type { SavedReport, ReportAccessLevel } from '@/types/report-builder.types'

interface SavedReportsListProps {
  reports: SavedReport[]
  isLoading: boolean
  selectedReportId?: string | null
  onSelectReport: (report: SavedReport) => void
  onDeleteReport: (reportId: string) => void
  onToggleFavorite: (reportId: string, isFavorite: boolean) => void
  onDuplicateReport?: (report: SavedReport) => void
  onShareReport?: (report: SavedReport) => void
  onScheduleReport?: (report: SavedReport) => void
  onExportReport?: (report: SavedReport) => void
}

const accessLevelIcons: Record<ReportAccessLevel, React.ComponentType<{ className?: string }>> = {
  private: Lock,
  team: Users,
  organization: Building2,
  public: Globe,
}

export function SavedReportsList({
  reports,
  isLoading,
  selectedReportId,
  onSelectReport,
  onDeleteReport,
  onToggleFavorite,
  onDuplicateReport,
  onShareReport,
  onScheduleReport,
  onExportReport,
}: SavedReportsListProps) {
  const { t, i18n } = useTranslation('report-builder')
  const isRTL = i18n.language === 'ar'
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'mine' | 'shared' | 'favorites'>('all')
  const [reportToDelete, setReportToDelete] = useState<string | null>(null)

  // Filter reports
  const filteredReports = reports.filter((report) => {
    // Search filter
    const searchLower = search.toLowerCase()
    const matchesSearch =
      !search ||
      report.name.toLowerCase().includes(searchLower) ||
      report.nameAr?.includes(search) ||
      report.description?.toLowerCase().includes(searchLower) ||
      report.tags?.some((tag) => tag.toLowerCase().includes(searchLower))

    // Tab filter would need user ID context - simplified here
    const matchesFilter = filter === 'all' || (filter === 'favorites' && report.isFavorite)

    return matchesSearch && matchesFilter
  })

  const handleDeleteConfirm = () => {
    if (reportToDelete) {
      onDeleteReport(reportToDelete)
      setReportToDelete(null)
    }
  }

  return (
    <Card dir={isRTL ? 'rtl' : 'ltr'} className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="text-base sm:text-lg flex items-center gap-2">
          <FileText className="h-5 w-5" />
          {t('savedReports.title')}
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          {t('savedReports.description')}
        </CardDescription>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col min-h-0 space-y-4">
        {/* Search */}
        <div className="relative">
          <Search
            className={cn(
              'absolute top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground',
              isRTL ? 'end-3' : 'start-3',
            )}
          />
          <Input
            placeholder={t('savedReports.search')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={cn('h-9', isRTL ? 'pe-9' : 'ps-9')}
          />
        </div>

        {/* Filter Tabs */}
        <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
          <TabsList className="w-full grid grid-cols-4">
            <TabsTrigger value="all" className="text-xs">
              {t('savedReports.filters.all')}
            </TabsTrigger>
            <TabsTrigger value="mine" className="text-xs">
              {t('savedReports.filters.mine')}
            </TabsTrigger>
            <TabsTrigger value="shared" className="text-xs">
              {t('savedReports.filters.shared')}
            </TabsTrigger>
            <TabsTrigger value="favorites" className="text-xs">
              {t('savedReports.filters.favorites')}
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Reports List */}
        <ScrollArea className="flex-1 -mx-2 px-2">
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : filteredReports.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mb-4" />
              <p className="font-medium">{t('savedReports.empty')}</p>
              <p className="text-sm">{t('savedReports.emptyDescription')}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredReports.map((report) => {
                const AccessIcon = accessLevelIcons[report.accessLevel]
                const isSelected = report.id === selectedReportId

                return (
                  <div
                    key={report.id}
                    className={cn(
                      'p-3 rounded-lg border cursor-pointer transition-colors',
                      'hover:border-primary/30 hover:bg-accent/30',
                      isSelected && 'border-primary bg-primary/5',
                    )}
                    onClick={() => onSelectReport(report)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium truncate">
                            {isRTL ? report.nameAr || report.name : report.name}
                          </h4>
                          {report.isFavorite && (
                            <Star className="h-4 w-4 text-yellow-500 fill-yellow-500 flex-shrink-0" />
                          )}
                        </div>

                        {report.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                            {isRTL
                              ? report.descriptionAr || report.description
                              : report.description}
                          </p>
                        )}

                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          <Badge variant="outline" className="text-xs">
                            <AccessIcon className="h-3 w-3 me-1" />
                            {t(`save.accessLevels.${report.accessLevel}`)}
                          </Badge>
                          {report.tags?.slice(0, 2).map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                          {report.tags && report.tags.length > 2 && (
                            <Badge variant="secondary" className="text-xs">
                              +{report.tags.length - 2}
                            </Badge>
                          )}
                        </div>

                        <p className="text-xs text-muted-foreground mt-2">
                          {format(new Date(report.updatedAt), 'PPp')}
                        </p>
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 flex-shrink-0"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align={isRTL ? 'start' : 'end'}>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation()
                              onSelectReport(report)
                            }}
                          >
                            <Eye className="h-4 w-4 me-2" />
                            {t('savedReports.actions.open')}
                          </DropdownMenuItem>

                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation()
                              onToggleFavorite(report.id, !report.isFavorite)
                            }}
                          >
                            {report.isFavorite ? (
                              <>
                                <StarOff className="h-4 w-4 me-2" />
                                {t('savedReports.actions.unfavorite')}
                              </>
                            ) : (
                              <>
                                <Star className="h-4 w-4 me-2" />
                                {t('savedReports.actions.favorite')}
                              </>
                            )}
                          </DropdownMenuItem>

                          {onDuplicateReport && (
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation()
                                onDuplicateReport(report)
                              }}
                            >
                              <Copy className="h-4 w-4 me-2" />
                              {t('savedReports.actions.duplicate')}
                            </DropdownMenuItem>
                          )}

                          {onShareReport && (
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation()
                                onShareReport(report)
                              }}
                            >
                              <Share2 className="h-4 w-4 me-2" />
                              {t('savedReports.actions.share')}
                            </DropdownMenuItem>
                          )}

                          {onScheduleReport && (
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation()
                                onScheduleReport(report)
                              }}
                            >
                              <Calendar className="h-4 w-4 me-2" />
                              {t('savedReports.actions.schedule')}
                            </DropdownMenuItem>
                          )}

                          {onExportReport && (
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation()
                                onExportReport(report)
                              }}
                            >
                              <Download className="h-4 w-4 me-2" />
                              {t('savedReports.actions.export')}
                            </DropdownMenuItem>
                          )}

                          <DropdownMenuSeparator />

                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={(e) => {
                              e.stopPropagation()
                              setReportToDelete(report.id)
                            }}
                          >
                            <Trash2 className="h-4 w-4 me-2" />
                            {t('savedReports.actions.delete')}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </ScrollArea>
      </CardContent>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!reportToDelete}
        onOpenChange={(open) => !open && setReportToDelete(null)}
      >
        <AlertDialogContent dir={isRTL ? 'rtl' : 'ltr'}>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('savedReports.confirmDelete.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('savedReports.confirmDelete.description')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel>{t('savedReports.confirmDelete.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDeleteConfirm}
            >
              {t('savedReports.confirmDelete.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}
