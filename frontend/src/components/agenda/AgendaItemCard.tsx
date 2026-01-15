/**
 * AgendaItemCard Component
 * Feature: meeting-agenda-builder
 *
 * Individual agenda item card with:
 * - Drag handle for reordering
 * - Time display (planned vs actual)
 * - Presenter info
 * - Status badges
 * - Meeting controls (start/complete/skip)
 */

import { useTranslation } from 'react-i18next'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  Clock,
  GripVertical,
  Play,
  Check,
  SkipForward,
  User,
  Link,
  FileText,
  Pencil,
  Trash2,
  AlertCircle,
  MessageSquare,
  Presentation,
  CheckCircle,
  Scale,
  ClipboardCheck,
  Coffee,
  Flag,
  MoreHorizontal,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import {
  useStartAgendaItem,
  useCompleteAgendaItem,
  useSkipAgendaItem,
  useDeleteAgendaItem,
} from '@/hooks/useMeetingAgenda'
import type {
  AgendaItem,
  AgendaItemType,
  AgendaItemStatus,
  TimingStatus,
} from '@/types/meeting-agenda.types'
import {
  ITEM_STATUS_COLORS,
  TIMING_STATUS_COLORS,
  ITEM_TYPE_COLORS,
  formatDuration,
} from '@/types/meeting-agenda.types'
import { cn } from '@/lib/utils'

interface AgendaItemCardProps {
  item: AgendaItem
  index: number
  agendaId: string
  expanded: boolean
  canEdit: boolean
  inMeeting: boolean
  calculatedStart?: string
  calculatedEnd?: string
  onEdit: () => void
}

// Map item types to icons
const ITEM_TYPE_ICONS: Record<AgendaItemType, React.ReactNode> = {
  opening: <Play className="h-4 w-4" />,
  approval: <CheckCircle className="h-4 w-4" />,
  discussion: <MessageSquare className="h-4 w-4" />,
  presentation: <Presentation className="h-4 w-4" />,
  decision: <Scale className="h-4 w-4" />,
  action_review: <ClipboardCheck className="h-4 w-4" />,
  break: <Coffee className="h-4 w-4" />,
  closing: <Flag className="h-4 w-4" />,
  other: <MoreHorizontal className="h-4 w-4" />,
}

