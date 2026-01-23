/**
 * WhatIfScenarioPanel Component
 * Feature: event-conflict-resolution
 *
 * Allows users to create and analyze what-if scenarios for bulk rescheduling
 * Mobile-first, RTL-compatible design
 */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FlaskConical,
  Play,
  Trash2,
  CheckCircle2,
  XCircle,
  ChevronRight,
  Calendar,
  Clock,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  Minus,
  Loader2,
  Plus,
  FileText,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import type {
  WhatIfScenario,
  ProposedChange,
  ScenarioStatus,
} from '@/types/calendar-conflict.types'

interface WhatIfScenarioPanelProps {
  scenarios: WhatIfScenario[]
  isLoading?: boolean
  onCreate?: (scenario: {
    name_en: string
    name_ar?: string
    description_en?: string
    proposed_changes: ProposedChange[]
  }) => void
  onApply?: (scenarioId: string) => void
  onDelete?: (scenarioId: string) => void
  isCreating?: boolean
  isApplying?: boolean
  className?: string
}

const STATUS_CONFIG: Record<
  ScenarioStatus,
  { icon: React.ElementType; color: string; bg: string }
> = {
  draft: { icon: FileText, color: 'text-muted-foreground', bg: 'bg-muted' },
  analyzing: { icon: Loader2, color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/30' },
  ready: { icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-900/30' },
  applied: { icon: CheckCircle2, color: 'text-primary', bg: 'bg-primary/10' },
  discarded: { icon: XCircle, color: 'text-muted-foreground', bg: 'bg-muted' },
}

export function WhatIfScenarioPanel({
  scenarios,
  isLoading,
  onCreate,
  onApply,
  onDelete,
  isCreating,
  isApplying,
  className,
}: WhatIfScenarioPanelProps) {
  const { t, i18n } = useTranslation('calendar')
  const isRTL = i18n.language === 'ar'
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [newScenario, setNewScenario] = useState({
    name_en: '',
    name_ar: '',
    description_en: '',
    proposed_changes: [] as ProposedChange[],
  })

  const handleCreate = () => {
    if (onCreate && newScenario.name_en) {
      onCreate(newScenario)
      setNewScenario({ name_en: '', name_ar: '', description_en: '', proposed_changes: [] })
      setCreateDialogOpen(false)
    }
  }

  const formatDate = (datetime: string) => {
    const date = new Date(datetime)
    return date.toLocaleDateString(isRTL ? 'ar-SA' : 'en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const getImpactIndicator = (scenario: WhatIfScenario) => {
    const diff = scenario.conflicts_before - scenario.conflicts_after
    if (diff > 0) {
      return {
        icon: TrendingDown,
        color: 'text-green-600 dark:text-green-400',
        label: t('scenarios.conflictsReduced', { count: diff }),
      }
    } else if (diff < 0) {
      return {
        icon: TrendingUp,
        color: 'text-red-600 dark:text-red-400',
        label: t('scenarios.conflictsIncreased', { count: Math.abs(diff) }),
      }
    }
    return {
      icon: Minus,
      color: 'text-muted-foreground',
      label: t('scenarios.noChange'),
    }
  }

  return (
    <Card className={cn('overflow-hidden', className)} dir={isRTL ? 'rtl' : 'ltr'}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <FlaskConical className="size-5 text-primary" />
              {t('scenarios.title')}
            </CardTitle>
            <CardDescription className="mt-1">{t('scenarios.description')}</CardDescription>
          </div>

          {onCreate && (
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className={cn('h-4 w-4', isRTL ? 'ms-2' : 'me-2')} />
                  {t('scenarios.create')}
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg" dir={isRTL ? 'rtl' : 'ltr'}>
                <DialogHeader>
                  <DialogTitle>{t('scenarios.createTitle')}</DialogTitle>
                  <DialogDescription>{t('scenarios.createDescription')}</DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="scenario-name-en">{t('scenarios.form.nameEn')}</Label>
                    <Input
                      id="scenario-name-en"
                      value={newScenario.name_en}
                      onChange={(e) => setNewScenario({ ...newScenario, name_en: e.target.value })}
                      placeholder={t('scenarios.form.nameEnPlaceholder')}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="scenario-name-ar">{t('scenarios.form.nameAr')}</Label>
                    <Input
                      id="scenario-name-ar"
                      value={newScenario.name_ar}
                      onChange={(e) => setNewScenario({ ...newScenario, name_ar: e.target.value })}
                      placeholder={t('scenarios.form.nameArPlaceholder')}
                      dir="rtl"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="scenario-description">{t('scenarios.form.description')}</Label>
                    <Textarea
                      id="scenario-description"
                      value={newScenario.description_en}
                      onChange={(e) =>
                        setNewScenario({ ...newScenario, description_en: e.target.value })
                      }
                      placeholder={t('scenarios.form.descriptionPlaceholder')}
                      rows={3}
                    />
                  </div>
                </div>

                <DialogFooter className="flex-col-reverse gap-2 sm:flex-row">
                  <Button
                    variant="outline"
                    onClick={() => setCreateDialogOpen(false)}
                    className="w-full sm:w-auto"
                  >
                    {t('common.cancel')}
                  </Button>
                  <Button
                    onClick={handleCreate}
                    disabled={!newScenario.name_en || isCreating}
                    className="w-full sm:w-auto"
                  >
                    {isCreating ? (
                      <Loader2 className={cn('h-4 w-4 animate-spin', isRTL ? 'ms-2' : 'me-2')} />
                    ) : (
                      <Plus className={cn('h-4 w-4', isRTL ? 'ms-2' : 'me-2')} />
                    )}
                    {t('scenarios.createButton')}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {isLoading ? (
          <div className="flex items-center justify-center p-6">
            <Loader2 className="size-8 animate-spin text-muted-foreground" />
          </div>
        ) : scenarios.length === 0 ? (
          <div className="p-6 text-center">
            <FlaskConical className="mx-auto mb-3 size-12 text-muted-foreground/50" />
            <p className="text-sm font-medium">{t('scenarios.noScenarios')}</p>
            <p className="mt-1 text-xs text-muted-foreground">{t('scenarios.noScenariosDesc')}</p>
          </div>
        ) : (
          <Accordion type="single" collapsible className="divide-y">
            {scenarios.map((scenario) => {
              const statusConfig = STATUS_CONFIG[scenario.status]
              const StatusIcon = statusConfig.icon
              const impact = getImpactIndicator(scenario)
              const ImpactIcon = impact.icon

              return (
                <AccordionItem key={scenario.id} value={scenario.id} className="border-0">
                  <AccordionTrigger className="px-4 py-3 hover:bg-muted/50 hover:no-underline">
                    <div className="flex min-w-0 flex-1 items-center gap-3 text-start">
                      <div className={cn('p-2 rounded-lg', statusConfig.bg)}>
                        <StatusIcon
                          className={cn(
                            'h-4 w-4',
                            statusConfig.color,
                            scenario.status === 'analyzing' && 'animate-spin',
                          )}
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {isRTL ? scenario.name_ar || scenario.name_en : scenario.name_en}
                        </p>
                        <div className="mt-1 flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {scenario.affected_event_ids.length} {t('scenarios.events')}
                          </Badge>
                          <span className={cn('text-xs flex items-center gap-1', impact.color)}>
                            <ImpactIcon className="size-3" />
                            {impact.label}
                          </span>
                        </div>
                      </div>
                    </div>
                  </AccordionTrigger>

                  <AccordionContent className="px-4 pb-4">
                    <div className="space-y-4 ps-11">
                      {/* Description */}
                      {(scenario.description_en || scenario.description_ar) && (
                        <p className="text-sm text-muted-foreground">
                          {isRTL
                            ? scenario.description_ar || scenario.description_en
                            : scenario.description_en || scenario.description_ar}
                        </p>
                      )}

                      {/* Impact summary */}
                      <div className="grid grid-cols-2 gap-4 rounded-lg bg-muted/50 p-3">
                        <div>
                          <p className="text-xs text-muted-foreground">
                            {t('scenarios.conflictsBefore')}
                          </p>
                          <p className="text-lg font-bold">{scenario.conflicts_before}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">
                            {t('scenarios.conflictsAfter')}
                          </p>
                          <p className={cn('text-lg font-bold', impact.color)}>
                            {scenario.conflicts_after}
                          </p>
                        </div>
                      </div>

                      {/* AI Recommendation */}
                      {(scenario.ai_recommendation_en || scenario.ai_recommendation_ar) && (
                        <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
                          <div className="flex items-start gap-2">
                            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-primary" />
                            <div>
                              <p className="mb-1 text-xs font-medium text-primary">
                                {t('scenarios.aiRecommendation')}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {isRTL
                                  ? scenario.ai_recommendation_ar || scenario.ai_recommendation_en
                                  : scenario.ai_recommendation_en || scenario.ai_recommendation_ar}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Proposed changes preview */}
                      {scenario.proposed_changes.length > 0 && (
                        <div>
                          <p className="mb-2 text-xs font-medium text-muted-foreground">
                            {t('scenarios.proposedChanges')}
                          </p>
                          <div className="max-h-32 space-y-2 overflow-y-auto">
                            {scenario.proposed_changes.slice(0, 3).map((change, idx) => (
                              <div
                                key={idx}
                                className="flex items-center gap-2 rounded bg-muted/30 p-2 text-xs"
                              >
                                <Calendar className="size-3 text-muted-foreground" />
                                <span className="flex-1 truncate">
                                  {change.original_start && change.new_start
                                    ? `${formatDate(change.original_start)} → ${formatDate(change.new_start)}`
                                    : change.event_id}
                                </span>
                              </div>
                            ))}
                            {scenario.proposed_changes.length > 3 && (
                              <p className="text-xs text-muted-foreground">
                                +{scenario.proposed_changes.length - 3} {t('scenarios.moreChanges')}
                              </p>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Metadata */}
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="size-3" />
                          {formatDate(scenario.created_at)}
                        </span>
                        {scenario.analyzed_at && (
                          <span>
                            {t('scenarios.analyzedAt')} {formatDate(scenario.analyzed_at)}
                          </span>
                        )}
                      </div>

                      <Separator />

                      {/* Actions */}
                      <div className="flex flex-wrap items-center gap-2">
                        {scenario.status === 'ready' && onApply && (
                          <Button
                            size="sm"
                            onClick={() => onApply(scenario.id)}
                            disabled={isApplying}
                          >
                            {isApplying ? (
                              <Loader2
                                className={cn('h-4 w-4 animate-spin', isRTL ? 'ms-2' : 'me-2')}
                              />
                            ) : (
                              <Play className={cn('h-4 w-4', isRTL ? 'ms-2' : 'me-2')} />
                            )}
                            {t('scenarios.apply')}
                          </Button>
                        )}

                        {scenario.status === 'applied' && (
                          <Badge
                            variant="secondary"
                            className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                          >
                            <CheckCircle2 className="me-1 size-3" />
                            {t('scenarios.applied')}
                            {scenario.applied_at && ` - ${formatDate(scenario.applied_at)}`}
                          </Badge>
                        )}

                        {onDelete && scenario.status !== 'applied' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onDelete(scenario.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className={cn('h-4 w-4', isRTL ? 'ms-2' : 'me-2')} />
                            {t('scenarios.delete')}
                          </Button>
                        )}
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )
            })}
          </Accordion>
        )}
      </CardContent>
    </Card>
  )
}

export default WhatIfScenarioPanel
