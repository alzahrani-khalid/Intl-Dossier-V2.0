/**
 * ScenarioComparison Component
 * Feature: Scenario Planning and What-If Analysis
 *
 * Side-by-side comparison of multiple scenarios.
 */

import { useTranslation } from 'react-i18next'
import {
  GitCompare,
  TrendingUp,
  TrendingDown,
  Variable,
  Target,
  Percent,
  CheckCircle2,
  XCircle,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import type {
  ScenarioComparisonData,
  ScenarioComparisonSummary,
} from '@/types/scenario-sandbox.types'
import {
  SCENARIO_TYPE_LABELS,
  SCENARIO_STATUS_LABELS,
  getStatusColor,
} from '@/types/scenario-sandbox.types'

interface ScenarioComparisonProps {
  data: ScenarioComparisonData
  isLoading?: boolean
}

export function ScenarioComparison({ data, isLoading }: ScenarioComparisonProps) {
  const { t, i18n } = useTranslation('scenario-sandbox')
  const isRTL = i18n.language === 'ar'

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex items-center justify-center">
            <div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!data || data.scenarios.length < 2) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center text-muted-foreground">
            <GitCompare className="mx-auto mb-4 size-12 opacity-40" />
            <p className="font-medium">{t('comparison.selectScenarios')}</p>
            <p className="mt-1 text-sm">{t('comparison.minScenarios')}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const { scenarios } = data

  // Find best/worst for highlighting
  const maxVariables = Math.max(...scenarios.map((s) => s.variable_count))
  const maxPositive = Math.max(...scenarios.map((s) => s.positive_outcomes))
  const minNegative = Math.min(...scenarios.map((s) => s.negative_outcomes))
  const maxProbability = Math.max(...scenarios.map((s) => s.avg_probability || 0))

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GitCompare className="size-5" />
          {t('comparison.sideBySide')}
        </CardTitle>
        <CardDescription>
          {t('comparison.comparisons')}: {scenarios.length} {t('tabs.scenarios').toLowerCase()}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="px-4 py-3 text-start font-medium text-muted-foreground">
                  {t('analysis.metrics')}
                </th>
                {scenarios.map((scenario) => (
                  <th key={scenario.id} className="min-w-[200px] px-4 py-3 text-start">
                    <div className="font-semibold">
                      {isRTL ? scenario.title_ar : scenario.title_en}
                    </div>
                    <Badge variant="outline" className={`mt-1 ${getStatusColor(scenario.status)}`}>
                      {isRTL
                        ? SCENARIO_STATUS_LABELS[scenario.status].ar
                        : SCENARIO_STATUS_LABELS[scenario.status].en}
                    </Badge>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* Scenario Type */}
              <tr className="border-b">
                <td className="px-4 py-3 text-muted-foreground">{t('scenario.fields.type')}</td>
                {scenarios.map((scenario) => (
                  <td key={scenario.id} className="px-4 py-3">
                    <Badge variant="secondary">
                      {isRTL
                        ? SCENARIO_TYPE_LABELS[scenario.type].ar
                        : SCENARIO_TYPE_LABELS[scenario.type].en}
                    </Badge>
                  </td>
                ))}
              </tr>

              {/* Variables */}
              <tr className="border-b">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Variable className="size-4" />
                    {t('analysis.stats.totalVariables')}
                  </div>
                </td>
                {scenarios.map((scenario) => (
                  <td key={scenario.id} className="px-4 py-3">
                    <span
                      className={
                        scenario.variable_count === maxVariables ? 'font-semibold text-primary' : ''
                      }
                    >
                      {scenario.variable_count}
                    </span>
                  </td>
                ))}
              </tr>

              {/* Total Outcomes */}
              <tr className="border-b">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Target className="size-4" />
                    {t('analysis.stats.totalOutcomes')}
                  </div>
                </td>
                {scenarios.map((scenario) => (
                  <td key={scenario.id} className="px-4 py-3">
                    {scenario.outcome_count}
                  </td>
                ))}
              </tr>

              {/* Positive Outcomes */}
              <tr className="border-b">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                    <TrendingUp className="size-4" />
                    {t('analysis.stats.positiveOutcomes')}
                  </div>
                </td>
                {scenarios.map((scenario) => (
                  <td key={scenario.id} className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span
                        className={
                          scenario.positive_outcomes === maxPositive && maxPositive > 0
                            ? 'font-semibold text-green-600 dark:text-green-400'
                            : ''
                        }
                      >
                        {scenario.positive_outcomes}
                      </span>
                      {scenario.positive_outcomes === maxPositive && maxPositive > 0 && (
                        <CheckCircle2 className="size-4 text-green-500" />
                      )}
                    </div>
                  </td>
                ))}
              </tr>

              {/* Negative Outcomes */}
              <tr className="border-b">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                    <TrendingDown className="size-4" />
                    {t('analysis.stats.negativeOutcomes')}
                  </div>
                </td>
                {scenarios.map((scenario) => (
                  <td key={scenario.id} className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span
                        className={
                          scenario.negative_outcomes === minNegative
                            ? 'font-semibold text-green-600 dark:text-green-400'
                            : scenario.negative_outcomes > 0
                              ? 'text-red-600 dark:text-red-400'
                              : ''
                        }
                      >
                        {scenario.negative_outcomes}
                      </span>
                      {scenario.negative_outcomes === minNegative &&
                        scenario.negative_outcomes < scenarios[0].negative_outcomes && (
                          <CheckCircle2 className="size-4 text-green-500" />
                        )}
                    </div>
                  </td>
                ))}
              </tr>

              {/* Average Probability */}
              <tr className="border-b">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Percent className="size-4" />
                    {t('analysis.stats.avgProbability')}
                  </div>
                </td>
                {scenarios.map((scenario) => {
                  const probability = scenario.avg_probability || 0
                  return (
                    <td key={scenario.id} className="px-4 py-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={
                              probability === maxProbability && maxProbability > 0
                                ? 'font-semibold text-primary'
                                : ''
                            }
                          >
                            {probability > 0 ? `${Math.round(probability)}%` : '-'}
                          </span>
                        </div>
                        {probability > 0 && <Progress value={probability} className="h-1.5" />}
                      </div>
                    </td>
                  )
                })}
              </tr>

              {/* Outcome Ratio */}
              <tr>
                <td className="px-4 py-3 text-muted-foreground">
                  {t('outcome.positive')} / {t('outcome.negative')}
                </td>
                {scenarios.map((scenario) => {
                  const total = scenario.positive_outcomes + scenario.negative_outcomes
                  const ratio = total > 0 ? (scenario.positive_outcomes / total) * 100 : 0

                  return (
                    <td key={scenario.id} className="px-4 py-3">
                      {total > 0 ? (
                        <div className="flex items-center gap-2">
                          <div className="h-2 max-w-[120px] flex-1 overflow-hidden rounded-full bg-red-200 dark:bg-red-900/30">
                            <div
                              className="h-full rounded-full bg-green-500"
                              style={{ width: `${ratio}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {scenario.positive_outcomes}/{scenario.negative_outcomes}
                          </span>
                        </div>
                      ) : (
                        '-'
                      )}
                    </td>
                  )
                })}
              </tr>
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
