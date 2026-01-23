/**
 * Impact Assessment Panel Component
 * Feature: entity-dependency-impact
 *
 * Shows impact assessment report with affected entities and recommendations
 * Mobile-first, RTL-compatible
 */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle,
  Minus,
  ChevronDown,
  ChevronUp,
  FileText,
  Users,
  Building2,
  Target,
  Clock,
  ExternalLink,
} from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'

import {
  useAssessment,
  useUpdateAssessment,
  useCreateAssessment,
} from '@/hooks/useEntityDependencies'
import type {
  ImpactAssessment,
  AffectedEntity,
  ImpactSeverity,
  ChangeType,
  AssessmentStatus,
} from '@/types/entity-dependency.types'
import {
  SEVERITY_CONFIGS,
  CATEGORY_LABELS,
  CHANGE_TYPE_LABELS,
  ASSESSMENT_STATUS_LABELS,
} from '@/types/entity-dependency.types'
import { cn } from '@/lib/utils'

// ============================================================================
// Types
// ============================================================================

interface ImpactAssessmentPanelProps {
  assessmentId?: string
  entityId?: string
  changeType?: ChangeType
  onComplete?: (assessment: ImpactAssessment) => void
  className?: string
}

// ============================================================================
// Severity Icon Component
// ============================================================================

function SeverityIcon({ severity, className }: { severity: ImpactSeverity; className?: string }) {
  const icons = {
    critical: AlertTriangle,
    high: AlertCircle,
    medium: Info,
    low: CheckCircle,
    none: Minus,
  }
  const Icon = icons[severity]
  return <Icon className={cn('h-4 w-4 sm:h-5 sm:w-5', className)} />
}

// ============================================================================
// Severity Badge Component
// ============================================================================

interface SeverityBadgeProps {
  severity: ImpactSeverity
  size?: 'sm' | 'default'
}

function SeverityBadge({ severity, size = 'default' }: SeverityBadgeProps) {
  const { i18n } = useTranslation()
  const isRTL = i18n.language === 'ar'
  const config = SEVERITY_CONFIGS[severity]

  return (
    <Badge
      variant="outline"
      className={cn(
        config.bgColor,
        config.color,
        size === 'sm' ? 'text-[10px] px-1.5 py-0' : 'text-xs',
      )}
    >
      <SeverityIcon severity={severity} className="me-1 size-3" />
      {isRTL ? config.label.ar : config.label.en}
    </Badge>
  )
}

// ============================================================================
// Affected Entity Card Component
// ============================================================================

interface AffectedEntityCardProps {
  entity: AffectedEntity
  onNavigate?: (entityId: string, entityType: string) => void
}

function AffectedEntityCard({ entity, onNavigate }: AffectedEntityCardProps) {
  const { i18n } = useTranslation('entity-dependencies')
  const isRTL = i18n.language === 'ar'

  return (
    <div
      className={cn(
        'p-3 sm:p-4 border rounded-lg',
        entity.action_required && 'border-orange-300 bg-orange-50/50 dark:bg-orange-900/10',
      )}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="truncate text-sm font-medium sm:text-base">
              {isRTL ? entity.affected_entity_name_ar : entity.affected_entity_name_en}
            </span>
            <Badge variant="secondary" className="text-[10px] capitalize sm:text-xs">
              {entity.affected_entity_type}
            </Badge>
          </div>
          <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
            {isRTL ? entity.impact_description_ar : entity.impact_description_en}
          </p>
        </div>
        <SeverityBadge severity={entity.impact_severity} size="sm" />
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <Badge variant="outline" className="text-[10px] sm:text-xs">
          {isRTL
            ? CATEGORY_LABELS[entity.impact_category]?.ar
            : CATEGORY_LABELS[entity.impact_category]?.en}
        </Badge>
        <span className="text-[10px] text-muted-foreground sm:text-xs">
          {isRTL ? 'العمق:' : 'Depth:'} {entity.depth}
        </span>
      </div>

      {entity.action_required && entity.suggested_action_en && (
        <div className="mt-2 rounded bg-orange-100 p-2 text-xs dark:bg-orange-900/20 sm:text-sm">
          <span className="font-medium">{isRTL ? 'الإجراء المقترح:' : 'Suggested action:'}</span>{' '}
          {isRTL ? entity.suggested_action_ar : entity.suggested_action_en}
        </div>
      )}

      {onNavigate && (
        <Button
          variant="ghost"
          size="sm"
          className="mt-2 h-7 text-xs"
          onClick={() => onNavigate(entity.affected_entity_id, entity.affected_entity_type)}
        >
          <ExternalLink className="me-1 size-3" />
          {isRTL ? 'عرض' : 'View'}
        </Button>
      )}
    </div>
  )
}

// ============================================================================
// Summary Stats Component
// ============================================================================

