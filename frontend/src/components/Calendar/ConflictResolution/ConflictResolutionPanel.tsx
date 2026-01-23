/**
 * ConflictResolutionPanel Component
 * Feature: event-conflict-resolution
 *
 * Displays detected conflicts and provides resolution options
 * Mobile-first, RTL-compatible design
 */

import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import {
  AlertTriangle,
  AlertCircle,
  Info,
  X,
  Clock,
  Users,
  Building2,
  Calendar,
  Package,
  UserCog,
  ChevronRight,
  Sparkles,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import type {
  EventConflict,
  ConflictSeverity,
  ConflictType,
  ConflictCheckResponse,
} from '@/types/calendar-conflict.types'
import { SEVERITY_COLORS } from '@/types/calendar-conflict.types'

interface ConflictResolutionPanelProps {
  conflicts: ConflictCheckResponse | null
  isLoading?: boolean
  onResolve?: (conflictId: string) => void
  onGenerateSuggestions?: (conflictId?: string) => void
  onDismiss?: () => void
  showWarnings?: boolean
  className?: string
}

const CONFLICT_TYPE_ICONS: Record<ConflictType, React.ElementType> = {
  venue: Building2,
  participant: Users,
  organizer: UserCog,
  holiday: Calendar,
  resource: Package,
  travel_time: Clock,
}

const SEVERITY_ICONS: Record<ConflictSeverity, React.ElementType> = {
  critical: AlertTriangle,
  high: AlertTriangle,
  medium: AlertCircle,
  low: Info,
}

export function ConflictResolutionPanel({
  conflicts,
  isLoading,
  onResolve,
  onGenerateSuggestions,
  onDismiss,
  showWarnings = true,
  className,
}: ConflictResolutionPanelProps) {
  const { t, i18n } = useTranslation('calendar')
  const isRTL = i18n.language === 'ar'

  if (isLoading) {
    return (
      <Card className={cn('p-4', className)} dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="flex animate-pulse items-center gap-2">
          <div className="size-5 rounded-full bg-muted" />
          <div className="h-4 w-32 rounded bg-muted" />
        </div>
      </Card>
    )
  }

  if (!conflicts || (!conflicts.has_conflicts && !conflicts.warnings?.length)) {
    return null
  }

  const hasHighSeverity =
    conflicts.severity_summary.critical > 0 || conflicts.severity_summary.high > 0

  return (
    <Card
      className={cn(
        'overflow-hidden border-2 transition-colors',
        hasHighSeverity
          ? 'border-destructive/50 bg-destructive/5'
          : 'border-warning/50 bg-warning/5',
        className,
      )}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b bg-background/50 p-3 sm:p-4">
        <div className="flex items-center gap-2">
          <AlertTriangle
            className={cn(
              'h-5 w-5 shrink-0',
              hasHighSeverity ? 'text-destructive' : 'text-warning',
            )}
          />
          <div>
            <h3 className="text-sm font-semibold sm:text-base">
              {t('conflicts.title', { count: conflicts.total_conflicts })}
            </h3>
            <p className="text-xs text-muted-foreground">{t('conflicts.subtitle')}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Severity summary badges */}
          <div className="hidden items-center gap-1 sm:flex">
            {conflicts.severity_summary.critical > 0 && (
              <Badge variant="destructive" className="text-xs">
                {conflicts.severity_summary.critical} {t('conflicts.severity.critical')}
              </Badge>
            )}
            {conflicts.severity_summary.high > 0 && (
              <Badge className="bg-orange-500 text-xs">
                {conflicts.severity_summary.high} {t('conflicts.severity.high')}
              </Badge>
            )}
          </div>

          {onDismiss && (
            <Button variant="ghost" size="icon" className="size-8" onClick={onDismiss}>
              <X className="size-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Conflicts List */}
      <div className="max-h-[300px] divide-y overflow-y-auto">
        <AnimatePresence>
          {conflicts.conflicts.map((conflict, index) => (
            <ConflictItem
              key={conflict.id || index}
              conflict={conflict}
              onResolve={onResolve}
              onGenerateSuggestions={onGenerateSuggestions}
              isRTL={isRTL}
              t={t}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Warnings */}
      {showWarnings && conflicts.warnings?.length > 0 && (
        <div className="border-t bg-muted/30 p-3 sm:p-4">
          <div className="flex items-start gap-2">
            <Info className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            <div className="min-w-0 flex-1">
              <p className="mb-1 text-xs font-medium text-muted-foreground">
                {t('conflicts.warnings')}
              </p>
              <ul className="space-y-0.5 text-xs text-muted-foreground">
                {conflicts.warnings.map((warning, idx) => (
                  <li key={idx} className="flex items-center gap-1">
                    <span className="size-1 shrink-0 rounded-full bg-muted-foreground" />
                    {warning}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Actions Footer */}
      {onGenerateSuggestions && conflicts.has_conflicts && (
        <div className="border-t bg-background p-3 sm:p-4">
          <Button
            variant="outline"
            size="sm"
            className="w-full sm:w-auto"
            onClick={() => onGenerateSuggestions()}
          >
            <Sparkles className={cn('h-4 w-4', isRTL ? 'ms-2' : 'me-2')} />
            {t('conflicts.generateSuggestions')}
          </Button>
        </div>
      )}
    </Card>
  )
}

interface ConflictItemProps {
  conflict: EventConflict
  onResolve?: (conflictId: string) => void
  onGenerateSuggestions?: (conflictId?: string) => void
  isRTL: boolean
  t: (key: string, options?: any) => string
}

function ConflictItem({ conflict, onResolve, onGenerateSuggestions, isRTL, t }: ConflictItemProps) {
  const TypeIcon = CONFLICT_TYPE_ICONS[conflict.conflict_type] || AlertCircle
  const SeverityIcon = SEVERITY_ICONS[conflict.severity] || Info
  const colors = SEVERITY_COLORS[conflict.severity]

  const formatTime = (datetime: string) => {
    const date = new Date(datetime)
    return date.toLocaleTimeString(isRTL ? 'ar-SA' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatDate = (datetime: string) => {
    const date = new Date(datetime)
    return date.toLocaleDateString(isRTL ? 'ar-SA' : 'en-US', {
      month: 'short',
      day: 'numeric',
    })
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className="p-3 transition-colors hover:bg-muted/50 sm:p-4"
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={cn('p-2 rounded-lg shrink-0', colors.bg, colors.border, 'border')}>
          <TypeIcon className={cn('h-4 w-4', colors.text)} />
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <Badge
              variant="outline"
              className={cn('text-xs', colors.bg, colors.text, colors.border)}
            >
              <SeverityIcon className="me-1 size-3" />
              {t(`conflicts.severity.${conflict.severity}`)}
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {t(`conflicts.types.${conflict.conflict_type}`)}
            </Badge>
          </div>

          <p className="mb-1 line-clamp-2 text-sm font-medium text-foreground">
            {isRTL ? conflict.message_ar || conflict.message_en : conflict.message_en}
          </p>

          {/* Overlap details */}
          {conflict.overlap_start && conflict.overlap_end && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="size-3" />
              <span>
                {formatDate(conflict.overlap_start)} {formatTime(conflict.overlap_start)} -{' '}
                {formatTime(conflict.overlap_end)}
              </span>
              {conflict.overlap_minutes && (
                <span className="text-xs">
                  ({conflict.overlap_minutes} {t('conflicts.minutes')})
                </span>
              )}
            </div>
          )}

          {/* Conflicting event */}
          {conflict.conflicting_event && (
            <div className="mt-2 rounded bg-muted/50 p-2 text-xs">
              <p className="font-medium">
                {isRTL
                  ? conflict.conflicting_event.title_ar || conflict.conflicting_event.title_en
                  : conflict.conflicting_event.title_en || conflict.conflicting_event.title_ar}
              </p>
              <p className="text-muted-foreground">
                {formatDate(conflict.conflicting_event.start_datetime)}{' '}
                {formatTime(conflict.conflicting_event.start_datetime)} -{' '}
                {formatTime(conflict.conflicting_event.end_datetime)}
              </p>
            </div>
          )}

          {/* Affected participants */}
          {conflict.affected_participant_ids && conflict.affected_participant_ids.length > 0 && (
            <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
              <Users className="size-3" />
              <span>
                {t('conflicts.affectedParticipants', {
                  count: conflict.affected_participant_ids.length,
                })}
              </span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex shrink-0 flex-col gap-1">
          <TooltipProvider>
            {onGenerateSuggestions && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8"
                    onClick={() => onGenerateSuggestions(conflict.id)}
                  >
                    <Sparkles className="size-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{t('conflicts.getSuggestions')}</TooltipContent>
              </Tooltip>
            )}

            {onResolve && conflict.id && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8"
                    onClick={() => onResolve(conflict.id!)}
                  >
                    <ChevronRight className={cn('h-4 w-4', isRTL && 'rotate-180')} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{t('conflicts.resolve')}</TooltipContent>
              </Tooltip>
            )}
          </TooltipProvider>
        </div>
      </div>
    </motion.div>
  )
}

export default ConflictResolutionPanel
