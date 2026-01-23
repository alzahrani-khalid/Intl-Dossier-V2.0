/**
 * ScenarioCard Component
 * Feature: Scenario Planning and What-If Analysis
 *
 * Displays a scenario in a card format with key information
 * and action buttons.
 */

import { useTranslation } from 'react-i18next'
import {
  Target,
  Users,
  FileText,
  GitBranch,
  DollarSign,
  MoreHorizontal,
  Copy,
  Archive,
  Trash2,
  Eye,
  Edit,
  Calendar,
  Variable,
  TrendingUp,
  TrendingDown,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { Scenario, ScenarioType, ScenarioStatus } from '@/types/scenario-sandbox.types'
import {
  getStatusColor,
  SCENARIO_TYPE_LABELS,
  SCENARIO_STATUS_LABELS,
} from '@/types/scenario-sandbox.types'
import { formatDistanceToNow } from 'date-fns'
import { ar, enUS } from 'date-fns/locale'

interface ScenarioCardProps {
  scenario: Scenario & {
    variable_count?: number
    outcome_count?: number
    positive_outcomes?: number
    negative_outcomes?: number
  }
  onView?: (id: string) => void
  onEdit?: (id: string) => void
  onClone?: (id: string) => void
  onArchive?: (id: string) => void
  onDelete?: (id: string) => void
}

const typeIcons: Record<ScenarioType, React.ReactNode> = {
  stakeholder_engagement: <Users className="size-4" />,
  policy_change: <FileText className="size-4" />,
  relationship_impact: <GitBranch className="size-4" />,
  resource_allocation: <DollarSign className="size-4" />,
  strategic_planning: <Target className="size-4" />,
}

export function ScenarioCard({
  scenario,
  onView,
  onEdit,
  onClone,
  onArchive,
  onDelete,
}: ScenarioCardProps) {
  const { t, i18n } = useTranslation('scenario-sandbox')
  const isRTL = i18n.language === 'ar'
  const locale = isRTL ? ar : enUS

  const title = isRTL ? scenario.title_ar : scenario.title_en
  const description = isRTL ? scenario.description_ar : scenario.description_en
  const typeLabel = SCENARIO_TYPE_LABELS[scenario.type]
  const statusLabel = SCENARIO_STATUS_LABELS[scenario.status]

  const positiveOutcomes = scenario.positive_outcomes || 0
  const negativeOutcomes = scenario.negative_outcomes || 0

  return (
    <Card className="group transition-shadow duration-200 hover:shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 flex-1 items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              {typeIcons[scenario.type]}
            </div>
            <div className="min-w-0 flex-1">
              <CardTitle className="truncate text-base font-semibold" title={title}>
                {title}
              </CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                {isRTL ? typeLabel.ar : typeLabel.en}
              </p>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 opacity-0 transition-opacity group-hover:opacity-100"
              >
                <MoreHorizontal className="size-4" />
                <span className="sr-only">{t('actions.more', { ns: 'translation' })}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align={isRTL ? 'start' : 'end'}>
              {onView && (
                <DropdownMenuItem onClick={() => onView(scenario.id)}>
                  <Eye className="me-2 size-4" />
                  {t('scenario.view')}
                </DropdownMenuItem>
              )}
              {onEdit && (
                <DropdownMenuItem onClick={() => onEdit(scenario.id)}>
                  <Edit className="me-2 size-4" />
                  {t('scenario.edit')}
                </DropdownMenuItem>
              )}
              {onClone && (
                <DropdownMenuItem onClick={() => onClone(scenario.id)}>
                  <Copy className="me-2 size-4" />
                  {t('scenario.clone')}
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              {onArchive && scenario.status !== 'archived' && (
                <DropdownMenuItem onClick={() => onArchive(scenario.id)}>
                  <Archive className="me-2 size-4" />
                  {t('scenario.archive')}
                </DropdownMenuItem>
              )}
              {onDelete && (
                <DropdownMenuItem
                  onClick={() => onDelete(scenario.id)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="me-2 size-4" />
                  {t('scenario.delete')}
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {description && <p className="line-clamp-2 text-sm text-muted-foreground">{description}</p>}

        {/* Stats */}
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Variable className="size-4" />
            <span>{scenario.variable_count || 0}</span>
          </div>
          {positiveOutcomes > 0 && (
            <div className="flex items-center gap-1.5 text-green-600 dark:text-green-400">
              <TrendingUp className="size-4" />
              <span>{positiveOutcomes}</span>
            </div>
          )}
          {negativeOutcomes > 0 && (
            <div className="flex items-center gap-1.5 text-red-600 dark:text-red-400">
              <TrendingDown className="size-4" />
              <span>{negativeOutcomes}</span>
            </div>
          )}
        </div>

        {/* Tags */}
        {scenario.tags && scenario.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {scenario.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
            {scenario.tags.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{scenario.tags.length - 3}
              </Badge>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between border-t pt-2">
          <Badge className={getStatusColor(scenario.status)}>
            {isRTL ? statusLabel.ar : statusLabel.en}
          </Badge>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Calendar className="size-3.5" />
            <span>
              {formatDistanceToNow(new Date(scenario.updated_at), {
                addSuffix: true,
                locale,
              })}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
