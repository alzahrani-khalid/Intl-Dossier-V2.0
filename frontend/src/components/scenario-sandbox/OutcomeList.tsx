/**
 * OutcomeList Component
 * Feature: Scenario Planning and What-If Analysis
 *
 * Displays and manages scenario outcomes (predicted results).
 */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, Edit, Trash2, TrendingUp, TrendingDown, AlertCircle, Target } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import type { ScenarioOutcome, ImpactLevel } from '@/types/scenario-sandbox.types'
import {
  IMPACT_LEVEL_LABELS,
  getImpactLevelColor,
  getImpactLevelBgColor,
  formatProbability,
  getProbabilityColor,
} from '@/types/scenario-sandbox.types'

interface OutcomeListProps {
  outcomes: ScenarioOutcome[]
  onAdd: () => void
  onEdit: (outcome: ScenarioOutcome) => void
  onDelete: (id: string) => void
  isLoading?: boolean
}

export function OutcomeList({ outcomes, onAdd, onEdit, onDelete, isLoading }: OutcomeListProps) {
  const { t, i18n } = useTranslation('scenario-sandbox')
  const isRTL = i18n.language === 'ar'
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const handleConfirmDelete = () => {
    if (deleteId) {
      onDelete(deleteId)
      setDeleteId(null)
    }
  }

  const positiveOutcomes = outcomes.filter((o) => o.is_positive)
  const negativeOutcomes = outcomes.filter((o) => !o.is_positive)

  if (outcomes.length === 0) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">{t('outcome.outcomes')}</CardTitle>
            <Button size="sm" onClick={onAdd} disabled={isLoading}>
              <Plus className="h-4 w-4 me-2" />
              {t('outcome.add')}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Target className="h-12 w-12 mx-auto mb-4 opacity-40" />
            <p className="font-medium">{t('outcome.noOutcomes')}</p>
            <p className="text-sm mt-1">{t('outcome.noOutcomesDesc')}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <CardTitle className="text-lg">{t('outcome.outcomes')}</CardTitle>
              <div className="flex items-center gap-3 text-sm">
                {positiveOutcomes.length > 0 && (
                  <div className="flex items-center gap-1.5 text-green-600 dark:text-green-400">
                    <TrendingUp className="h-4 w-4" />
                    <span>{positiveOutcomes.length}</span>
                  </div>
                )}
                {negativeOutcomes.length > 0 && (
                  <div className="flex items-center gap-1.5 text-red-600 dark:text-red-400">
                    <TrendingDown className="h-4 w-4" />
                    <span>{negativeOutcomes.length}</span>
                  </div>
                )}
              </div>
            </div>
            <Button size="sm" onClick={onAdd} disabled={isLoading}>
              <Plus className="h-4 w-4 me-2" />
              {t('outcome.add')}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {outcomes.map((outcome) => {
            const impactLabel = IMPACT_LEVEL_LABELS[outcome.impact_level]
            const title = isRTL ? outcome.title_ar : outcome.title_en
            const description = isRTL ? outcome.description_ar : outcome.description_en

            return (
              <div
                key={outcome.id}
                className="group flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
              >
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-md shrink-0 ${
                    outcome.is_positive
                      ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                      : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                  }`}
                >
                  {outcome.is_positive ? (
                    <TrendingUp className="h-4 w-4" />
                  ) : (
                    <TrendingDown className="h-4 w-4" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium">{title}</span>
                    <Badge
                      variant="outline"
                      className={`text-xs ${getImpactLevelColor(outcome.impact_level)}`}
                    >
                      {isRTL ? impactLabel.ar : impactLabel.en}
                    </Badge>
                    <Badge
                      variant="secondary"
                      className={`text-xs ${
                        outcome.is_positive
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                      }`}
                    >
                      {outcome.is_positive ? t('outcome.positive') : t('outcome.negative')}
                    </Badge>
                  </div>

                  {description && (
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{description}</p>
                  )}

                  {outcome.probability_score !== null && (
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs text-muted-foreground">
                        {t('outcome.fields.probability')}:
                      </span>
                      <div className="flex-1 max-w-[120px]">
                        <Progress value={outcome.probability_score} className="h-2" />
                      </div>
                      <span
                        className={`text-sm font-medium ${getProbabilityColor(outcome.probability_score)}`}
                      >
                        {formatProbability(outcome.probability_score)}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => onEdit(outcome)}
                    disabled={isLoading}
                  >
                    <Edit className="h-4 w-4" />
                    <span className="sr-only">{t('outcome.edit')}</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => setDeleteId(outcome.id)}
                    disabled={isLoading}
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">{t('outcome.delete')}</span>
                  </Button>
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent dir={isRTL ? 'rtl' : 'ltr'}>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('outcome.delete')}</AlertDialogTitle>
            <AlertDialogDescription>{t('scenario.confirmDelete')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('actions.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t('actions.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
