/**
 * MilestonePlannerEmptyState Component
 *
 * Interactive planning canvas for entities with no timeline events.
 * Allows users to project future events, set policy deadlines,
 * and schedule relationship reviews.
 *
 * Mobile-first responsive design with RTL support.
 */

import { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CalendarDays,
  Target,
  Plus,
  Lightbulb,
  Users,
  FileText,
  RefreshCw,
  FileCheck,
  ArrowRight,
  RotateCcw,
  Flag,
  Calendar,
  AlertCircle,
  TrendingUp,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { MilestoneCard } from './MilestoneCard'
import { AddMilestoneDialog } from './AddMilestoneDialog'
import { ConvertMilestoneDialog } from './ConvertMilestoneDialog'
import type {
  PlannedMilestone,
  MilestoneType,
  MilestoneTemplate,
  MILESTONE_TEMPLATES,
  CreateMilestoneRequest,
  UpdateMilestoneRequest,
} from '@/types/milestone-planning.types'

interface MilestonePlannerEmptyStateProps {
  dossierId: string
  dossierType: PlannedMilestone['dossier_type']
  milestones: PlannedMilestone[]
  isLoading?: boolean
  onCreateMilestone: (data: CreateMilestoneRequest) => Promise<PlannedMilestone>
  onUpdateMilestone: (id: string, data: UpdateMilestoneRequest) => Promise<PlannedMilestone>
  onDeleteMilestone: (id: string) => Promise<void>
  onMarkComplete: (id: string) => Promise<void>
  onConvertToEvent: (milestoneId: string, eventType: string) => Promise<void>
}

// Quick add templates
const quickAddTemplates: Array<{
  type: MilestoneType
  icon: typeof Users
  color: string
}> = [
  {
    type: 'engagement',
    icon: Users,
    color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  },
  {
    type: 'policy_deadline',
    icon: FileText,
    color: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
  },
  {
    type: 'relationship_review',
    icon: RefreshCw,
    color: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
  },
  {
    type: 'document_due',
    icon: FileCheck,
    color: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
  },
  {
    type: 'follow_up',
    icon: ArrowRight,
    color: 'bg-cyan-100 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400',
  },
  {
    type: 'renewal',
    icon: RotateCcw,
    color: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
  },
]

export function MilestonePlannerEmptyState({
  dossierId,
  dossierType,
  milestones,
  isLoading = false,
  onCreateMilestone,
  onUpdateMilestone,
  onDeleteMilestone,
  onMarkComplete,
  onConvertToEvent,
}: MilestonePlannerEmptyStateProps) {
  const { t, i18n } = useTranslation('milestone-planning')
  const isRTL = i18n.language === 'ar'

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editMilestone, setEditMilestone] = useState<PlannedMilestone | null>(null)
  const [selectedType, setSelectedType] = useState<MilestoneType | null>(null)
  const [convertMilestone, setConvertMilestone] = useState<PlannedMilestone | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Calculate stats
  const stats = {
    total: milestones.length,
    upcoming: milestones.filter((m) => m.status === 'planned' || m.status === 'in_progress').length,
    overdue: milestones.filter((m) => {
      const daysUntil = Math.ceil(
        (new Date(m.target_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24),
      )
      return daysUntil < 0 && m.status !== 'completed' && m.status !== 'cancelled'
    }).length,
    thisWeek: milestones.filter((m) => {
      const daysUntil = Math.ceil(
        (new Date(m.target_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24),
      )
      return (
        daysUntil >= 0 && daysUntil <= 7 && m.status !== 'completed' && m.status !== 'cancelled'
      )
    }).length,
  }

  const handleOpenDialog = useCallback((type?: MilestoneType) => {
    setEditMilestone(null)
    setSelectedType(type || null)
    setIsDialogOpen(true)
  }, [])

  const handleEditMilestone = useCallback((milestone: PlannedMilestone) => {
    setEditMilestone(milestone)
    setSelectedType(milestone.milestone_type)
    setIsDialogOpen(true)
  }, [])

  const handleSubmit = useCallback(
    async (data: CreateMilestoneRequest | UpdateMilestoneRequest) => {
      setIsSubmitting(true)
      try {
        if (editMilestone) {
          await onUpdateMilestone(editMilestone.id, data as UpdateMilestoneRequest)
        } else {
          await onCreateMilestone(data as CreateMilestoneRequest)
        }
        setIsDialogOpen(false)
        setEditMilestone(null)
      } finally {
        setIsSubmitting(false)
      }
    },
    [editMilestone, onCreateMilestone, onUpdateMilestone],
  )

  const handleDelete = useCallback(
    async (milestoneId: string) => {
      if (window.confirm(t('form.confirmDelete'))) {
        await onDeleteMilestone(milestoneId)
      }
    },
    [onDeleteMilestone, t],
  )

  const handleConvert = useCallback(
    async (eventType: string) => {
      if (convertMilestone) {
        await onConvertToEvent(convertMilestone.id, eventType)
        setConvertMilestone(null)
      }
    },
    [convertMilestone, onConvertToEvent],
  )

  const isEmpty = milestones.length === 0

  return (
    <div className="w-full space-y-6" dir={isRTL ? 'rtl' : 'ltr'} data-testid="milestone-planner">
      {isEmpty ? (
        // Empty State - Planning Canvas Introduction
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-8 sm:py-12 text-center px-4"
        >
          {/* Hero Icon */}
          <div className="relative mb-6">
            <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
              <Target className="h-10 w-10 sm:h-12 sm:w-12 text-primary" />
            </div>
            <div className="absolute -bottom-1 -right-1 sm:-bottom-2 sm:-right-2 h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-primary flex items-center justify-center">
              <Plus className="h-4 w-4 sm:h-5 sm:w-5 text-primary-foreground" />
            </div>
          </div>

          {/* Title and Description */}
          <h3 className="text-lg sm:text-xl md:text-2xl font-semibold text-foreground mb-2">
            {t('emptyState.title')}
          </h3>
          <p className="text-sm sm:text-base text-muted-foreground max-w-md mb-6">
            {t('emptyState.description')}
          </p>

          {/* Hint */}
          <div className="flex items-start gap-2 bg-muted/50 rounded-lg p-3 sm:p-4 max-w-md mb-8">
            <Lightbulb className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs sm:text-sm text-muted-foreground text-start">
              {t('emptyState.hint')}
            </p>
          </div>

          {/* Quick Add Buttons */}
          <div className="w-full max-w-md">
            <p className="text-sm font-medium text-muted-foreground mb-3">
              {t('quickAdd.selectTemplate')}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
              {quickAddTemplates.map((template) => {
                const Icon = template.icon
                return (
                  <Button
                    key={template.type}
                    variant="outline"
                    className={cn(
                      'flex flex-col items-center gap-2 h-auto py-4 px-3 hover:border-primary/50 transition-colors',
                    )}
                    onClick={() => handleOpenDialog(template.type)}
                  >
                    <div
                      className={cn(
                        'h-10 w-10 rounded-lg flex items-center justify-center',
                        template.color,
                      )}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="text-xs text-center line-clamp-2">
                      {t(`types.${template.type}`)}
                    </span>
                  </Button>
                )
              })}
            </div>
          </div>

          {/* Primary CTA */}
          <Button size="lg" className="mt-6 min-h-11" onClick={() => handleOpenDialog()}>
            <Plus className={cn('h-5 w-5', isRTL ? 'ms-2' : 'me-2')} />
            {t('emptyState.cta')}
          </Button>
        </motion.div>
      ) : (
        // Planning Canvas with Milestones
        <>
          {/* Stats Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
            <Card className="p-3 sm:p-4">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Target className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{t('stats.total')}</p>
                  <p className="text-lg sm:text-xl font-semibold">{stats.total}</p>
                </div>
              </div>
            </Card>
            <Card className="p-3 sm:p-4">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{t('stats.upcoming')}</p>
                  <p className="text-lg sm:text-xl font-semibold">{stats.upcoming}</p>
                </div>
              </div>
            </Card>
            <Card className="p-3 sm:p-4">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                  <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{t('stats.thisWeek')}</p>
                  <p className="text-lg sm:text-xl font-semibold">{stats.thisWeek}</p>
                </div>
              </div>
            </Card>
            <Card className="p-3 sm:p-4">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{t('stats.overdue')}</p>
                  <p className="text-lg sm:text-xl font-semibold text-red-600 dark:text-red-400">
                    {stats.overdue}
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Header with Add Button */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-foreground">{t('title')}</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">{t('subtitle')}</p>
            </div>
            <Button onClick={() => handleOpenDialog()} size="sm">
              <Plus className={cn('h-4 w-4', isRTL ? 'ms-1' : 'me-1')} />
              <span className="hidden sm:inline">{t('form.addMilestone')}</span>
            </Button>
          </div>

          {/* Milestones List */}
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {milestones
                .sort(
                  (a, b) => new Date(a.target_date).getTime() - new Date(b.target_date).getTime(),
                )
                .map((milestone) => (
                  <MilestoneCard
                    key={milestone.id}
                    milestone={milestone}
                    onEdit={handleEditMilestone}
                    onDelete={handleDelete}
                    onMarkComplete={onMarkComplete}
                    onConvertToEvent={setConvertMilestone}
                  />
                ))}
            </AnimatePresence>
          </div>

          {/* Quick Add Section */}
          <Card className="bg-muted/30 border-dashed">
            <CardContent className="p-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm text-muted-foreground me-2">{t('quickAdd.title')}:</span>
                {quickAddTemplates.slice(0, 4).map((template) => {
                  const Icon = template.icon
                  return (
                    <Button
                      key={template.type}
                      variant="ghost"
                      size="sm"
                      className="h-8"
                      onClick={() => handleOpenDialog(template.type)}
                    >
                      <Icon className={cn('h-4 w-4', isRTL ? 'ms-1' : 'me-1')} />
                      {t(`types.${template.type}`)}
                    </Button>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Add/Edit Dialog */}
      <AddMilestoneDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        dossierType={dossierType}
        dossierId={dossierId}
        editMilestone={editMilestone}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
      />

      {/* Convert to Event Dialog */}
      {convertMilestone && (
        <ConvertMilestoneDialog
          open={!!convertMilestone}
          onOpenChange={() => setConvertMilestone(null)}
          milestone={convertMilestone}
          onConvert={handleConvert}
        />
      )}
    </div>
  )
}
