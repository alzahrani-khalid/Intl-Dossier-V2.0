/**
 * Dossier Distribution Chart
 *
 * Pie/donut chart showing breakdown of dossier types.
 * Uses data from useDossierDashboardSummary().
 */

import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Pie, PieChart, Label } from 'recharts'
import { cn } from '@/lib/utils'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import { Skeleton } from '@/components/ui/skeleton'
import type { DossierDashboardSummary } from '@/types/dossier-dashboard.types'

// Map dossier types to chart colors
const typeColors: Record<string, string> = {
  country: 'var(--chart-1)',
  organization: 'var(--chart-2)',
  forum: 'var(--chart-3)',
  engagement: 'var(--chart-4)',
  topic: 'var(--chart-5)',
  working_group: 'var(--chart-1)',
  person: 'var(--chart-2)',
  elected_official: 'var(--chart-3)',
}

interface ChartDossierDistributionProps {
  summary: DossierDashboardSummary | undefined
  countsByType?: Record<string, number>
  isLoading: boolean
  className?: string
}

export function ChartDossierDistribution({
  summary,
  countsByType,
  isLoading,
  className,
}: ChartDossierDistributionProps) {
  const { t } = useTranslation(['dashboard', 'dossiers'])

  const totalDossiers = summary?.total_dossiers ?? 0

  // Build chart data from counts_by_type or mock data
  const chartData = useMemo(() => {
    if (countsByType) {
      return Object.entries(countsByType)
        .filter(([, count]) => count > 0)
        .map(([type, count]) => ({
          type,
          count,
          fill: typeColors[type] || 'var(--chart-1)',
        }))
    }
    // Mock data when no real data
    return [
      { type: 'country', count: 12, fill: 'var(--chart-1)' },
      { type: 'organization', count: 8, fill: 'var(--chart-2)' },
      { type: 'forum', count: 5, fill: 'var(--chart-3)' },
      { type: 'engagement', count: 15, fill: 'var(--chart-4)' },
      { type: 'topic', count: 3, fill: 'var(--chart-5)' },
    ]
  }, [countsByType])

  const chartConfig = useMemo(() => {
    const config: ChartConfig = {}
    chartData.forEach((item) => {
      config[item.type] = {
        label: t(`dossiers:types.${item.type}`, item.type),
        color: item.fill,
      }
    })
    return config
  }, [chartData, t])

  return (
    <Card className={cn('flex flex-col', className)}>
      <CardHeader>
        <CardTitle>{t('dashboard:charts.dossierDistribution')}</CardTitle>
        <CardDescription>{t('dashboard:charts.dossierDistribution_desc')}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        {isLoading ? (
          <Skeleton className="mx-auto size-[200px] rounded-full" />
        ) : (
          <ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-[250px]">
            <PieChart>
              <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
              <Pie data={chartData} dataKey="count" nameKey="type" innerRadius={60} strokeWidth={5}>
                <Label
                  content={({ viewBox }) => {
                    if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
                      return (
                        <text
                          x={viewBox.cx}
                          y={viewBox.cy}
                          textAnchor="middle"
                          dominantBaseline="middle"
                        >
                          <tspan
                            x={viewBox.cx}
                            y={viewBox.cy}
                            className="fill-foreground text-3xl font-bold"
                          >
                            {totalDossiers || chartData.reduce((sum, d) => sum + d.count, 0)}
                          </tspan>
                          <tspan
                            x={viewBox.cx}
                            y={(viewBox.cy || 0) + 24}
                            className="fill-muted-foreground text-sm"
                          >
                            {t('dashboard:metrics.myDossiers')}
                          </tspan>
                        </text>
                      )
                    }
                    return null
                  }}
                />
              </Pie>
            </PieChart>
          </ChartContainer>
        )}
      </CardContent>
      <CardFooter className="flex-col gap-2 text-sm">
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-1">
          {chartData.map((item) => (
            <div key={item.type} className="flex items-center gap-1.5">
              <div className="size-2.5 rounded-full" style={{ backgroundColor: item.fill }} />
              <span className="text-xs text-muted-foreground">
                {t(`dossiers:types.${item.type}`, item.type)} ({item.count})
              </span>
            </div>
          ))}
        </div>
      </CardFooter>
    </Card>
  )
}
