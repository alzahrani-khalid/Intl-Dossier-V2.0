/**
 * Dependency Analysis Section Component
 * Feature: entity-dependency-impact
 *
 * Combined view showing dependency graph and impact assessment capabilities
 * Designed to be embedded in dossier detail pages
 * Mobile-first, RTL-compatible
 */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Network, FileWarning, BarChart3, AlertTriangle, ChevronRight, Plus } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'

import { DependencyGraphViewer } from './DependencyGraphViewer'
import { ImpactAssessmentPanel } from './ImpactAssessmentPanel'
import {
  useImpactSummary,
  useAssessments,
  useCreateAssessment,
} from '@/hooks/useEntityDependencies'
import type { ChangeType, ImpactSeverity, ImpactAssessment } from '@/types/entity-dependency.types'
import { SEVERITY_CONFIGS, CHANGE_TYPE_LABELS } from '@/types/entity-dependency.types'
import { cn } from '@/lib/utils'

// ============================================================================
// Types
// ============================================================================

interface DependencyAnalysisSectionProps {
  entityId: string
  entityName: string
  entityType: string
  onEntityNavigate?: (entityId: string, entityType: string) => void
  className?: string
}

// ============================================================================
// Impact Summary Widget
// ============================================================================

interface ImpactSummaryWidgetProps {
  entityId: string
}

function ImpactSummaryWidget({ entityId }: ImpactSummaryWidgetProps) {
  const { t, i18n } = useTranslation('entity-dependencies')
  const isRTL = i18n.language === 'ar'
  const { data: summary, isLoading } = useImpactSummary(entityId)

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-2 sm:gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-20" />
        ))}
      </div>
    )
  }

  if (!summary) return null

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4" dir={isRTL ? 'rtl' : 'ltr'}>
      <Card className="p-3 sm:p-4">
        <div className="flex items-center gap-2">
          <Network className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
          <div>
            <p className="text-[10px] sm:text-xs text-muted-foreground">
              {t('widget.dependencies')}
            </p>
            <p className="text-xl sm:text-2xl font-bold">{summary.total_dependencies}</p>
          </div>
        </div>
      </Card>

      <Card className="p-3 sm:p-4">
        <div className="flex items-center gap-2">
          <FileWarning className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600" />
          <div>
            <p className="text-[10px] sm:text-xs text-muted-foreground">
              {t('widget.pendingReviews')}
            </p>
            <p className="text-xl sm:text-2xl font-bold">{summary.pending_reviews}</p>
          </div>
        </div>
      </Card>

      <Card className="p-3 sm:p-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-red-600" />
          <div>
            <p className="text-[10px] sm:text-xs text-muted-foreground">
              {t('widget.criticalImpacts')}
            </p>
            <p className="text-xl sm:text-2xl font-bold text-red-600">{summary.critical_impacts}</p>
          </div>
        </div>
      </Card>

      <Card className="p-3 sm:p-4">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
          <div>
            <p className="text-[10px] sm:text-xs text-muted-foreground">
              {t('widget.recentAssessments')}
            </p>
            <p className="text-xl sm:text-2xl font-bold">
              {summary.recent_assessments?.length || 0}
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}

// ============================================================================
// Recent Assessments List
// ============================================================================

interface RecentAssessmentsListProps {
  entityId: string
  onSelect: (assessment: ImpactAssessment) => void
}

function RecentAssessmentsList({ entityId, onSelect }: RecentAssessmentsListProps) {
  const { t, i18n } = useTranslation('entity-dependencies')
  const isRTL = i18n.language === 'ar'
  const { data, isLoading } = useAssessments({ entity_id: entityId, limit: 5 })

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16" />
        ))}
      </div>
    )
  }

  if (!data?.data?.length) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <FileWarning className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>{t('list.noAssessments')}</p>
      </div>
    )
  }

  return (
    <div className="space-y-2" dir={isRTL ? 'rtl' : 'ltr'}>
      {data.data.map((assessment) => {
        const severityConfig = SEVERITY_CONFIGS[assessment.overall_severity]
        return (
          <Card
            key={assessment.id}
            className="p-3 sm:p-4 cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => onSelect(assessment)}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge
                    variant="outline"
                    className={cn(severityConfig.bgColor, severityConfig.color)}
                  >
                    {isRTL ? severityConfig.label.ar : severityConfig.label.en}
                  </Badge>
                  <Badge variant="secondary" className="text-[10px] sm:text-xs">
                    {isRTL
                      ? CHANGE_TYPE_LABELS[assessment.change_type].ar
                      : CHANGE_TYPE_LABELS[assessment.change_type].en}
                  </Badge>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1 truncate">
                  {t('list.affectedCount', { count: assessment.total_affected_entities })}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] sm:text-xs text-muted-foreground whitespace-nowrap">
                  {new Date(assessment.assessed_at).toLocaleDateString(isRTL ? 'ar-SA' : 'en-US')}
                </span>
                <ChevronRight
                  className={cn('h-4 w-4 text-muted-foreground', isRTL && 'rotate-180')}
                />
              </div>
            </div>
          </Card>
        )
      })}
    </div>
  )
}

