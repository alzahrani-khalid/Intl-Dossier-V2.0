/**
 * Scenario Sandbox Page
 * Feature: Scenario Planning and What-If Analysis
 *
 * Main page for creating and managing what-if scenarios,
 * comparing outcomes, and strategic planning.
 */

import { useState, useMemo } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import {
  Plus,
  Search,
  Filter,
  GitCompare,
  Target,
  Variable,
  TrendingUp,
  TrendingDown,
  Loader2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Checkbox } from '@/components/ui/checkbox'
import { ScenarioCard, ScenarioForm, ScenarioComparison } from '@/components/scenario-sandbox'
import {
  useScenarios,
  useCreateScenario,
  useDeleteScenario,
  useCloneScenario,
  useUpdateScenario,
  useCompareScenarios,
} from '@/hooks/useScenarioSandbox'
import type {
  Scenario,
  ScenarioStatus,
  ScenarioType,
  CreateScenarioRequest,
} from '@/types/scenario-sandbox.types'
import { SCENARIO_TYPE_LABELS, SCENARIO_STATUS_LABELS } from '@/types/scenario-sandbox.types'

export const Route = createFileRoute('/_protected/scenario-sandbox')({
  component: ScenarioSandboxPage,
})

function ScenarioSandboxPage() {
  const { t, i18n } = useTranslation('scenario-sandbox')
  const isRTL = i18n.language === 'ar'

  // State
  const [activeTab, setActiveTab] = useState('scenarios')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<ScenarioStatus | 'all'>('all')
  const [typeFilter, setTypeFilter] = useState<ScenarioType | 'all'>('all')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingScenario, setEditingScenario] = useState<Scenario | undefined>()
  const [selectedForComparison, setSelectedForComparison] = useState<string[]>([])

  // Queries
  const {
    data: scenariosData,
    isLoading,
    isError,
    error,
    refetch,
  } = useScenarios({
    limit: 50,
    status: statusFilter !== 'all' ? statusFilter : undefined,
    type: typeFilter !== 'all' ? typeFilter : undefined,
    search: searchQuery || undefined,
  })

  // Mutations
  const createScenario = useCreateScenario()
  const updateScenario = useUpdateScenario()
  const deleteScenario = useDeleteScenario()
  const cloneScenario = useCloneScenario()

  // Comparison query
  const { data: comparisonData, isLoading: isLoadingComparison } = useCompareScenarios(
    selectedForComparison,
    {
      enabled: selectedForComparison.length >= 2,
    },
  )

  // Filter scenarios for display
  const scenarios = scenariosData?.data || []

  // Stats
  const stats = useMemo(() => {
    return {
      total: scenarios.length,
      active: scenarios.filter((s) => s.status === 'active').length,
      completed: scenarios.filter((s) => s.status === 'completed').length,
      draft: scenarios.filter((s) => s.status === 'draft').length,
    }
  }, [scenarios])

  // Handlers
  const handleCreateScenario = async (data: CreateScenarioRequest) => {
    if (editingScenario) {
      await updateScenario.mutateAsync({ id: editingScenario.id, data })
    } else {
      await createScenario.mutateAsync(data)
    }
    setIsFormOpen(false)
    setEditingScenario(undefined)
  }

  const handleEditScenario = (id: string) => {
    const scenario = scenarios.find((s) => s.id === id)
    if (scenario) {
      setEditingScenario(scenario)
      setIsFormOpen(true)
    }
  }

  const handleDeleteScenario = async (id: string) => {
    await deleteScenario.mutateAsync(id)
    setSelectedForComparison((prev) => prev.filter((sid) => sid !== id))
  }

  const handleCloneScenario = async (id: string) => {
    const scenario = scenarios.find((s) => s.id === id)
    if (scenario) {
      await cloneScenario.mutateAsync({
        id,
        data: {
          new_title_en: `${scenario.title_en} (Copy)`,
          new_title_ar: `${scenario.title_ar} (نسخة)`,
        },
      })
    }
  }

  const handleArchiveScenario = async (id: string) => {
    await updateScenario.mutateAsync({
      id,
      data: { status: 'archived' },
    })
  }

  const handleViewScenario = (id: string) => {
    // Navigate to scenario detail page
    window.location.href = `/scenario-sandbox/${id}`
  }

  const toggleComparisonSelection = (id: string) => {
    setSelectedForComparison((prev) =>
      prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id],
    )
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">{t('title')}</h1>
          <p className="text-muted-foreground mt-1">{t('subtitle')}</p>
        </div>
        <Button onClick={() => setIsFormOpen(true)} className="shrink-0">
          <Plus className="h-4 w-4 me-2" />
          {t('scenario.create')}
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Target className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">{t('tabs.scenarios')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                <Variable className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.active}</p>
                <p className="text-xs text-muted-foreground">{t('scenario.statuses.active')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.completed}</p>
                <p className="text-xs text-muted-foreground">{t('scenario.statuses.completed')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                <TrendingDown className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.draft}</p>
                <p className="text-xs text-muted-foreground">{t('scenario.statuses.draft')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <TabsList>
            <TabsTrigger value="scenarios">{t('tabs.scenarios')}</TabsTrigger>
            <TabsTrigger value="compare">
              {t('tabs.comparisons')}
              {selectedForComparison.length > 0 && (
                <Badge variant="secondary" className="ms-2">
                  {selectedForComparison.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {activeTab === 'scenarios' && (
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative">
                <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t('filters.search')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="ps-9 w-full sm:w-[200px]"
                />
              </div>
              <Select
                value={statusFilter}
                onValueChange={(v) => setStatusFilter(v as ScenarioStatus | 'all')}
              >
                <SelectTrigger className="w-full sm:w-[150px]">
                  <SelectValue placeholder={t('filters.status')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('filters.all')}</SelectItem>
                  {(Object.keys(SCENARIO_STATUS_LABELS) as ScenarioStatus[]).map((status) => (
                    <SelectItem key={status} value={status}>
                      {isRTL
                        ? SCENARIO_STATUS_LABELS[status].ar
                        : SCENARIO_STATUS_LABELS[status].en}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={typeFilter}
                onValueChange={(v) => setTypeFilter(v as ScenarioType | 'all')}
              >
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder={t('filters.type')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('filters.all')}</SelectItem>
                  {(Object.keys(SCENARIO_TYPE_LABELS) as ScenarioType[]).map((type) => (
                    <SelectItem key={type} value={type}>
                      {isRTL ? SCENARIO_TYPE_LABELS[type].ar : SCENARIO_TYPE_LABELS[type].en}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* Scenarios Tab */}
        <TabsContent value="scenarios" className="mt-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : isError ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>{t('errors.loadFailed')}</AlertTitle>
              <AlertDescription>
                {error?.message || 'Unknown error'}
                <Button variant="outline" size="sm" className="ms-4" onClick={() => refetch()}>
                  <RefreshCw className="h-4 w-4 me-2" />
                  Retry
                </Button>
              </AlertDescription>
            </Alert>
          ) : scenarios.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <Target className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-40" />
                  <h3 className="font-semibold text-lg mb-2">{t('empty.title')}</h3>
                  <p className="text-muted-foreground mb-4 max-w-md mx-auto">
                    {t('empty.description')}
                  </p>
                  <Button onClick={() => setIsFormOpen(true)}>
                    <Plus className="h-4 w-4 me-2" />
                    {t('empty.action')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {/* Comparison Selection Bar */}
              {selectedForComparison.length > 0 && (
                <Alert>
                  <GitCompare className="h-4 w-4" />
                  <AlertTitle>{t('comparison.selectScenarios')}</AlertTitle>
                  <AlertDescription className="flex items-center justify-between">
                    <span>
                      {selectedForComparison.length} {t('tabs.scenarios').toLowerCase()}{' '}
                      {t('comparison.comparisons').toLowerCase()}
                    </span>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedForComparison([])}
                      >
                        {t('actions.reset')}
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => setActiveTab('compare')}
                        disabled={selectedForComparison.length < 2}
                      >
                        <GitCompare className="h-4 w-4 me-2" />
                        {t('actions.compare')}
                      </Button>
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {/* Scenarios Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {scenarios.map((scenario) => (
                  <div key={scenario.id} className="relative">
                    <div className="absolute top-3 start-3 z-10">
                      <Checkbox
                        checked={selectedForComparison.includes(scenario.id)}
                        onCheckedChange={() => toggleComparisonSelection(scenario.id)}
                        aria-label="Select for comparison"
                      />
                    </div>
                    <ScenarioCard
                      scenario={scenario}
                      onView={handleViewScenario}
                      onEdit={handleEditScenario}
                      onClone={handleCloneScenario}
                      onArchive={handleArchiveScenario}
                      onDelete={handleDeleteScenario}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        {/* Comparison Tab */}
        <TabsContent value="compare" className="mt-0">
          <ScenarioComparison
            data={comparisonData || { scenarios: [], total_scenarios: 0 }}
            isLoading={isLoadingComparison}
          />
        </TabsContent>
      </Tabs>

      {/* Create/Edit Form Dialog */}
      <ScenarioForm
        open={isFormOpen}
        onOpenChange={(open) => {
          setIsFormOpen(open)
          if (!open) setEditingScenario(undefined)
        }}
        scenario={editingScenario}
        onSubmit={handleCreateScenario}
        isLoading={createScenario.isPending || updateScenario.isPending}
      />
    </div>
  )
}
