/**
 * Stakeholder Influence Page Route
 * Feature: stakeholder-influence-visualization
 *
 * Visualize stakeholder influence based on relationship strength,
 * engagement frequency, and network position. Identify key connectors,
 * decision-makers, and clusters. Generate influence reports for
 * strategic planning of advocacy efforts.
 */

import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Network,
  Users,
  TrendingUp,
  GitBranch,
  BarChart3,
  FileText,
  RefreshCw,
  Plus,
  Search,
  Filter,
  ChevronRight,
  Loader2,
} from 'lucide-react'

import {
  InfluenceNetworkGraph,
  InfluenceMetricsPanel,
  InfluenceReportView,
} from '@/components/stakeholder-influence'
import {
  useStakeholderInfluenceList,
  useStakeholderInfluenceDetail,
  useInfluenceNetworkData,
  useTopInfluencers,
  useKeyConnectors,
  useNetworkStatistics,
  useInfluenceReports,
  useInfluenceReport,
  useCalculateInfluenceScores,
  useCreateInfluenceReport,
} from '@/hooks/useStakeholderInfluence'
import {
  NODE_COLORS,
  INFLUENCE_TIER_LABELS,
  STAKEHOLDER_ROLE_LABELS,
  REPORT_TYPE_LABELS,
} from '@/types/stakeholder-influence.types'
import type { InfluenceTier, InfluenceReportType } from '@/types/stakeholder-influence.types'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/_protected/stakeholder-influence')({
  component: StakeholderInfluencePage,
})

// ============================================================================
// Main Component
// ============================================================================