// ============================================================================
// Create Assessment Dialog
// ============================================================================

interface CreateAssessmentDialogProps {
  entityId: string
  entityName: string
  onCreated: (assessment: ImpactAssessment) => void
}

function CreateAssessmentDialog({ entityId, entityName, onCreated }: CreateAssessmentDialogProps) {
  const { t, i18n } = useTranslation('entity-dependencies')
  const isRTL = i18n.language === 'ar'
  const [open, setOpen] = useState(false)
  const [changeType, setChangeType] = useState<ChangeType>('update')
  const createAssessment = useCreateAssessment()

  const handleCreate = async () => {
    try {
      const result = await createAssessment.mutateAsync({
        entity_id: entityId,
        change_type: changeType,
      })
      setOpen(false)
      onCreated(result)
    } catch (err) {
      console.error('Failed to create assessment:', err)
    }
  }

  const changeTypes: ChangeType[] = [
    'update',
    'delete',
    'archive',
    'relationship_add',
    'relationship_remove',
    'status_change',
    'ownership_change',
  ]

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="h-8 sm:h-9">
          <Plus className="h-3 w-3 sm:h-4 sm:w-4 me-1.5" />
          {t('actions.newAssessment')}
        </Button>
      </DialogTrigger>
      <DialogContent dir={isRTL ? 'rtl' : 'ltr'}>
        <DialogHeader>
          <DialogTitle>{t('dialog.createTitle')}</DialogTitle>
          <DialogDescription>
            {t('dialog.createDescription', { name: entityName })}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">{t('dialog.changeType')}</label>
            <Select value={changeType} onValueChange={(v) => setChangeType(v as ChangeType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {changeTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {isRTL ? CHANGE_TYPE_LABELS[type].ar : CHANGE_TYPE_LABELS[type].en}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            {t('actions.cancel')}
          </Button>
          <Button onClick={handleCreate} disabled={createAssessment.isPending}>
            {createAssessment.isPending ? t('actions.creating') : t('actions.create')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ============================================================================
// Main Component
// ============================================================================

export function DependencyAnalysisSection({
  entityId,
  entityName,
  entityType,
  onEntityNavigate,
  className,
}: DependencyAnalysisSectionProps) {
  const { t, i18n } = useTranslation('entity-dependencies')
  const isRTL = i18n.language === 'ar'
  const [activeTab, setActiveTab] = useState('graph')
  const [selectedAssessment, setSelectedAssessment] = useState<ImpactAssessment | null>(null)

  const handleAssessmentSelect = (assessment: ImpactAssessment) => {
    setSelectedAssessment(assessment)
    setActiveTab('assessment')
  }

  return (
    <div className={cn('space-y-4 sm:space-y-6', className)} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Summary Widget */}
      <ImpactSummaryWidget entityId={entityId} />

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
          <TabsList className="grid w-full sm:w-auto grid-cols-3 h-auto">
            <TabsTrigger value="graph" className="text-xs sm:text-sm py-2">
              <Network className="h-3 w-3 sm:h-4 sm:w-4 me-1.5" />
              {t('tabs.graph')}
            </TabsTrigger>
            <TabsTrigger value="assessments" className="text-xs sm:text-sm py-2">
              <FileWarning className="h-3 w-3 sm:h-4 sm:w-4 me-1.5" />
              {t('tabs.assessments')}
            </TabsTrigger>
            <TabsTrigger
              value="assessment"
              className="text-xs sm:text-sm py-2"
              disabled={!selectedAssessment}
            >
              <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4 me-1.5" />
              {t('tabs.details')}
            </TabsTrigger>
          </TabsList>

          <CreateAssessmentDialog
            entityId={entityId}
            entityName={entityName}
            onCreated={handleAssessmentSelect}
          />
        </div>

        <TabsContent value="graph" className="mt-0">
          <DependencyGraphViewer
            entityId={entityId}
            entityName={entityName}
            maxDepth={3}
            includeTransitive
            onNodeClick={onEntityNavigate}
          />
        </TabsContent>

        <TabsContent value="assessments" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle className="text-base sm:text-lg">{t('list.title')}</CardTitle>
              <CardDescription>{t('list.description')}</CardDescription>
            </CardHeader>
            <CardContent>
              <RecentAssessmentsList entityId={entityId} onSelect={handleAssessmentSelect} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assessment" className="mt-0">
          {selectedAssessment ? (
            <ImpactAssessmentPanel
              assessmentId={selectedAssessment.id}
              onComplete={(assessment) => setSelectedAssessment(assessment)}
            />
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>{t('assessment.selectPrompt')}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default DependencyAnalysisSection
