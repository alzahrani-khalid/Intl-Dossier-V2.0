/**
 * ReschedulingSuggestions Component
 * Feature: event-conflict-resolution
 *
 * Displays AI-generated rescheduling suggestions with scoring
 * Mobile-first, RTL-compatible design
 */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles,
  Calendar,
  Clock,
  CheckCircle2,
  Users,
  MapPin,
  TrendingUp,
  Car,
  Loader2,
  RefreshCw,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { cn } from '@/lib/utils'
import type {
  ReschedulingSuggestion,
  ReschedulingSuggestionResponse,
} from '@/types/calendar-conflict.types'

interface ReschedulingSuggestionsProps {
  suggestions: ReschedulingSuggestion[] | ReschedulingSuggestionResponse['suggestions']
  isLoading?: boolean
  onAccept?: (
    suggestion: ReschedulingSuggestion | ReschedulingSuggestionResponse['suggestions'][0],
  ) => void
  onRefresh?: () => void
  eventId?: string
  className?: string
}

export function ReschedulingSuggestions({
  suggestions,
  isLoading,
  onAccept,
  onRefresh,
  eventId,
  className,
}: ReschedulingSuggestionsProps) {
  const { t, i18n } = useTranslation('calendar')
  const isRTL = i18n.language === 'ar'
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0)

  const formatDateTime = (datetime: string) => {
    const date = new Date(datetime)
    return {
      date: date.toLocaleDateString(isRTL ? 'ar-SA' : 'en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      }),
      time: date.toLocaleTimeString(isRTL ? 'ar-SA' : 'en-US', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600 dark:text-green-400'
    if (score >= 0.6) return 'text-yellow-600 dark:text-yellow-400'
    return 'text-red-600 dark:text-red-400'
  }

  const getScoreBg = (score: number) => {
    if (score >= 0.8) return 'bg-green-100 dark:bg-green-900/30'
    if (score >= 0.6) return 'bg-yellow-100 dark:bg-yellow-900/30'
    return 'bg-red-100 dark:bg-red-900/30'
  }

  if (isLoading) {
    return (
      <Card className={cn('overflow-hidden', className)} dir={isRTL ? 'rtl' : 'ltr'}>
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center gap-3 py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">{t('suggestions.generating')}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!suggestions || suggestions.length === 0) {
    return (
      <Card className={cn('overflow-hidden', className)} dir={isRTL ? 'rtl' : 'ltr'}>
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center gap-3 py-8 text-center">
            <Calendar className="h-12 w-12 text-muted-foreground/50" />
            <div>
              <p className="text-sm font-medium">{t('suggestions.noSuggestions')}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {t('suggestions.noSuggestionsDesc')}
              </p>
            </div>
            {onRefresh && (
              <Button variant="outline" size="sm" onClick={onRefresh} className="mt-2">
                <RefreshCw className={cn('h-4 w-4', isRTL ? 'ms-2' : 'me-2')} />
                {t('suggestions.retry')}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn('overflow-hidden', className)} dir={isRTL ? 'rtl' : 'ltr'}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Sparkles className="h-5 w-5 text-primary" />
            {t('suggestions.title')}
          </CardTitle>
          {onRefresh && (
            <Button variant="ghost" size="icon" onClick={onRefresh} className="h-8 w-8">
              <RefreshCw className="h-4 w-4" />
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          {t('suggestions.subtitle', { count: suggestions.length })}
        </p>
      </CardHeader>

      <CardContent className="p-0">
        <div className="divide-y">
          <AnimatePresence initial={false}>
            {suggestions.map((suggestion, index) => {
              const start = formatDateTime(suggestion.suggested_start)
              const end = formatDateTime(suggestion.suggested_end)
              const overallScore =
                'overall_score' in suggestion
                  ? suggestion.overall_score
                  : (suggestion.availability_score +
                      suggestion.priority_score +
                      suggestion.travel_feasibility_score) /
                    3
              const isExpanded = expandedIndex === index
              const isAccepted = 'is_accepted' in suggestion && suggestion.is_accepted

              return (
                <motion.div
                  key={'id' in suggestion ? suggestion.id : index}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <Collapsible
                    open={isExpanded}
                    onOpenChange={() => setExpandedIndex(isExpanded ? null : index)}
                  >
                    <div
                      className={cn(
                        'p-3 sm:p-4 transition-colors',
                        isExpanded && 'bg-muted/50',
                        isAccepted && 'bg-green-50 dark:bg-green-900/20',
                      )}
                    >
                      <CollapsibleTrigger asChild>
                        <div className="flex items-start gap-3 cursor-pointer">
                          {/* Rank badge */}
                          <div
                            className={cn(
                              'flex items-center justify-center h-8 w-8 rounded-full text-sm font-bold shrink-0',
                              index === 0
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted text-muted-foreground',
                            )}
                          >
                            {index + 1}
                          </div>

                          {/* Main content */}
                          <div className="flex-1 min-w-0">
                            {/* Date and time */}
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <div className="flex items-center gap-1 text-sm font-medium">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <span>{start.date}</span>
                              </div>
                              <div className="flex items-center gap-1 text-sm">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                <span>
                                  {start.time} - {end.time}
                                </span>
                              </div>
                            </div>

                            {/* Score indicator */}
                            <div className="flex items-center gap-2 mt-2">
                              <Badge
                                variant="secondary"
                                className={cn(
                                  'text-xs',
                                  getScoreBg(overallScore),
                                  getScoreColor(overallScore),
                                )}
                              >
                                <TrendingUp className="h-3 w-3 me-1" />
                                {Math.round(overallScore * 100)}% {t('suggestions.match')}
                              </Badge>

                              {index === 0 && (
                                <Badge variant="default" className="text-xs bg-primary">
                                  {t('suggestions.recommended')}
                                </Badge>
                              )}

                              {isAccepted && (
                                <Badge
                                  variant="secondary"
                                  className="text-xs bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                                >
                                  <CheckCircle2 className="h-3 w-3 me-1" />
                                  {t('suggestions.accepted')}
                                </Badge>
                              )}
                            </div>
                          </div>

                          {/* Expand indicator */}
                          <div className="shrink-0">
                            {isExpanded ? (
                              <ChevronUp className="h-5 w-5 text-muted-foreground" />
                            ) : (
                              <ChevronDown className="h-5 w-5 text-muted-foreground" />
                            )}
                          </div>
                        </div>
                      </CollapsibleTrigger>

                      <CollapsibleContent>
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-4 space-y-4 ps-11"
                        >
                          {/* Score breakdown */}
                          <div className="space-y-2">
                            <p className="text-xs font-medium text-muted-foreground">
                              {t('suggestions.scoreBreakdown')}
                            </p>

                            <div className="grid gap-2">
                              {/* Availability score */}
                              <ScoreRow
                                icon={Users}
                                label={t('suggestions.availabilityScore')}
                                score={suggestion.availability_score}
                              />

                              {/* Priority score */}
                              <ScoreRow
                                icon={TrendingUp}
                                label={t('suggestions.priorityScore')}
                                score={suggestion.priority_score}
                              />

                              {/* Travel feasibility */}
                              <ScoreRow
                                icon={Car}
                                label={t('suggestions.travelScore')}
                                score={suggestion.travel_feasibility_score}
                              />
                            </div>
                          </div>

                          {/* Reason */}
                          {(suggestion.reason_en || suggestion.reason_ar) && (
                            <div className="p-3 bg-muted/50 rounded-lg">
                              <p className="text-xs text-muted-foreground">
                                {isRTL
                                  ? suggestion.reason_ar || suggestion.reason_en
                                  : suggestion.reason_en || suggestion.reason_ar}
                              </p>
                            </div>
                          )}

                          {/* Alternative venue */}
                          {(suggestion.alternative_venue_en || suggestion.alternative_venue_ar) && (
                            <div className="flex items-center gap-2 text-sm">
                              <MapPin className="h-4 w-4 text-muted-foreground" />
                              <span>
                                {t('suggestions.alternativeVenue')}:{' '}
                                <span className="font-medium">
                                  {isRTL
                                    ? suggestion.alternative_venue_ar ||
                                      suggestion.alternative_venue_en
                                    : suggestion.alternative_venue_en ||
                                      suggestion.alternative_venue_ar}
                                </span>
                              </span>
                            </div>
                          )}

                          {/* Accept button */}
                          {onAccept && !isAccepted && (
                            <Button
                              className="w-full sm:w-auto"
                              onClick={() => onAccept(suggestion)}
                            >
                              <CheckCircle2 className={cn('h-4 w-4', isRTL ? 'ms-2' : 'me-2')} />
                              {t('suggestions.accept')}
                            </Button>
                          )}
                        </motion.div>
                      </CollapsibleContent>
                    </div>
                  </Collapsible>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      </CardContent>
    </Card>
  )
}

interface ScoreRowProps {
  icon: React.ElementType
  label: string
  score: number
}

function ScoreRow({ icon: Icon, label, score }: ScoreRowProps) {
  const percentage = Math.round(score * 100)

  return (
    <div className="flex items-center gap-2">
      <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
      <span className="text-xs text-muted-foreground flex-1 min-w-0 truncate">{label}</span>
      <div className="w-24 shrink-0">
        <Progress value={percentage} className="h-1.5" />
      </div>
      <span className="text-xs font-medium w-10 text-end">{percentage}%</span>
    </div>
  )
}

export default ReschedulingSuggestions
