// T083: RelationshipGraphPage - Full-page Graph Visualization
// User Story 3: Traverse Entity Relationships as Graph
// Main page for exploring dossier relationships with graph and list views
// Enhanced with clustering, focus mode, and complexity controls to prevent graph overwhelm
import { lazy, Suspense, useState, useMemo, type ReactElement } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { Link, getRouteApi, useNavigate } from '@tanstack/react-router'
import { getDossierDetailPath } from '@/lib/dossier-routes'
import { Card, CardContent } from '@/components/ui/card'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import type {
  NodeData as GraphNodeData,
  EdgeData as GraphEdgeData,
} from '@/components/relationships/AdvancedGraphVisualization'
import { RelationshipNavigator } from '@/components/relationships/RelationshipNavigator'
import { AnalyticQueryPicker } from '@/components/relationships/AnalyticQueryPicker'
import {
  AnalyticResultView,
  type AnalyticResult,
} from '@/components/relationships/AnalyticResultView'
import { useAnalyticGraph, type AnalyticQueryType } from '@/hooks/useAnalyticGraph'
import { Network, List, AlertCircle, Settings, Sparkles, Layers, Rocket } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { DossierRelationshipType } from '@/types/relationship.types'

const routeApi = getRouteApi('/_protected/relationships/graph')

const GraphVisualization = lazy(() =>
  import('@/components/relationships/GraphVisualization').then((module) => ({
    default: module.GraphVisualization,
  })),
)

const EnhancedGraphVisualization = lazy(() =>
  import('@/components/relationships/EnhancedGraphVisualization').then((module) => ({
    default: module.EnhancedGraphVisualization,
  })),
)

const AdvancedGraphVisualization = lazy(() =>
  import('@/components/relationships/AdvancedGraphVisualization').then((module) => ({
    default: module.AdvancedGraphVisualization,
  })),
)

function GraphVisualizationFallback(): ReactElement {
  return (
    <Card>
      <CardContent className="pt-6">
        <Skeleton className="h-[600px] w-full" />
      </CardContent>
    </Card>
  )
}

const RELATIONSHIP_TYPES: DossierRelationshipType[] = [
  'member_of',
  'participates_in',
  'cooperates_with',
  'bilateral_relation',
  'partnership',
  'parent_of',
  'subsidiary_of',
  'related_to',
  'represents',
  'hosted_by',
  'sponsored_by',
  'involves',
  'discusses',
  'participant_in',
  'observer_of',
  'affiliate_of',
  'successor_of',
  'predecessor_of',
]

type RelationshipTypeFilter = DossierRelationshipType | 'all'

// Graph data interface
interface GraphData {
  start_dossier_id: string
  start_dossier: {
    id: string
    type: string
    name_en: string
    name_ar: string
    status: string
  }
  max_degrees: number
  relationship_type_filter: string
  nodes: Array<{
    id: string
    type: string
    name_en: string
    name_ar: string
    status: string
    degree: number
    path: string[]
  }>
  edges: Array<{
    source_id: string
    target_id: string
    relationship_type: string
  }>
  stats: {
    node_count: number
    edge_count: number
    max_degree: number
    query_time_ms: number
    performance_warning: string | null
  }
}

