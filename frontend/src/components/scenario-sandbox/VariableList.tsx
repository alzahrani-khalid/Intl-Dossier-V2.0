/**
 * VariableList Component
 * Feature: Scenario Planning and What-If Analysis
 *
 * Displays and manages scenario variables (what-if changes).
 */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Plus,
  GripVertical,
  Edit,
  Trash2,
  Heart,
  Users,
  MessageSquare,
  DollarSign,
  FileCheck,
  Settings,
  ArrowRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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
import type { ScenarioVariable, VariableChangeType } from '@/types/scenario-sandbox.types'
import { VARIABLE_CHANGE_TYPE_LABELS } from '@/types/scenario-sandbox.types'

interface VariableListProps {
  variables: ScenarioVariable[]
  onAdd: () => void
  onEdit: (variable: ScenarioVariable) => void
  onDelete: (id: string) => void
  isLoading?: boolean
}

const changeTypeIcons: Record<VariableChangeType, React.ReactNode> = {
  relationship_health: <Heart className="size-4" />,
  stakeholder_influence: <Users className="size-4" />,
  engagement_frequency: <MessageSquare className="size-4" />,
  resource_level: <DollarSign className="size-4" />,
  policy_status: <FileCheck className="size-4" />,
  custom_metric: <Settings className="size-4" />,
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return '-'
  if (typeof value === 'number') return value.toString()
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  if (typeof value === 'string') return value
  return JSON.stringify(value)
}

export function VariableList({ variables, onAdd, onEdit, onDelete, isLoading }: VariableListProps) {
  const { t, i18n } = useTranslation('scenario-sandbox')
  const isRTL = i18n.language === 'ar'
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const handleConfirmDelete = () => {
    if (deleteId) {
      onDelete(deleteId)
      setDeleteId(null)
    }
  }

  if (variables.length === 0) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">{t('variable.variables')}</CardTitle>
            <Button size="sm" onClick={onAdd} disabled={isLoading}>
              <Plus className="me-2 size-4" />
              {t('variable.add')}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="py-8 text-center text-muted-foreground">
            <Settings className="mx-auto mb-4 size-12 opacity-40" />
            <p className="font-medium">{t('variable.noVariables')}</p>
            <p className="mt-1 text-sm">{t('variable.noVariablesDesc')}</p>
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
            <CardTitle className="text-lg">{t('variable.variables')}</CardTitle>
            <Button size="sm" onClick={onAdd} disabled={isLoading}>
              <Plus className="me-2 size-4" />
              {t('variable.add')}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {variables.map((variable) => {
            const typeLabel = VARIABLE_CHANGE_TYPE_LABELS[variable.change_type]
            const name = isRTL ? variable.name_ar : variable.name_en

            return (
              <div
                key={variable.id}
                className="group flex items-center gap-3 rounded-lg border bg-card p-3 transition-colors hover:bg-muted/50"
              >
                <GripVertical className="size-4 cursor-grab text-muted-foreground/50" />

                <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                  {changeTypeIcons[variable.change_type]}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-medium">{name}</span>
                    <Badge variant="outline" className="shrink-0 text-xs">
                      {isRTL ? typeLabel.ar : typeLabel.en}
                    </Badge>
                  </div>

                  <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="font-mono">{formatValue(variable.original_value)}</span>
                    <ArrowRight className={`size-3 ${isRTL ? 'rotate-180' : ''}`} />
                    <span className="font-mono font-medium text-foreground">
                      {formatValue(variable.modified_value)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8"
                    onClick={() => onEdit(variable)}
                    disabled={isLoading}
                  >
                    <Edit className="size-4" />
                    <span className="sr-only">{t('variable.edit')}</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 text-destructive hover:text-destructive"
                    onClick={() => setDeleteId(variable.id)}
                    disabled={isLoading}
                  >
                    <Trash2 className="size-4" />
                    <span className="sr-only">{t('variable.delete')}</span>
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
            <AlertDialogTitle>{t('variable.delete')}</AlertDialogTitle>
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