function StakeholderInfluencePage() {
  const { t, i18n } = useTranslation('stakeholder-influence')
  const isRTL = i18n.language === 'ar'

  // State
  const [activeTab, setActiveTab] = useState('network')
  const [selectedDossierId, setSelectedDossierId] = useState<string | null>(null)
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<string>('all')
  const [showCreateReport, setShowCreateReport] = useState(false)
  const [detailsSheetOpen, setDetailsSheetOpen] = useState(false)

  // Queries
  const { data: statistics, isLoading: loadingStats } = useNetworkStatistics()
  const { data: topInfluencers, isLoading: loadingTop } = useTopInfluencers({ limit: 10 })
  const { data: keyConnectors, isLoading: loadingConnectors } = useKeyConnectors(10, 40)
  const { data: stakeholderList, isLoading: loadingList } = useStakeholderInfluenceList({
    limit: 50,
    type: filterType !== 'all' ? filterType : undefined,
  })
  const { data: selectedDetail, isLoading: loadingDetail } = useStakeholderInfluenceDetail(
    selectedDossierId || '',
    { enabled: !!selectedDossierId },
  )
  const { data: networkData, isLoading: loadingNetwork } = useInfluenceNetworkData(
    selectedDossierId || '',
    { degrees: 2 },
    { enabled: !!selectedDossierId },
  )
  const { data: reports, isLoading: loadingReports } = useInfluenceReports({ limit: 10 })
  const { data: selectedReport, isLoading: loadingReport } = useInfluenceReport(
    selectedReportId || '',
    { enabled: !!selectedReportId },
  )

  // Mutations
  const calculateScores = useCalculateInfluenceScores()
  const createReport = useCreateInfluenceReport()

  // Handlers
  const handleNodeClick = (dossierId: string) => {
    setSelectedDossierId(dossierId)
    setDetailsSheetOpen(true)
  }

  const handleCalculateScores = () => {
    calculateScores.mutate()
  }

  const handleCreateReport = async (data: {
    title_en: string
    title_ar: string
    report_type: InfluenceReportType
    description_en?: string
    description_ar?: string
  }) => {
    await createReport.mutateAsync(data)
    setShowCreateReport(false)
  }

  // Filter stakeholders by search
  const filteredStakeholders = stakeholderList?.data?.filter((s) => {
    if (!searchQuery) return true
    const name = isRTL ? s.name_ar : s.name_en
    return name.toLowerCase().includes(searchQuery.toLowerCase())
  })

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
            <Network className="h-6 w-6 sm:h-8 sm:w-8" />
            {t('title', 'Stakeholder Influence')}
          </h1>
          <p className="text-muted-foreground mt-1">
            {t(
              'description',
              'Analyze influence and identify key connectors for strategic planning',
            )}
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleCalculateScores}
            disabled={calculateScores.isPending}
          >
            {calculateScores.isPending ? (
              <Loader2 className="h-4 w-4 me-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 me-2" />
            )}
            {t('recalculate', 'Recalculate')}
          </Button>
          <Dialog open={showCreateReport} onOpenChange={setShowCreateReport}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 me-2" />
                {t('new_report', 'New Report')}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t('create_report', 'Create Influence Report')}</DialogTitle>
                <DialogDescription>
                  {t('create_report_desc', 'Generate a strategic analysis report')}
                </DialogDescription>
              </DialogHeader>
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  const formData = new FormData(e.currentTarget)
                  handleCreateReport({
                    title_en: formData.get('title_en') as string,
                    title_ar: formData.get('title_ar') as string,
                    report_type: formData.get('report_type') as InfluenceReportType,
                    description_en: formData.get('description_en') as string,
                    description_ar: formData.get('description_ar') as string,
                  })
                }}
              >
                <div className="space-y-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="title_en">{t('title_en', 'Title (English)')}</Label>
                      <Input id="title_en" name="title_en" required />
                    </div>
                    <div>
                      <Label htmlFor="title_ar">{t('title_ar', 'Title (Arabic)')}</Label>
                      <Input id="title_ar" name="title_ar" dir="rtl" required />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="report_type">{t('report_type', 'Report Type')}</Label>
                    <Select name="report_type" defaultValue="full_network_analysis">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(REPORT_TYPE_LABELS).map(([key, labels]) => (
                          <SelectItem key={key} value={key}>
                            {isRTL ? labels.ar : labels.en}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="description_en">
                        {t('description_en', 'Description (EN)')}
                      </Label>
                      <Textarea id="description_en" name="description_en" rows={2} />
                    </div>
                    <div>
                      <Label htmlFor="description_ar">
                        {t('description_ar', 'Description (AR)')}
                      </Label>
                      <Textarea id="description_ar" name="description_ar" dir="rtl" rows={2} />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline">{t('cancel', 'Cancel')}</Button>
                  </DialogClose>
                  <Button type="submit" disabled={createReport.isPending}>
                    {createReport.isPending && <Loader2 className="h-4 w-4 me-2 animate-spin" />}
                    {t('generate', 'Generate Report')}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Statistics Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-xs text-muted-foreground">{t('stakeholders', 'Stakeholders')}</p>
                <p className="text-xl font-bold">
                  {loadingStats ? (
                    <Skeleton className="h-6 w-12" />
                  ) : (
                    statistics?.total_stakeholders || 0
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <GitBranch className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-xs text-muted-foreground">
                  {t('relationships', 'Relationships')}
                </p>
                <p className="text-xl font-bold">
                  {loadingStats ? (
                    <Skeleton className="h-6 w-12" />
                  ) : (
                    statistics?.total_relationships || 0
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-5 w-5 text-amber-600" />
              <div>
                <p className="text-xs text-muted-foreground">
                  {t('key_influencers', 'Key Influencers')}
                </p>
                <p className="text-xl font-bold">
                  {loadingStats ? (
                    <Skeleton className="h-6 w-12" />
                  ) : (
                    statistics?.key_influencers || 0
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <BarChart3 className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-xs text-muted-foreground">{t('avg_influence', 'Avg Score')}</p>
                <p className="text-xl font-bold">
                  {loadingStats ? (
                    <Skeleton className="h-6 w-12" />
                  ) : (
                    (statistics?.avg_influence_score || 0).toFixed(1)
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid mb-4">
          <TabsTrigger value="network" className="gap-2">
            <Network className="h-4 w-4" />
            <span className="hidden sm:inline">{t('network', 'Network')}</span>
          </TabsTrigger>
          <TabsTrigger value="list" className="gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">{t('stakeholders', 'Stakeholders')}</span>
          </TabsTrigger>
          <TabsTrigger value="reports" className="gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">{t('reports', 'Reports')}</span>
          </TabsTrigger>
        </TabsList>

        {/* Network Tab */}
        <TabsContent value="network" className="mt-0">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            {/* Network Graph */}
            <div className="lg:col-span-3">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">
                    {t('influence_network', 'Influence Network')}
                  </CardTitle>
                  <CardDescription>
                    {selectedDossierId
                      ? t('click_node', 'Click nodes to explore relationships')
                      : t('select_stakeholder', 'Select a stakeholder to visualize their network')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <InfluenceNetworkGraph
                    data={networkData}
                    isLoading={loadingNetwork}
                    centerDossierId={selectedDossierId || undefined}
                    onNodeClick={handleNodeClick}
                    height={500}
                    showMiniMap={true}
                    showStats={true}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Side Panel - Top Influencers & Connectors */}
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    {t('top_influencers', 'Top Influencers')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3">
                  {loadingTop ? (
                    <div className="space-y-2">
                      {[...Array(5)].map((_, i) => (
                        <Skeleton key={i} className="h-8 w-full" />
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {topInfluencers?.data?.slice(0, 5).map((s) => (
                        <button
                          key={s.dossier_id}
                          className={cn(
                            'w-full flex items-center justify-between p-2 rounded-md hover:bg-muted text-start',
                            selectedDossierId === s.dossier_id && 'bg-muted',
                          )}
                          onClick={() => handleNodeClick(s.dossier_id)}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <div
                              className="w-2 h-2 rounded-full flex-shrink-0"
                              style={{
                                backgroundColor: NODE_COLORS[s.influence_tier as InfluenceTier],
                              }}
                            />
                            <span className="text-sm truncate">
                              {isRTL ? s.name_ar : s.name_en}
                            </span>
                          </div>
                          <Badge variant="secondary" className="flex-shrink-0">
                            {s.influence_score}
                          </Badge>
                        </button>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <GitBranch className="h-4 w-4" />
                    {t('key_connectors', 'Key Connectors')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3">
                  {loadingConnectors ? (
                    <div className="space-y-2">
                      {[...Array(5)].map((_, i) => (
                        <Skeleton key={i} className="h-8 w-full" />
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {keyConnectors?.data?.slice(0, 5).map((c) => (
                        <button
                          key={c.dossier_id}
                          className={cn(
                            'w-full flex items-center justify-between p-2 rounded-md hover:bg-muted text-start',
                            selectedDossierId === c.dossier_id && 'bg-muted',
                          )}
                          onClick={() => handleNodeClick(c.dossier_id)}
                        >
                          <div className="min-w-0">
                            <p className="text-sm truncate">{isRTL ? c.name_ar : c.name_en}</p>
                            <p className="text-xs text-muted-foreground">
                              {c.groups_connected} {t('groups', 'groups')}
                            </p>
                          </div>
                          <Badge variant="outline" className="flex-shrink-0">
                            {c.bridge_score}
                          </Badge>
                        </button>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Stakeholders List Tab */}
        <TabsContent value="list" className="mt-0">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="relative flex-1">
                  <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={t('search_stakeholders', 'Search stakeholders...')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="ps-9"
                  />
                </div>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-full sm:w-40">
                    <Filter className="h-4 w-4 me-2" />
                    <SelectValue placeholder={t('filter_type', 'Type')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('all_types', 'All Types')}</SelectItem>
                    <SelectItem value="person">{t('persons', 'Persons')}</SelectItem>
                    <SelectItem value="organization">
                      {t('organizations', 'Organizations')}
                    </SelectItem>
                    <SelectItem value="country">{t('countries', 'Countries')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {loadingList ? (
                <div className="space-y-2">
                  {[...Array(10)].map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredStakeholders?.map((s) => (
                    <button
                      key={s.dossier_id}
                      className={cn(
                        'w-full flex items-center justify-between p-3 rounded-lg border hover:bg-muted text-start',
                        selectedDossierId === s.dossier_id && 'border-primary bg-muted',
                      )}
                      onClick={() => handleNodeClick(s.dossier_id)}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
                          style={{
                            backgroundColor: NODE_COLORS[s.influence_tier as InfluenceTier],
                          }}
                        >
                          {s.influence_score}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium truncate">{isRTL ? s.name_ar : s.name_en}</p>
                          <p className="text-sm text-muted-foreground flex items-center gap-2">
                            <span className="capitalize">{s.dossier_type}</span>
                            <span>•</span>
                            <span>
                              {isRTL
                                ? INFLUENCE_TIER_LABELS[s.influence_tier as InfluenceTier].ar
                                : INFLUENCE_TIER_LABELS[s.influence_tier as InfluenceTier].en}
                            </span>
                          </p>
                        </div>
                      </div>
                      <ChevronRight
                        className={cn('h-5 w-5 text-muted-foreground', isRTL && 'rotate-180')}
                      />
                    </button>
                  ))}
                  {filteredStakeholders?.length === 0 && (
                    <p className="text-center py-8 text-muted-foreground">
                      {t('no_results', 'No stakeholders found')}
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports" className="mt-0">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Reports List */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">{t('reports', 'Reports')}</CardTitle>
                </CardHeader>
                <CardContent>
                  {loadingReports ? (
                    <div className="space-y-2">
                      {[...Array(5)].map((_, i) => (
                        <Skeleton key={i} className="h-16 w-full" />
                      ))}
                    </div>
                  ) : reports?.data?.length ? (
                    <div className="space-y-2">
                      {reports.data.map((report) => (
                        <button
                          key={report.id}
                          className={cn(
                            'w-full p-3 rounded-lg border hover:bg-muted text-start',
                            selectedReportId === report.id && 'border-primary bg-muted',
                          )}
                          onClick={() => setSelectedReportId(report.id)}
                        >
                          <p className="font-medium truncate">
                            {isRTL ? report.title_ar : report.title_en}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(report.generated_at).toLocaleDateString(
                              isRTL ? 'ar-SA' : 'en-US',
                            )}
                          </p>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center py-8 text-muted-foreground">
                      {t('no_reports', 'No reports generated yet')}
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Report View */}
            <div className="lg:col-span-2">
              <InfluenceReportView
                report={selectedReport}
                isLoading={loadingReport}
                onPrint={() => window.print()}
              />
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Detail Sheet */}
      <Sheet open={detailsSheetOpen} onOpenChange={setDetailsSheetOpen}>
        <SheetContent
          side={isRTL ? 'left' : 'right'}
          className="w-full sm:max-w-md overflow-y-auto"
        >
          <SheetHeader>
            <SheetTitle>{t('stakeholder_details', 'Stakeholder Details')}</SheetTitle>
            <SheetDescription>
              {t('metrics_desc', 'Influence metrics and network position')}
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6">
            <InfluenceMetricsPanel data={selectedDetail} isLoading={loadingDetail} />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}

export default StakeholderInfluencePage
