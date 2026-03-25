/**
 * DashboardPage Component
 *
 * Redesigned dashboard matching shadcn-ui-kit reference:
 * - space-y-4 throughout
 * - Uniform gradient metric cards
 * - @container responsive charts
 * - Highlights-based success metrics
 *
 * Date range picker controls filter all dashboard data.
 */

import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from '@tanstack/react-router'
import { Plus, CheckCircle2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  MyDossiersSection,
  RecentDossierActivity,
  PendingWorkByDossier,
} from '@/components/dashboard'
import { useDossierDashboardSummary, useMyDossiers } from '@/hooks/useDossierDashboard'
import { RecommendationsPanel } from '@/components/engagement-recommendations'
import { useWorkCreation } from '@/components/work-creation'
import {
  DashboardMetricCards,
  ChartWorkItemTrends,
  ChartDossierDistribution,
  DossierSuccessMetrics,
  DashboardDateRangePicker,
  DashboardExportButton,
  RecentDossiersTable,
} from './components'
import { type DateRangePreset, presetToTrendRange } from './components/DashboardDateRangePicker'

export function DashboardPage() {
  const { t } = useTranslation(['dashboard', 'dossiers'])
  const navigate = useNavigate()
  const { openPalette } = useWorkCreation()

  // Date range state — drives all dashboard queries
  const [dateRange, setDateRange] = useState<DateRangePreset>('last7')
  const trendRange = useMemo(() => presetToTrendRange(dateRange), [dateRange])

  // Fetch dashboard summary
  const { data: summary, isLoading: summaryLoading } = useDossierDashboardSummary()

  // Fetch my dossiers for distribution chart
  const { data: myDossiersData } = useMyDossiers({ limit: 100 })

  return (
    <div className="w-full space-y-4">
      {/* Header */}
      <section className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          {t('dashboard:title')}
        </h1>
        <div className="flex items-center gap-2">
          <DashboardDateRangePicker value={dateRange} onChange={setDateRange} />
          <DashboardExportButton summary={summary} dossiers={myDossiersData?.dossiers} />
          <Button onClick={() => openPalette('task')} className="min-h-9 gap-2">
            <Plus className="size-4" />
            <span className="hidden sm:inline">{t('dashboard:new_task')}</span>
          </Button>
        </div>
      </section>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="z-10">
          <TabsTrigger value="overview">{t('dashboard:tabs.overview')}</TabsTrigger>
          <TabsTrigger value="activities">{t('dashboard:tabs.activities')}</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          {/* Metric Cards */}
          <DashboardMetricCards summary={summary} isLoading={summaryLoading} />

          {/* Charts Row: Trends (2/3) + Success Metrics (1/3) */}
          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            <ChartWorkItemTrends className="lg:col-span-2" range={trendRange} />
            <DossierSuccessMetrics isLoading={summaryLoading} />
          </div>

          {/* My Dossiers Section */}
          <MyDossiersSection
            maxItems={6}
            showViewAll={true}
            onViewAll={() => navigate({ to: '/dossiers' })}
          />

          {/* Pending Work + Distribution + Recommendations */}
          <div className="mt-4 grid gap-4 xl:grid-cols-2 2xl:grid-cols-4">
            <PendingWorkByDossier
              maxDossiers={5}
              defaultExpanded={false}
              className="xl:col-span-1"
            />
            <ChartDossierDistribution
              summary={summary}
              countsByType={myDossiersData?.counts_by_type}
              isLoading={summaryLoading}
              className="xl:col-span-1"
            />
            <RecommendationsPanel
              showStats={true}
              maxItems={3}
              onViewAll={() => navigate({ to: '/engagements' })}
              className="xl:col-span-2 2xl:col-span-2"
            />
          </div>

          {/* Recent Dossiers Table */}
          <RecentDossiersTable maxItems={5} />

          {/* Due for Review */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <CheckCircle2 className="size-5 text-primary" />
                {t('dashboard:review.title')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                <CheckCircle2 className="size-10 mb-3 text-muted-foreground/50" />
                <p className="text-sm">{t('dashboard:review.empty')}</p>
                <p className="text-xs mt-1">{t('dashboard:review.hint')}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Activities Tab */}
        <TabsContent value="activities" className="space-y-4">
          <section className="grid gap-4 lg:grid-cols-2">
            <RecentDossierActivity maxItems={20} maxHeight="600px" showDossierBadges={true} />
            <PendingWorkByDossier maxDossiers={10} defaultExpanded={true} />
          </section>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default DashboardPage
