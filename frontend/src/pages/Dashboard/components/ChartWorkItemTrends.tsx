/**
 * Work Item Trends Chart
 *
 * Area chart showing created vs completed work items over time.
 * Includes @container responsive toggle/select switch (7d/30d/90d).
 */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Area, AreaChart, CartesianGrid, XAxis } from 'recharts'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardAction,
  CardContent,
} from '@/components/ui/card'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from '@/components/ui/chart'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { useDashboardTrends, type TrendRange } from '@/hooks/useDashboardTrends'
import { useDirection } from '@/hooks/useDirection'
import { LtrIsolate } from '@/components/ui/ltr-isolate'

const chartConfig = {
  created: {
    label: 'Created',
    color: 'var(--chart-1)',
  },
  completed: {
    label: 'Completed',
    color: 'var(--chart-2)',
  },
} satisfies ChartConfig

interface ChartWorkItemTrendsProps {
  className?: string
  range?: TrendRange
  onRangeChange?: (range: TrendRange) => void
}

export function ChartWorkItemTrends({
  className,
  range: controlledRange,
  onRangeChange,
}: ChartWorkItemTrendsProps) {
  const { t, i18n } = useTranslation('dashboard')
  const { isRTL } = useDirection()
  const [internalRange, setInternalRange] = useState<TrendRange>('30d')

  const range = controlledRange ?? internalRange
  const setRange = (v: TrendRange) => {
    setInternalRange(v)
    onRangeChange?.(v)
  }

  const { data, isLoading } = useDashboardTrends(range)
  const locale = isRTL ? 'ar-SA' : i18n.language

  return (
    <Card className={`@container/card ${className ?? ''}`}>
      <CardHeader>
        <CardTitle>{t('charts.workItemTrends')}</CardTitle>
        <CardDescription>
          <span className="hidden @[540px]/card:block">{t('charts.workItemTrends_desc')}</span>
          <span className="@[540px]/card:hidden">
            {t('charts.workItemTrends_desc_short', { value: 5.2 })}
          </span>
        </CardDescription>
        <CardAction>
          {/* Desktop: ToggleGroup — visible at @[767px] container width */}
          <ToggleGroup
            type="single"
            variant="outline"
            value={range}
            onValueChange={(v) => v && setRange(v as TrendRange)}
            className="hidden *:data-[slot=toggle-group-item]:!px-4 @[767px]/card:flex"
          >
            <ToggleGroupItem value="7d">{t('charts.ranges.7d')}</ToggleGroupItem>
            <ToggleGroupItem value="30d">{t('charts.ranges.30d')}</ToggleGroupItem>
            <ToggleGroupItem value="90d">{t('charts.ranges.90d')}</ToggleGroupItem>
          </ToggleGroup>
          {/* Mobile: Select — hidden at @[767px] */}
          <Select value={range} onValueChange={(v) => setRange(v as TrendRange)}>
            <SelectTrigger className="w-40 h-8 @[767px]/card:hidden">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">{t('charts.ranges.7d')}</SelectItem>
              <SelectItem value="30d">{t('charts.ranges.30d')}</SelectItem>
              <SelectItem value="90d">{t('charts.ranges.90d')}</SelectItem>
            </SelectContent>
          </Select>
        </CardAction>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        {isLoading ? (
          <Skeleton className="h-[200px] lg:h-[250px] w-full rounded-lg" />
        ) : (
          <LtrIsolate className="aspect-auto h-[200px] lg:h-[250px] w-full">
          <ChartContainer
            config={chartConfig}
            className="h-full w-full"
          >
            <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 4 }}>
              <defs>
                <linearGradient id="fillCreated" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-created)" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="var(--color-created)" stopOpacity={0.1} />
                </linearGradient>
                <linearGradient id="fillCompleted" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-completed)" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="var(--color-completed)" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={32}
                tickFormatter={(value) => {
                  const date = new Date(value)
                  return date.toLocaleDateString(locale, {
                    month: 'short',
                    day: 'numeric',
                  })
                }}
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    labelFormatter={(value) => {
                      return new Date(String(value)).toLocaleDateString(locale, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })
                    }}
                    indicator="dot"
                  />
                }
              />
              <Area
                dataKey="completed"
                type="natural"
                fill="url(#fillCompleted)"
                stroke="var(--color-completed)"
                stackId="a"
              />
              <Area
                dataKey="created"
                type="natural"
                fill="url(#fillCreated)"
                stroke="var(--color-created)"
                stackId="a"
              />
              <ChartLegend content={(props: any) => <ChartLegendContent {...props} />} />
            </AreaChart>
          </ChartContainer>
          </LtrIsolate>
        )}
      </CardContent>
    </Card>
  )
}
