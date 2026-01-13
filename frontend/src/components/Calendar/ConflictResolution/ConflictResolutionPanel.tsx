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
        <div className="flex items-center gap-2 animate-pulse">
          <div className="h-5 w-5 bg-muted rounded-full" />
          <div className="h-4 w-32 bg-muted rounded" />
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
      <div className="flex items-center justify-between p-3 sm:p-4 border-b bg-background/50">
        <div className="flex items-center gap-2">
          <AlertTriangle
            className={cn(
              'h-5 w-5 shrink-0',
              hasHighSeverity ? 'text-destructive' : 'text-warning',
            )}
          />
          <div>
            <h3 className="text-sm sm:text-base font-semibold">
              {t('conflicts.title', { count: conflicts.total_conflicts })}
            </h3>
            <p className="text-xs text-muted-foreground">{t('conflicts.subtitle')}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Severity summary badges */}
          <div className="hidden sm:flex items-center gap-1">
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
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onDismiss}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Conflicts List */}
      <div className="divide-y max-h-[300px] overflow-y-auto">
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
        <div className="p-3 sm:p-4 bg-muted/30 border-t">
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-muted-foreground mb-1">
                {t('conflicts.warnings')}
              </p>
              <ul className="text-xs text-muted-foreground space-y-0.5">
                {conflicts.warnings.map((warning, idx) => (
                  <li key={idx} className="flex items-center gap-1">
                    <span className="h-1 w-1 rounded-full bg-muted-foreground shrink-0" />
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
        <div className="p-3 sm:p-4 bg-background border-t">
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
      className="p-3 sm:p-4 hover:bg-muted/50 transition-colors"
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={cn('p-2 rounded-lg shrink-0', colors.bg, colors.border, 'border')}>
          <TypeIcon className={cn('h-4 w-4', colors.text)} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <Badge
              variant="outline"
              className={cn('text-xs', colors.bg, colors.text, colors.border)}
            >
              <SeverityIcon className="h-3 w-3 me-1" />
              {t(`conflicts.severity.${conflict.severity}`)}
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {t(`conflicts.types.${conflict.conflict_type}`)}
            </Badge>
          </div>

          <p className="text-sm font-medium text-foreground mb-1 line-clamp-2">
            {isRTL ? conflict.message_ar || conflict.message_en : conflict.message_en}
          </p>

          {/* Overlap details */}
          {conflict.overlap_start && conflict.overlap_end && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
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
            <div className="mt-2 p-2 bg-muted/50 rounded text-xs">
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
            <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
              <Users className="h-3 w-3" />
              <span>
                {t('conflicts.affectedParticipants', {
                  count: conflict.affected_participant_ids.length,
                })}
              </span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-1 shrink-0">
          <TooltipProvider>
            {onGenerateSuggestions && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => onGenerateSuggestions(conflict.id)}
                  >
                    <Sparkles className="h-4 w-4" />
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
                    className="h-8 w-8"
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