interface SummaryStatsProps {
  assessment: ImpactAssessment
}

function SummaryStats({ assessment }: SummaryStatsProps) {
  const { t, i18n } = useTranslation('entity-dependencies')
  const isRTL = i18n.language === 'ar'

  const affectedByCategory = assessment.affected_entities?.reduce(
    (acc, entity) => {
      acc[entity.impact_category] = (acc[entity.impact_category] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-4">
      <Card className="p-3 sm:p-4">
        <div className="flex items-center gap-2">
          <Users className="size-4 text-muted-foreground sm:size-5" />
          <div>
            <p className="text-[10px] text-muted-foreground sm:text-xs">
              {t('summary.totalAffected')}
            </p>
            <p className="text-lg font-bold sm:text-xl">{assessment.total_affected_entities}</p>
          </div>
        </div>
      </Card>

      <Card className="p-3 sm:p-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="size-4 text-muted-foreground sm:size-5" />
          <div>
            <p className="text-[10px] text-muted-foreground sm:text-xs">
              {t('summary.actionRequired')}
            </p>
            <p className="text-lg font-bold text-orange-600 sm:text-xl">
              {assessment.affected_entities?.filter((e) => e.action_required).length || 0}
            </p>
          </div>
        </div>
      </Card>

      <Card className="col-span-2 p-3 sm:col-span-1 sm:p-4">
        <div className="flex items-center gap-2">
          <Clock className="size-4 text-muted-foreground sm:size-5" />
          <div>
            <p className="text-[10px] text-muted-foreground sm:text-xs">
              {t('summary.assessedAt')}
            </p>
            <p className="text-sm font-medium sm:text-base">
              {new Date(assessment.assessed_at).toLocaleDateString(isRTL ? 'ar-SA' : 'en-US')}
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}

// ============================================================================
// Main Component
// ============================================================================

export function ImpactAssessmentPanel({
  assessmentId,
  entityId,
  changeType,
  onComplete,
  className,
}: ImpactAssessmentPanelProps) {
  const { t, i18n } = useTranslation('entity-dependencies')
  const isRTL = i18n.language === 'ar'

  const [reviewNotes, setReviewNotes] = useState('')
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false)

  const { data: assessment, isLoading, error } = useAssessment(assessmentId)
  const createAssessment = useCreateAssessment()
  const updateAssessment = useUpdateAssessment()

  // Create new assessment if entityId and changeType provided but no assessmentId
  const handleCreateAssessment = async () => {
    if (!entityId || !changeType) return

    try {
      const result = await createAssessment.mutateAsync({
        entity_id: entityId,
        change_type: changeType,
      })
      onComplete?.(result)
    } catch (err) {
      console.error('Failed to create assessment:', err)
    }
  }

  const handleUpdateStatus = async (status: AssessmentStatus) => {
    if (!assessment) return

    try {
      await updateAssessment.mutateAsync({
        id: assessment.id,
        status,
        review_notes: reviewNotes || undefined,
      })
      setIsReviewDialogOpen(false)
      setReviewNotes('')
    } catch (err) {
      console.error('Failed to update assessment:', err)
    }
  }

  // Show create assessment UI if no assessmentId
  if (!assessmentId && entityId && changeType) {
    return (
      <Card className={cn('w-full', className)} dir={isRTL ? 'rtl' : 'ltr'}>
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">{t('create.title')}</CardTitle>
          <CardDescription>{t('create.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 rounded-lg bg-muted/50 p-4">
            <p className="text-sm">
              <span className="font-medium">{t('create.changeType')}:</span>{' '}
              {isRTL ? CHANGE_TYPE_LABELS[changeType].ar : CHANGE_TYPE_LABELS[changeType].en}
            </p>
          </div>
          <Button
            onClick={handleCreateAssessment}
            disabled={createAssessment.isPending}
            className="w-full sm:w-auto"
          >
            {createAssessment.isPending ? t('create.loading') : t('create.button')}
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (isLoading) {
    return (
      <Card className={cn('w-full animate-pulse', className)}>
        <CardHeader>
          <div className="h-6 w-48 rounded bg-muted" />
          <div className="mt-2 h-4 w-64 rounded bg-muted" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-24 rounded bg-muted" />
            <div className="h-32 rounded bg-muted" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error || !assessment) {
    return (
      <Card className={cn('w-full', className)}>
        <CardContent className="p-6 text-center">
          <AlertCircle className="mx-auto mb-4 size-12 text-destructive" />
          <p className="text-destructive">{t('errors.loadFailed')}</p>
        </CardContent>
      </Card>
    )
  }

  const groupedEntities = assessment.affected_entities?.reduce(
    (acc, entity) => {
      const category = entity.impact_category
      if (!acc[category]) acc[category] = []
      acc[category].push(entity)
      return acc
    },
    {} as Record<string, AffectedEntity[]>,
  )

  return (
    <Card className={cn('w-full', className)} dir={isRTL ? 'rtl' : 'ltr'}>
      <CardHeader className="pb-2 sm:pb-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <FileText className="size-4 sm:size-5" />
              {t('assessment.title')}
            </CardTitle>
            <CardDescription className="mt-1">
              {isRTL ? assessment.change_description_ar : assessment.change_description_en}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <SeverityBadge severity={assessment.overall_severity} />
            <Badge variant="outline">
              {isRTL
                ? ASSESSMENT_STATUS_LABELS[assessment.status].ar
                : ASSESSMENT_STATUS_LABELS[assessment.status].en}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 sm:space-y-6">
        {/* Summary */}
        <div className="rounded-lg bg-muted/50 p-3 sm:p-4">
          <p className="text-sm sm:text-base">
            {isRTL ? assessment.assessment_summary_ar : assessment.assessment_summary_en}
          </p>
        </div>

        {/* Stats */}
        <SummaryStats assessment={assessment} />

        {/* Recommendations */}
        {assessment.recommendations_en?.length > 0 && (
          <div>
            <h3 className="mb-2 text-sm font-medium sm:text-base">
              {t('assessment.recommendations')}
            </h3>
            <ul className="space-y-1.5 sm:space-y-2">
              {(isRTL ? assessment.recommendations_ar : assessment.recommendations_en).map(
                (rec, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-xs sm:text-sm">
                    <CheckCircle className="mt-0.5 size-4 shrink-0 text-green-600" />
                    {rec}
                  </li>
                ),
              )}
            </ul>
          </div>
        )}

        <Separator />

        {/* Affected Entities by Category */}
        {groupedEntities && Object.keys(groupedEntities).length > 0 && (
          <div>
            <h3 className="mb-3 text-sm font-medium sm:text-base">
              {t('assessment.affectedEntities')}
            </h3>
            <Accordion type="multiple" defaultValue={Object.keys(groupedEntities)}>
              {Object.entries(groupedEntities).map(([category, entities]) => (
                <AccordionItem key={category} value={category}>
                  <AccordionTrigger className="text-sm">
                    <div className="flex items-center gap-2">
                      <span>
                        {isRTL
                          ? CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS]?.ar
                          : CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS]?.en}
                      </span>
                      <Badge variant="secondary" className="text-[10px]">
                        {entities.length}
                      </Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <ScrollArea className="max-h-[300px]">
                      <div className="space-y-2">
                        {entities.map((entity) => (
                          <AffectedEntityCard key={entity.id} entity={entity} />
                        ))}
                      </div>
                    </ScrollArea>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        )}

        {/* Action Buttons */}
        {assessment.status === 'pending' && (
          <div className="flex flex-col gap-2 pt-4 sm:flex-row">
            <Dialog open={isReviewDialogOpen} onOpenChange={setIsReviewDialogOpen}>
              <DialogTrigger asChild>
                <Button className="flex-1 sm:flex-none">{t('actions.acknowledge')}</Button>
              </DialogTrigger>
              <DialogContent dir={isRTL ? 'rtl' : 'ltr'}>
                <DialogHeader>
                  <DialogTitle>{t('dialog.acknowledgeTitle')}</DialogTitle>
                  <DialogDescription>{t('dialog.acknowledgeDescription')}</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="notes">{t('dialog.notes')}</Label>
                    <Textarea
                      id="notes"
                      value={reviewNotes}
                      onChange={(e) => setReviewNotes(e.target.value)}
                      placeholder={t('dialog.notesPlaceholder')}
                      className="min-h-[100px]"
                    />
                  </div>
                </div>
                <DialogFooter className="gap-2 sm:gap-0">
                  <Button variant="outline" onClick={() => setIsReviewDialogOpen(false)}>
                    {t('actions.cancel')}
                  </Button>
                  <Button
                    onClick={() => handleUpdateStatus('acknowledged')}
                    disabled={updateAssessment.isPending}
                  >
                    {updateAssessment.isPending ? t('actions.saving') : t('actions.confirm')}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Button
              variant="outline"
              onClick={() => handleUpdateStatus('reviewed')}
              disabled={updateAssessment.isPending}
            >
              {t('actions.markReviewed')}
            </Button>
          </div>
        )}

        {assessment.status === 'acknowledged' && (
          <div className="pt-4">
            <Button
              onClick={() => handleUpdateStatus('actioned')}
              disabled={updateAssessment.isPending}
            >
              {t('actions.markActioned')}
            </Button>
          </div>
        )}

        {/* Review notes display */}
        {assessment.review_notes && (
          <div className="mt-4 rounded-lg bg-muted/30 p-3">
            <p className="mb-1 text-xs text-muted-foreground">{t('assessment.reviewNotes')}</p>
            <p className="text-sm">{assessment.review_notes}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default ImpactAssessmentPanel