// Fetch graph data from Edge Function
async function fetchGraphData(
  startDossierId: string,
  maxDegrees: number,
  relationshipType?: RelationshipTypeFilter,
): Promise<GraphData> {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) {
    throw new Error('Not authenticated')
  }

  const params = new URLSearchParams({
    startDossierId,
    maxDegrees: maxDegrees.toString(),
  })

  if (relationshipType && relationshipType !== 'all') {
    params.append('relationshipType', relationshipType)
  }

  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/graph-traversal?${params}`,
    {
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    },
  )

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to fetch graph data')
  }

  return response.json()
}

export function RelationshipGraphPage() {
  const { t } = useTranslation('graph')
  const navigate = useNavigate()
  const {
    dossierId: startDossierId,
    mode,
    query: analyticQuery,
    entity2,
    windowDays,
  } = routeApi.useSearch()

  const isAnalyze = mode === 'analyze'

  // State
  const [maxDegrees, setMaxDegrees] = useState(2)
  const [relationshipType, setRelationshipType] = useState<RelationshipTypeFilter>('all')
  const [activeTab, setActiveTab] = useState<'graph' | 'list'>('graph')
  // The Analyze result defaults to the structured (List) view per D-03.
  const [analyticTab, setAnalyticTab] = useState<'graph' | 'list'>('list')
  const [graphMode, setGraphMode] = useState<'basic' | 'enhanced' | 'advanced'>('advanced') // Default to advanced for new features

  // Fetch graph data
  const {
    data: graphData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['graph-traversal', startDossierId, maxDegrees, relationshipType],
    queryFn: () => fetchGraphData(startDossierId!, maxDegrees, relationshipType),
    enabled: !!startDossierId,
    staleTime: 30000, // Cache for 30 seconds
  })

  // Deduplicate nodes - the start_dossier might already be in graphData.nodes
  const deduplicatedNodes = useMemo(() => {
    if (!graphData) return []

    const nodeMap = new Map<string, (typeof graphData.nodes)[0]>()

    // Add start dossier first with degree 0
    nodeMap.set(graphData.start_dossier.id, {
      ...graphData.start_dossier,
      degree: 0,
      path: [],
    })

    // Add other nodes (won't overwrite start_dossier if it exists)
    graphData.nodes.forEach((node) => {
      if (!nodeMap.has(node.id)) {
        nodeMap.set(node.id, node)
      }
    })

    return Array.from(nodeMap.values())
  }, [graphData])

  const handleNodeSelect = (nodeId: string) => {
    // Navigate to the type-aware dossier detail route (R17-02). The old target
    // '/dossiers/$id' is not a mounted route — only '/dossiers/<segment>/$id'
    // exists per type — so a node click 404'd/dead-ended. Resolve the clicked
    // node's type and build the correct path via getDossierDetailPath. Analytic
    // results are not in the degrees-traversal set, so fall back to them.
    const node =
      deduplicatedNodes.find((n) => n.id === nodeId) ??
      analyticGraphNodes.find((n) => n.id === nodeId)
    const path = getDossierDetailPath(nodeId, node?.type)
    navigate({ to: path as '/dossiers' })
  }

  const handleRefresh = () => {
    refetch()
  }

  // ── Analyze mode (GRAPH-01 / D-04) ──────────────────────────────────────────
  // URL-as-state: the active query + its params live in the route search so the
  // experience is deep-linkable (the Cmd+K "Analyze:" entries navigate here).
  const {
    data: analyticData,
    isLoading: analyticLoading,
    isError: analyticError,
  } = useAnalyticGraph({
    queryType: (analyticQuery as AnalyticQueryType) ?? 'forum_membership',
    entityId: isAnalyze ? startDossierId : undefined,
    entityId2: entity2,
    windowDays,
  })

  const handleRunAnalysis = ({
    queryType,
    entityId,
    entityId2,
    windowDays: nextWindowDays,
  }: {
    queryType: AnalyticQueryType
    entityId: string
    entityId2?: string
    windowDays?: number
  }): void => {
    navigate({
      to: '/relationships/graph',
      search: {
        dossierId: entityId,
        mode: 'analyze',
        query: queryType,
        entity2: entityId2,
        windowDays: nextWindowDays,
      },
    })
  }

  // Compose the structured result for the view: the edge fn returns
  // {nodes, edges, stats}; the active query type + path fields key the render.
  const analyticResult: AnalyticResult | undefined =
    analyticData != null
      ? {
          query_type: (analyticQuery as AnalyticQueryType) ?? 'forum_membership',
          nodes: analyticData.nodes,
          edges: analyticData.edges,
          path: analyticData.path,
          relationship_path: analyticData.relationship_path,
          path_length: analyticData.path_length,
        }
      : undefined

  // Map the analytic nodes/edges onto the shape AdvancedGraphVisualization expects
  // (Graph view of the result — D-03). Reused for type-aware node navigation too.
  const analyticGraphNodes: GraphNodeData[] = useMemo(
    () =>
      (analyticData?.nodes ?? []).map((node) => ({
        id: node.id,
        type: node.type ?? 'dossier',
        name_en: node.name_en ?? node.id,
        name_ar: node.name_ar ?? node.name_en ?? node.id,
        status: node.status ?? 'active',
        degree: 0,
      })),
    [analyticData],
  )

  const analyticGraphEdges: GraphEdgeData[] = useMemo(
    () =>
      (analyticData?.edges ?? []).map((edge) => ({
        source_id: edge.source_id,
        target_id: edge.target_id,
        relationship_type: edge.relationship_type ?? 'related_to',
      })),
    [analyticData],
  )

  if (!startDossierId && !isAnalyze) {
    return (
      <div className="space-y-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {t(
              'noDossier',
              'No dossier selected. Please select a dossier to view its relationship graph.',
            )}
          </AlertDescription>
        </Alert>
        <Button variant="outline" asChild>
          <Link to="/dossiers">{t('browseDossiers', 'Browse dossiers')}</Link>
        </Button>
      </div>
    )
  }

  // ── Analyze mode render (D-04 surfacing: same panel, not a new route) ───────
  if (isAnalyze) {
    const hasAnalyticStats = analyticData != null
    return (
      <div className="space-y-6">
        <PageHeader
          icon={<Sparkles className="h-6 w-6" />}
          title={t('analyze.mode', 'Analyze')}
          subtitle={t('description', 'Explore connections between entities')}
        />

        {/* Query picker — primary entity pre-filled from the dossier anchor (D-02) */}
        <AnalyticQueryPicker defaultEntityId={startDossierId} onRun={handleRunAnalysis} />

        {/* Stats strip — reuse the complexity badge + perf warning (RF-8) */}
        {hasAnalyticStats && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-4">
                <Layers className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">{t('complexity.label', 'Complexity')}:</span>
                <Badge
                  variant={
                    analyticData.stats.node_count > 50
                      ? 'destructive'
                      : analyticData.stats.node_count > 20
                        ? 'secondary'
                        : 'outline'
                  }
                >
                  {analyticData.stats.node_count > 50
                    ? t('complexity.complex', 'Complex')
                    : analyticData.stats.node_count > 20
                      ? t('complexity.moderate', 'Moderate')
                      : t('complexity.simple', 'Simple')}
                </Badge>
              </div>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold">{analyticData.stats.node_count}</div>
                  <div className="text-xs text-muted-foreground">{t('nodes', 'Entities')}</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">{analyticData.stats.edge_count}</div>
                  <div className="text-xs text-muted-foreground">{t('edges', 'Relationships')}</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">{analyticData.stats.query_time_ms}ms</div>
                  <div className="text-xs text-muted-foreground">
                    {t('queryTime', 'Query time')}
                  </div>
                </div>
              </div>
              {analyticData.stats.performance_warning != null && (
                <Alert variant="destructive" className="mt-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{analyticData.stats.performance_warning}</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        )}

        {/* Result region — structured (List) is the default; Graph view is secondary */}
        <Tabs value={analyticTab} onValueChange={(v) => setAnalyticTab(v as 'graph' | 'list')}>
          <TabsList className="mb-4">
            <TabsTrigger value="list" className="gap-2">
              <List className="h-4 w-4" />
              {t('analyze.listView', 'List view')}
            </TabsTrigger>
            <TabsTrigger value="graph" className="gap-2">
              <Network className="h-4 w-4" />
              {t('analyze.graphView', 'Graph view')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="list">
            <AnalyticResultView
              result={analyticResult}
              isLoading={analyticLoading}
              isError={analyticError}
              onNodeSelect={handleNodeSelect}
            />
          </TabsContent>

          <TabsContent value="graph">
            {analyticGraphNodes.length > 0 ? (
              <Suspense fallback={<GraphVisualizationFallback />}>
                <AdvancedGraphVisualization
                  nodes={analyticGraphNodes}
                  edges={analyticGraphEdges}
                  onNodeClick={handleNodeSelect}
                  height="calc(100vh - 500px)"
                  showMiniMap
                  centerNodeId={startDossierId}
                />
              </Suspense>
            ) : (
              <AnalyticResultView
                result={analyticResult}
                isLoading={analyticLoading}
                isError={analyticError}
              />
            )}
          </TabsContent>
        </Tabs>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<Network className="h-6 w-6" />}
        title={t('title', 'Relationship graph')}
        subtitle={t('description', 'Explore connections between entities')}
      />

      {/* Controls */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="maxDegrees" className="mb-2 block">
                {t('maxDegrees', 'Degrees of separation')}
              </Label>
              <Select
                value={maxDegrees.toString()}
                onValueChange={(value) => setMaxDegrees(parseInt(value))}
              >
                <SelectTrigger id="maxDegrees">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1° {t('degree', 'degree')}</SelectItem>
                  <SelectItem value="2">2° {t('degrees', 'degrees')}</SelectItem>
                  <SelectItem value="3">3° {t('degrees', 'degrees')}</SelectItem>
                  <SelectItem value="4">4° {t('degrees', 'degrees')}</SelectItem>
                  <SelectItem value="5">5° {t('degrees', 'degrees')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="relationshipType" className="mb-2 block">
                {t('relationshipType', 'Relationship type')}
              </Label>
              <Select
                value={relationshipType}
                onValueChange={(value) => setRelationshipType(value as RelationshipTypeFilter)}
              >
                <SelectTrigger id="relationshipType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('allTypes', 'All types')}</SelectItem>
                  {RELATIONSHIP_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {t(`relationship.${type}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button onClick={handleRefresh} variant="outline" className="w-full">
                <Settings className="h-4 w-4 me-2" />
                {t('refresh', 'Refresh')}
              </Button>
            </div>
          </div>

          {/* Stats */}
          {graphData && (
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                {/* Complexity Indicator */}
                <div className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">
                    {t('complexity.label', 'Complexity')}:
                  </span>
                  <Badge
                    variant={
                      graphData.stats.node_count > 50
                        ? 'destructive'
                        : graphData.stats.node_count > 20
                          ? 'secondary'
                          : 'outline'
                    }
                  >
                    {graphData.stats.node_count > 50
                      ? t('complexity.complex', 'Complex')
                      : graphData.stats.node_count > 20
                        ? t('complexity.moderate', 'Moderate')
                        : t('complexity.simple', 'Simple')}
                  </Badge>
                  {graphData.stats.node_count > 20 && (
                    <span className="text-xs text-muted-foreground">
                      {t('complexity.tip', 'Use clustered layout for complex graphs')}
                    </span>
                  )}
                </div>

                {/* Graph Mode Selector */}
                <div className="flex items-center gap-2">
                  <Select
                    value={graphMode}
                    onValueChange={(v) => setGraphMode(v as 'basic' | 'enhanced' | 'advanced')}
                  >
                    <SelectTrigger className="h-8 w-[140px] text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="basic" className="text-xs">
                        <div className="flex items-center gap-2">
                          <Network className="h-3 w-3" />
                          {t('basicMode', 'Basic')}
                        </div>
                      </SelectItem>
                      <SelectItem value="enhanced" className="text-xs">
                        <div className="flex items-center gap-2">
                          <Sparkles className="h-3 w-3" />
                          {t('enhancedMode', 'Enhanced')}
                        </div>
                      </SelectItem>
                      <SelectItem value="advanced" className="text-xs">
                        <div className="flex items-center gap-2">
                          <Rocket className="h-3 w-3" />
                          {t('advancedMode', 'Advanced')}
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold">{graphData.stats.node_count}</div>
                  <div className="text-xs text-muted-foreground">{t('nodes', 'Entities')}</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">{graphData.stats.edge_count}</div>
                  <div className="text-xs text-muted-foreground">{t('edges', 'Relationships')}</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">{graphData.stats.max_degree}°</div>
                  <div className="text-xs text-muted-foreground">
                    {t('maxDegree', 'Max degree')}
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-bold">{graphData.stats.query_time_ms}ms</div>
                  <div className="text-xs text-muted-foreground">
                    {t('queryTime', 'Query time')}
                  </div>
                </div>
              </div>

              {graphData.stats.performance_warning && (
                <Alert variant="destructive" className="mt-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{graphData.stats.performance_warning}</AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Error State */}
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {t('error', 'Failed to load graph data')}: {(error as Error).message}
          </AlertDescription>
        </Alert>
      )}

      {/* Loading State */}
      {isLoading && (
        <Card>
          <CardContent className="pt-6">
            <Skeleton className="h-[600px] w-full" />
          </CardContent>
        </Card>
      )}

      {/* Graph Visualization */}
      {graphData && (
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'graph' | 'list')}>
          <TabsList className="mb-4">
            <TabsTrigger value="graph" className="gap-2">
              <Network className="h-4 w-4" />
              {t('graphView', 'Graph view')}
            </TabsTrigger>
            <TabsTrigger value="list" className="gap-2">
              <List className="h-4 w-4" />
              {t('listView', 'List view')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="graph">
            <Suspense fallback={<GraphVisualizationFallback />}>
              {graphMode === 'advanced' ? (
                <AdvancedGraphVisualization
                  nodes={deduplicatedNodes}
                  edges={graphData.edges}
                  onNodeClick={handleNodeSelect}
                  height="calc(100vh - 500px)"
                  showMiniMap
                  centerNodeId={startDossierId}
                />
              ) : graphMode === 'enhanced' ? (
                <EnhancedGraphVisualization
                  nodes={deduplicatedNodes}
                  edges={graphData.edges}
                  onNodeClick={handleNodeSelect}
                  height="calc(100vh - 500px)"
                  showMiniMap
                  centerNodeId={startDossierId}
                />
              ) : (
                <GraphVisualization
                  nodes={deduplicatedNodes}
                  edges={graphData.edges}
                  onNodeClick={handleNodeSelect}
                  height="calc(100vh - 500px)"
                  showMiniMap
                  showControls
                />
              )}
            </Suspense>
          </TabsContent>

          <TabsContent value="list">
            <RelationshipNavigator
              nodes={deduplicatedNodes}
              startDossierId={startDossierId}
              onNodeSelect={handleNodeSelect}
            />
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
