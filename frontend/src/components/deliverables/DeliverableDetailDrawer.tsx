/**
 * DeliverableDetailDrawer Component
 * Feature: commitment-deliverables
 *
 * Shows detailed view of a deliverable with milestones, history, and documents.
 * Mobile-first, RTL-aware design.
 */

import { useTranslation } from 'react-i18next'
import { format } from 'date-fns'
import { ar, enUS } from 'date-fns/locale'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Calendar,
  User,
  Building2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText,
  History,
  Edit,
  Target,
} from 'lucide-react'
import { cn } from '@/lib/utils'

import {
  useDeliverable,
  useDeliverableStatusHistory,
  useDeliverableDocuments,
} from '@/hooks/useDeliverables'

import {
  DELIVERABLE_STATUS_COLORS,
  DELIVERABLE_PRIORITY_COLORS,
  getHealthScoreColor,
  type DeliverableWithRelations,
} from '@/types/deliverable.types'

interface DeliverableDetailDrawerProps {
  deliverableId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onEdit?: (deliverable: DeliverableWithRelations) => void
}

export function DeliverableDetailDrawer({
  deliverableId,
  open,
  onOpenChange,
  onEdit,
}: DeliverableDetailDrawerProps) {
  const { t, i18n } = useTranslation('deliverables')
  const isRTL = i18n.language === 'ar'
  const dateLocale = isRTL ? ar : enUS

  const { data: deliverable, isLoading } = useDeliverable(deliverableId || '', {
    enabled: !!deliverableId && open,
  })

  const { data: history, isLoading: isLoadingHistory } = useDeliverableStatusHistory(
    deliverableId || '',
  )

  const { data: documents, isLoading: isLoadingDocuments } = useDeliverableDocuments(
    deliverableId || '',
  )

  if (!deliverableId) return null

  const title = deliverable ? (isRTL ? deliverable.title_ar : deliverable.title_en) : ''
  const description = deliverable
    ? isRTL
      ? deliverable.description_ar
      : deliverable.description_en
    : ''

  const statusColors = deliverable
    ? DELIVERABLE_STATUS_COLORS[deliverable.status]
    : DELIVERABLE_STATUS_COLORS.pending
  const priorityColors = deliverable
    ? DELIVERABLE_PRIORITY_COLORS[deliverable.priority]
    : DELIVERABLE_PRIORITY_COLORS.medium
  const healthColors = deliverable
    ? getHealthScoreColor(deliverable.health_score)
    : getHealthScoreColor(null)

  const responsibleName = deliverable
    ? deliverable.responsible_party_type === 'internal'
      ? deliverable.responsible_user?.full_name || t('unassigned')
      : deliverable.responsible_contact_name || t('unassigned')
    : ''

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={isRTL ? 'left' : 'right'}
        className="w-full sm:max-w-lg overflow-y-auto"
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <SheetHeader className="space-y-4">
          <div className="flex items-start justify-between gap-2">
            <SheetTitle className="text-start text-xl leading-tight">
              {isLoading ? <Skeleton className="h-7 w-48" /> : title}
            </SheetTitle>
            {deliverable && onEdit && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onEdit(deliverable)}
                className="shrink-0"
              >
                <Edit className="size-4" />
                <span className="sr-only">{t('actions.edit')}</span>
              </Button>
            )}
          </div>

          {isLoading ? (
            <Skeleton className="h-5 w-32" />
          ) : (
            deliverable && (
              <div className="flex flex-wrap gap-2">
                <Badge
                  variant="outline"
                  className={cn(statusColors.bg, statusColors.text, statusColors.border)}
                >
                  {t(`status.${deliverable.status}`)}
                </Badge>
                <Badge variant="outline" className={cn(priorityColors.bg, priorityColors.text)}>
                  {t(`priority.${deliverable.priority}`)}
                </Badge>
              </div>
            )
          )}
        </SheetHeader>

        {isLoading ? (
          <div className="mt-6 space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : (
          deliverable && (
            <div className="mt-6 space-y-6">
              {/* Description */}
              {description && <p className="text-sm text-muted-foreground">{description}</p>}

              {/* Progress */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{t('progress')}</span>
                  <span className="text-muted-foreground">{deliverable.progress}%</span>
                </div>
                <Progress value={deliverable.progress} className="h-2" />
              </div>

              {/* Health Score */}
              {deliverable.health_score !== null && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{t('healthScore')}</span>
                  <div
                    className={cn(
                      'px-3 py-1 rounded text-sm font-medium',
                      healthColors.bg,
                      healthColors.text,
                    )}
                  >
                    {deliverable.health_score}
                  </div>
                </div>
              )}

              {/* Info Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                {/* Due Date */}
                <div className="flex items-center gap-2">
                  <Calendar className="size-4 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">{t('dueDate')}</p>
                    <p className="font-medium">
                      {format(new Date(deliverable.due_date), 'PP', { locale: dateLocale })}
                    </p>
                  </div>
                </div>

                {/* Responsible Party */}
                <div className="flex items-center gap-2">
                  {deliverable.responsible_party_type === 'internal' ? (
                    <User className="size-4 text-muted-foreground shrink-0" />
                  ) : (
                    <Building2 className="size-4 text-muted-foreground shrink-0" />
                  )}
                  <div>
                    <p className="text-xs text-muted-foreground">{t('responsible')}</p>
                    <p className="font-medium">{responsibleName}</p>
                  </div>
                </div>

                {/* Created */}
                <div className="flex items-center gap-2">
                  <Clock className="size-4 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">{t('created')}</p>
                    <p className="font-medium">
                      {format(new Date(deliverable.created_at), 'PP', { locale: dateLocale })}
                    </p>
                  </div>
                </div>

                {/* Completed */}
                {deliverable.completed_at && (
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-green-600 shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">{t('completed')}</p>
                      <p className="font-medium">
                        {format(new Date(deliverable.completed_at), 'PP', { locale: dateLocale })}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Tabs for Milestones, History, Documents */}
              <Tabs defaultValue="milestones" className="mt-6">
                <TabsList className="w-full grid grid-cols-3">
                  <TabsTrigger value="milestones" className="gap-1">
                    <Target className="size-4" />
                    <span className="hidden sm:inline">{t('milestones.title')}</span>
                  </TabsTrigger>
                  <TabsTrigger value="history" className="gap-1">
                    <History className="size-4" />
                    <span className="hidden sm:inline">{t('history.title')}</span>
                  </TabsTrigger>
                  <TabsTrigger value="documents" className="gap-1">
                    <FileText className="size-4" />
                    <span className="hidden sm:inline">{t('documents.title')}</span>
                  </TabsTrigger>
                </TabsList>

                {/* Milestones Tab */}
                <TabsContent value="milestones" className="mt-4 space-y-2">
                  {deliverable.milestones && deliverable.milestones.length > 0 ? (
                    deliverable.milestones.map((milestone) => (
                      <div
                        key={milestone.id}
                        className={cn(
                          'flex items-center gap-3 p-3 rounded-lg text-sm',
                          milestone.status === 'completed' && 'bg-green-50 dark:bg-green-900/20',
                          milestone.status === 'in_progress' && 'bg-blue-50 dark:bg-blue-900/20',
                          milestone.status === 'pending' && 'bg-gray-50 dark:bg-gray-900/20',
                          milestone.status === 'skipped' &&
                            'bg-gray-50 dark:bg-gray-900/20 opacity-60',
                        )}
                      >
                        {milestone.status === 'completed' ? (
                          <CheckCircle2 className="size-5 text-green-600 shrink-0" />
                        ) : milestone.status === 'in_progress' ? (
                          <Clock className="size-5 text-blue-600 shrink-0" />
                        ) : milestone.status === 'skipped' ? (
                          <AlertTriangle className="size-5 text-gray-400 shrink-0" />
                        ) : (
                          <div className="size-5 rounded-full border-2 border-gray-300 shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">
                            {isRTL ? milestone.title_ar : milestone.title_en}
                          </p>
                          {milestone.due_date && (
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(milestone.due_date), 'PP', { locale: dateLocale })}
                            </p>
                          )}
                        </div>
                        {milestone.weight > 0 && (
                          <Badge variant="outline" className="shrink-0">
                            {milestone.weight}%
                          </Badge>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      {t('milestones.empty')}
                    </p>
                  )}
                </TabsContent>

                {/* History Tab */}
                <TabsContent value="history" className="mt-4 space-y-2">
                  {isLoadingHistory ? (
                    <div className="space-y-2">
                      <Skeleton className="h-12 w-full" />
                      <Skeleton className="h-12 w-full" />
                    </div>
                  ) : history && history.length > 0 ? (
                    history.map((entry) => (
                      <div
                        key={entry.id}
                        className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg text-sm"
                      >
                        <History className="size-4 text-muted-foreground shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium">
                            {entry.old_status
                              ? t('history.statusChanged', {
                                  from: t(`status.${entry.old_status}`),
                                  to: t(`status.${entry.new_status}`),
                                })
                              : t('history.statusSet', { status: t(`status.${entry.new_status}`) })}
                          </p>
                          {entry.notes && (
                            <p className="text-muted-foreground mt-1">{entry.notes}</p>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">
                            {entry.changed_by_name || t('unknown')} -{' '}
                            {format(new Date(entry.changed_at), 'PPp', { locale: dateLocale })}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      {t('history.empty')}
                    </p>
                  )}
                </TabsContent>

                {/* Documents Tab */}
                <TabsContent value="documents" className="mt-4 space-y-2">
                  {isLoadingDocuments ? (
                    <div className="space-y-2">
                      <Skeleton className="h-12 w-full" />
                      <Skeleton className="h-12 w-full" />
                    </div>
                  ) : documents && documents.length > 0 ? (
                    documents.map((doc) => (
                      <a
                        key={doc.id}
                        href={doc.document_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg text-sm hover:bg-muted transition-colors"
                      >
                        <FileText className="size-5 text-muted-foreground shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{doc.document_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {(doc.file_size_bytes / 1024).toFixed(1)} KB -{' '}
                            {format(new Date(doc.uploaded_at), 'PP', { locale: dateLocale })}
                          </p>
                        </div>
                      </a>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      {t('documents.empty')}
                    </p>
                  )}
                </TabsContent>
              </Tabs>

              {/* Notes */}
              {deliverable.notes && (
                <div className="pt-4 border-t">
                  <h4 className="text-sm font-medium mb-2">{t('notes')}</h4>
                  <p className="text-sm text-muted-foreground">{deliverable.notes}</p>
                </div>
              )}

              {/* Completion Notes */}
              {deliverable.completion_notes && (
                <div className="pt-4 border-t">
                  <h4 className="text-sm font-medium mb-2">{t('completionNotes')}</h4>
                  <p className="text-sm text-muted-foreground">{deliverable.completion_notes}</p>
                </div>
              )}
            </div>
          )
        )}
      </SheetContent>
    </Sheet>
  )
}

export default DeliverableDetailDrawer