export function AgendaItemCard({
  item,
  index,
  agendaId,
  expanded,
  canEdit,
  inMeeting,
  calculatedStart,
  calculatedEnd,
  onEdit,
}: AgendaItemCardProps) {
  const { t, i18n } = useTranslation('agenda')
  const isRTL = i18n.language === 'ar'

  // Sortable hook for drag-and-drop
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
    disabled: !canEdit,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  // Mutations
  const startItem = useStartAgendaItem()
  const completeItem = useCompleteAgendaItem()
  const skipItem = useSkipAgendaItem()
  const deleteItem = useDeleteAgendaItem()

  // Get display title
  const title = isRTL ? item.title_ar || item.title_en : item.title_en
  const description = isRTL ? item.description_ar || item.description_en : item.description_en
  const presenterName = isRTL
    ? item.presenter_name_ar || item.presenter_name_en
    : item.presenter_name_en

  // Get status colors
  const statusColors = ITEM_STATUS_COLORS[item.status]
  const timingColors = TIMING_STATUS_COLORS[item.timing_status]
  const typeColors = ITEM_TYPE_COLORS[item.item_type]

  // Check if item is active
  const isActive = item.status === 'in_progress'
  const isCompleted =
    item.status === 'discussed' || item.status === 'skipped' || item.status === 'deferred'

  // Calculate timing variance if actual time exists
  const hasActualTiming = item.actual_start_time && item.actual_duration_minutes
  const varianceMinutes = hasActualTiming
    ? (item.actual_duration_minutes ?? 0) - item.planned_duration_minutes
    : 0

  // Handle actions
  const handleStart = async () => {
    await startItem.mutateAsync({ agendaId, itemId: item.id })
  }

  const handleComplete = async () => {
    await completeItem.mutateAsync({ agendaId, itemId: item.id, input: {} })
  }

  const handleSkip = async () => {
    await skipItem.mutateAsync({ agendaId, itemId: item.id })
  }

  const handleDelete = async () => {
    if (confirm(t('confirmDeleteItem'))) {
      await deleteItem.mutateAsync({ agendaId, itemId: item.id })
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'transition-all',
        isDragging && 'z-50 opacity-80',
        item.indent_level > 0 && `ms-${item.indent_level * 4}`,
      )}
    >
      <Card
        className={cn(
          'relative overflow-hidden transition-colors',
          isActive && 'ring-2 ring-blue-500',
          isCompleted && 'bg-muted/50',
          isDragging && 'shadow-lg',
        )}
      >
        {/* Active indicator */}
        {isActive && <div className="absolute start-0 top-0 h-full w-1 bg-blue-500" />}

        <CardContent className="p-3 sm:p-4">
          <div className="flex items-start gap-2 sm:gap-3">
            {/* Drag handle */}
            {canEdit && (
              <button
                {...attributes}
                {...listeners}
                className={cn(
                  'flex-shrink-0 cursor-grab rounded p-1 text-muted-foreground hover:bg-muted active:cursor-grabbing',
                  'focus:outline-none focus:ring-2 focus:ring-primary',
                  'min-h-8 min-w-8 flex items-center justify-center',
                )}
              >
                <GripVertical className="h-4 w-4" />
              </button>
            )}

            {/* Item number */}
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-muted text-sm font-medium">
              {index + 1}
            </div>

            {/* Content */}
            <div className="min-w-0 flex-1">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                {/* Title and badges */}
                <div className="flex flex-wrap items-center gap-2">
                  {/* Type badge with icon */}
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge
                          variant="outline"
                          className={cn(typeColors.bg, typeColors.text, 'gap-1')}
                        >
                          {ITEM_TYPE_ICONS[item.item_type]}
                          <span className="hidden sm:inline">
                            {t(`itemTypes.${item.item_type}`)}
                          </span>
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>{t(`itemTypes.${item.item_type}`)}</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <h4 className="font-medium leading-tight">{title}</h4>

                  {/* Status badge */}
                  <Badge variant="outline" className={cn(statusColors.bg, statusColors.text)}>
                    {t(`itemStatuses.${item.status}`)}
                  </Badge>
                </div>

                {/* Time info */}
                <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                  {/* Planned time */}
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {calculatedStart && calculatedEnd
                      ? `${calculatedStart} - ${calculatedEnd}`
                      : formatDuration(item.planned_duration_minutes)}
                  </span>

                  {/* Actual timing variance */}
                  {hasActualTiming && (
                    <Badge variant="outline" className={cn(timingColors.bg, timingColors.text)}>
                      {varianceMinutes > 0 ? '+' : ''}
                      {varianceMinutes}m
                    </Badge>
                  )}
                </div>
              </div>

              {/* Expanded content */}
              {expanded && (
                <div className="mt-3 space-y-2">
                  {/* Description */}
                  {description && <p className="text-sm text-muted-foreground">{description}</p>}

                  {/* Presenter */}
                  {presenterName && (
                    <div className="flex items-center gap-2 text-sm">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span>{presenterName}</span>
                      {item.presenter_title_en && (
                        <span className="text-muted-foreground">
                          (
                          {isRTL
                            ? item.presenter_title_ar || item.presenter_title_en
                            : item.presenter_title_en}
                          )
                        </span>
                      )}
                    </div>
                  )}

                  {/* Linked entities */}
                  {(item.linked_dossier_id || item.linked_commitment_id) && (
                    <div className="flex items-center gap-2 text-sm">
                      <Link className="h-4 w-4 text-muted-foreground" />
                      <span className="text-primary hover:underline cursor-pointer">
                        {item.linked_dossier_id && t('linkedDossier')}
                        {item.linked_commitment_id && t('linkedCommitment')}
                      </span>
                    </div>
                  )}

                  {/* Outcome (if completed) */}
                  {(item.status === 'discussed' || item.status === 'deferred') && (
                    <div className="rounded-lg bg-muted/50 p-2">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <FileText className="h-4 w-4" />
                        {t('outcome')}
                      </div>
                      {item.outcome_en && (
                        <p className="mt-1 text-sm text-muted-foreground">
                          {isRTL ? item.outcome_ar || item.outcome_en : item.outcome_en}
                        </p>
                      )}
                      {item.decision_made && (
                        <Badge variant="outline" className="mt-2 bg-amber-100 text-amber-700">
                          {t('decisionMade')}
                        </Badge>
                      )}
                      {item.action_items_created > 0 && (
                        <Badge variant="outline" className="ms-2 mt-2 bg-cyan-100 text-cyan-700">
                          {item.action_items_created} {t('actionItems')}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex flex-shrink-0 items-center gap-1">
              {/* Meeting controls (visible during meeting) */}
              {inMeeting && !isCompleted && (
                <>
                  {!isActive && item.status === 'pending' && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleStart}
                            disabled={startItem.isPending}
                            className="min-h-9 min-w-9 bg-green-50 hover:bg-green-100"
                          >
                            <Play className="h-4 w-4 text-green-600" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>{t('startItem')}</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}

                  {isActive && (
                    <>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleComplete}
                              disabled={completeItem.isPending}
                              className="min-h-9 min-w-9 bg-blue-50 hover:bg-blue-100"
                            >
                              <Check className="h-4 w-4 text-blue-600" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>{t('completeItem')}</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>

                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleSkip}
                              disabled={skipItem.isPending}
                              className="min-h-9 min-w-9"
                            >
                              <SkipForward className="h-4 w-4 text-muted-foreground" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>{t('skipItem')}</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </>
                  )}
                </>
              )}

              {/* Edit/Delete menu (when not in meeting) */}
              {canEdit && !inMeeting && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="min-h-9 min-w-9">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align={isRTL ? 'start' : 'end'}>
                    <DropdownMenuItem onClick={onEdit}>
                      <Pencil className={cn('h-4 w-4', isRTL ? 'ms-2' : 'me-2')} />
                      {t('edit')}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={handleDelete}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className={cn('h-4 w-4', isRTL ? 'ms-2' : 'me-2')} />
                      {t('delete')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              {/* Running over warning */}
              {item.timing_status === 'running_over' && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <AlertCircle className="h-5 w-5 text-red-500" />
                    </TooltipTrigger>
                    <TooltipContent>{t('runningOver')}</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default AgendaItemCard
