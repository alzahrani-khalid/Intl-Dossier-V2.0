/**
 * CommitmentDeliverablesEmptyState Component
 *
 * Interactive empty state for commitments without deliverables.
 * Provides templates and quick-add options to help users break
 * commitments into trackable milestones.
 *
 * Mobile-first responsive design with RTL support.
 */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import {
  Target,
  Plus,
  Lightbulb,
  FileText,
  Users,
  CheckCircle,
  Send,
  ArrowRight,
  ClipboardCheck,
  LayoutTemplate,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import {
  TEMPLATE_SETS,
  DELIVERABLE_TEMPLATES,
  generateDeliverablesFromTemplateSet,
  type CommitmentDeliverableType,
} from '@/types/commitment-deliverable.types'
import { useBulkCreateDeliverables, useCreateDeliverable } from '@/hooks/useCommitmentDeliverables'
import { AddDeliverableDialog } from './AddDeliverableDialog'

// Icon mapping for deliverable types
const TYPE_ICONS: Record<CommitmentDeliverableType, typeof FileText> = {
  milestone: Target,
  document: FileText,
  meeting: Users,
  review: ClipboardCheck,
  follow_up: ArrowRight,
  report: Send,
  custom: CheckCircle,
}

// Color mapping for deliverable types
const TYPE_COLORS: Record<CommitmentDeliverableType, string> = {
  milestone: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400',
  document: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
  meeting: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
  review: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  follow_up: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
  report: 'bg-cyan-100 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400',
  custom: 'bg-gray-100 text-gray-600 dark:bg-gray-900/30 dark:text-gray-400',
}

interface CommitmentDeliverablesEmptyStateProps {
  commitmentId: string
  commitmentDueDate: string
}

export function CommitmentDeliverablesEmptyState({
  commitmentId,
  commitmentDueDate,
}: CommitmentDeliverablesEmptyStateProps) {
  const { t, i18n } = useTranslation('commitment-deliverables')
  const isRTL = i18n.language === 'ar'

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedType, setSelectedType] = useState<CommitmentDeliverableType | null>(null)
  const [isApplyingTemplate, setIsApplyingTemplate] = useState<string | null>(null)

  const bulkCreateMutation = useBulkCreateDeliverables()
  const createMutation = useCreateDeliverable()

  // Quick add templates (subset for display)
  const quickAddTypes: CommitmentDeliverableType[] = [
    'review',
    'document',
    'meeting',
    'report',
    'follow_up',
    'milestone',
  ]

  const handleOpenDialog = (type?: CommitmentDeliverableType) => {
    setSelectedType(type || null)
    setIsDialogOpen(true)
  }

  const handleApplyTemplate = async (templateSetId: string) => {
    setIsApplyingTemplate(templateSetId)
    try {
      const deliverables = generateDeliverablesFromTemplateSet(
        commitmentId,
        commitmentDueDate,
        templateSetId,
      )

      if (deliverables.length > 0) {
        await bulkCreateMutation.mutateAsync({
          commitment_id: commitmentId,
          deliverables: deliverables.map(({ commitment_id, ...rest }) => rest),
        })
      }
    } finally {
      setIsApplyingTemplate(null)
    }
  }

  return (
    <div
      className="w-full space-y-6"
      dir={isRTL ? 'rtl' : 'ltr'}
      data-testid="deliverables-empty-state"
    >
      {/* Empty State Hero */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center py-6 sm:py-8 text-center px-4"
      >
        {/* Hero Icon */}
        <div className="relative mb-4 sm:mb-6">
          <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
            <Target className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
          </div>
          <div className="absolute -bottom-1 -end-1 h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-primary flex items-center justify-center">
            <Plus className="h-4 w-4 text-primary-foreground" />
          </div>
        </div>

        {/* Title and Description */}
        <h3 className="text-base sm:text-lg md:text-xl font-semibold text-foreground mb-2">
          {t('emptyState.title')}
        </h3>
        <p className="text-sm text-muted-foreground max-w-md mb-4">{t('emptyState.description')}</p>

        {/* Hint */}
        <div className="flex items-start gap-2 bg-muted/50 rounded-lg p-3 max-w-md mb-6">
          <Lightbulb className="h-4 w-4 sm:h-5 sm:w-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs sm:text-sm text-muted-foreground text-start">
            {t('emptyState.hint')}
          </p>
        </div>

        {/* Quick Add Buttons */}
        <div className="w-full max-w-md">
          <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-3">
            {t('emptyState.selectTemplate')}
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {quickAddTypes.map((type) => {
              const Icon = TYPE_ICONS[type]
              return (
                <Button
                  key={type}
                  variant="outline"
                  className="flex flex-col items-center gap-1.5 h-auto py-3 px-2 hover:border-primary/50 transition-colors min-h-11"
                  onClick={() => handleOpenDialog(type)}
                >
                  <div
                    className={cn(
                      'h-8 w-8 sm:h-9 sm:w-9 rounded-lg flex items-center justify-center',
                      TYPE_COLORS[type],
                    )}
                  >
                    <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                  </div>
                  <span className="text-xs text-center line-clamp-1">{t(`types.${type}`)}</span>
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

      {/* Template Sets Section */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 px-1">
          <LayoutTemplate className="h-4 w-4 text-muted-foreground" />
          <p className="text-sm font-medium text-muted-foreground">{t('templates.title')}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {TEMPLATE_SETS.map((templateSet) => {
            const templates = templateSet.templates
              .map((id) => DELIVERABLE_TEMPLATES.find((t) => t.id === id))
              .filter(Boolean)

            return (
              <Card
                key={templateSet.id}
                className={cn(
                  'cursor-pointer hover:border-primary/50 transition-colors',
                  isApplyingTemplate === templateSet.id && 'opacity-50 pointer-events-none',
                )}
                onClick={() => handleApplyTemplate(templateSet.id)}
              >
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-foreground mb-1 text-start">
                        {isRTL ? templateSet.name_ar : templateSet.name_en}
                      </h4>
                      <p className="text-xs text-muted-foreground text-start line-clamp-2">
                        {isRTL ? templateSet.description_ar : templateSet.description_en}
                      </p>
                    </div>
                    <div className="flex -space-x-1 rtl:space-x-reverse">
                      {templates.slice(0, 3).map((template, idx) => {
                        if (!template) return null
                        const Icon = TYPE_ICONS[template.type]
                        return (
                          <div
                            key={template.id}
                            className={cn(
                              'h-6 w-6 rounded-full flex items-center justify-center border-2 border-background',
                              TYPE_COLORS[template.type],
                            )}
                            style={{ zIndex: templates.length - idx }}
                          >
                            <Icon className="h-3 w-3" />
                          </div>
                        )
                      })}
                      {templates.length > 3 && (
                        <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center border-2 border-background text-xs font-medium">
                          +{templates.length - 3}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Add Deliverable Dialog */}
      <AddDeliverableDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        commitmentId={commitmentId}
        commitmentDueDate={commitmentDueDate}
        defaultType={selectedType}
      />
    </div>
  )
}
