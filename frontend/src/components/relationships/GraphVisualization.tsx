// T081: GraphVisualization Component for Network Graph Display
// User Story 3: Traverse Entity Relationships as Graph
// T085: Added graph visualization controls (zoom, filter by type)
// T086: Implemented memoization for expensive graph rendering
// Visualizes dossier relationships as interactive network graph using React Flow
import { useCallback, useMemo, useState, memo } from 'react'
import { useTranslation } from 'react-i18next'
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  BackgroundVariant,
  MiniMap,
  useNodesState,
  useEdgesState,
  ConnectionMode,
  Panel,
  NodeTypes,
  useReactFlow,
  ReactFlowProvider,
} from 'reactflow'
import 'reactflow/dist/style.css'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ZoomIn, ZoomOut, Maximize2, Filter } from 'lucide-react'

// Node data structure
interface NodeData {
  id: string
  type: string
  name_en: string
  name_ar: string
  status: string
  degree: number
}

// Props interface
interface GraphVisualizationProps {
  nodes: NodeData[]
  edges: Array<{
    source_id: string
    target_id: string
    relationship_type: string
  }>
  onNodeClick?: (nodeId: string) => void
  height?: string
  showMiniMap?: boolean
  showControls?: boolean
  enableTypeFilter?: boolean // T085: Enable node type filtering
  enableRelationshipFilter?: boolean // T085: Enable relationship type filtering
}

// T086: Memoized custom node component to prevent unnecessary re-renders
const DossierNode = memo(({ data }: { data: NodeData }) => {
  const { i18n } = useTranslation()
  const isRTL = i18n.language === 'ar'
  const name = isRTL ? data.name_ar : data.name_en

  return (
    <Card className="min-w-[200px] px-4 py-3 border-2 shadow-md">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-semibold truncate">{name}</span>
          {data.degree > 0 && (
            <Badge variant="outline" className="text-xs shrink-0">
              {data.degree}°
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">
            {data.type}
          </Badge>
          <Badge variant={data.status === 'active' ? 'default' : 'outline'} className="text-xs">
            {data.status}
          </Badge>
        </div>
      </div>
    </Card>
  )
})

// Node types configuration - defined outside component to prevent re-creation warnings
const customNodeTypes: NodeTypes = {
  dossier: DossierNode,
}

// Node color mapping by type
const getNodeColor = (type: string): string => {
  const colorMap: Record<string, string> = {
    country: '#3b82f6', // blue
    organization: '#8b5cf6', // purple
    individual: '#10b981', // green
    forum: '#f59e0b', // amber
    engagement: '#ec4899', // pink
    mou: '#14b8a6', // teal
    position: '#6366f1', // indigo
  }
  return colorMap[type] || '#6b7280' // default gray
}

// Edge color by relationship type
const getEdgeColor = (relationshipType: string): string => {
  const colorMap: Record<string, string> = {
    member_of: '#3b82f6',
    partner: '#10b981',
    parent_org: '#8b5cf6',
    hosted_by: '#f59e0b',
    participant: '#ec4899',
    signatory: '#14b8a6',
  }
  return colorMap[relationshipType] || '#9ca3af' // default gray
}

// Inner component for zoom controls - uses useReactFlow() which requires being inside ReactFlow
const ZoomControls = memo(({ isRTL }: { isRTL: boolean }) => {
  const { t } = useTranslation()
  const { zoomIn, zoomOut, fitView } = useReactFlow()

  return (
    <Panel position={isRTL ? 'bottom-right' : 'bottom-left'} className="flex gap-2">
      <Button
        size="sm"
        variant="outline"
        className="h-8 w-8 p-0"
        onClick={() => zoomIn()}
        title={t('graph.zoomIn', 'Zoom In')}
      >
        <ZoomIn className="h-4 w-4" />
      </Button>
      <Button
        size="sm"
        variant="outline"
        className="h-8 w-8 p-0"
        onClick={() => zoomOut()}
        title={t('graph.zoomOut', 'Zoom Out')}
      >
        <ZoomOut className="h-4 w-4" />
      </Button>
      <Button
        size="sm"
        variant="outline"
        className="h-8 w-8 p-0"
        onClick={() => fitView()}
        title={t('graph.fitView', 'Fit View')}
      >
        <Maximize2 className="h-4 w-4" />
      </Button>
    </Panel>
  )
})

function GraphVisualizationInner({
  nodes: rawNodes,
  edges: rawEdges,
  onNodeClick,
  height = '600px',
  showMiniMap = true,
  showControls = true,
  enableTypeFilter = true, // T085: Node type filtering
  enableRelationshipFilter = true, // T085: Relationship type filtering
}: GraphVisualizationProps) {
  const { t, i18n } = useTranslation()
  const isRTL = i18n.language === 'ar'

  // T085: Filter state for node types and relationship types
  const [selectedNodeType, setSelectedNodeType] = useState<string>('all')
  const [selectedRelationshipType, setSelectedRelationshipType] = useState<string>('all')

  // T085: Extract unique node types and relationship types
  const availableNodeTypes = useMemo(() => {
    const types = new Set(rawNodes.map((n) => n.type))
    return ['all', ...Array.from(types)]
  }, [rawNodes])

  const relationshipTypes = useMemo(() => {
    const types = new Set(rawEdges.map((e) => e.relationship_type))
    return ['all', ...Array.from(types)]
  }, [rawEdges])

  // T086: Memoized filtered nodes based on selected type
  const filteredNodes = useMemo(() => {
    if (selectedNodeType === 'all') return rawNodes
    return rawNodes.filter((node) => node.type === selectedNodeType)
  }, [rawNodes, selectedNodeType])

  // T086: Memoized filtered edges based on selected relationship type and visible nodes
  const filteredEdges = useMemo(() => {
    const nodeIds = new Set(filteredNodes.map((n) => n.id))
    let edges = rawEdges.filter(
      (edge) => nodeIds.has(edge.source_id) && nodeIds.has(edge.target_id),
    )

    if (selectedRelationshipType !== 'all') {
      edges = edges.filter((edge) => edge.relationship_type === selectedRelationshipType)
    }

    return edges
  }, [rawEdges, filteredNodes, selectedRelationshipType])

  // T086: Transform nodes to React Flow format with memoization
  const nodes: Node[] = useMemo(() => {
    return filteredNodes.map((node, index) => {
      const angle = (index / filteredNodes.length) * 2 * Math.PI
      const radius = 250

      return {
        id: node.id,
        type: 'dossier',
        data: node,
        position: {
          x: 400 + radius * Math.cos(angle),
          y: 300 + radius * Math.sin(angle),
        },
        style: {
          borderColor: getNodeColor(node.type),
          borderWidth: node.degree === 0 ? 3 : 2,
        },
      }
    })
  }, [filteredNodes])

  // T086: Transform edges to React Flow format with memoization
  const edges: Edge[] = useMemo(() => {
    return filteredEdges.map((edge, index) => ({
      id: `edge-${index}`,
      source: edge.source_id,
      target: edge.target_id,
      type: 'smoothstep',
      animated: false,
      label: edge.relationship_type.replace(/_/g, ' '),
      style: {
        stroke: getEdgeColor(edge.relationship_type),
        strokeWidth: 2,
      },
      labelStyle: {
        fontSize: 12,
        fontWeight: 500,
      },
    }))
  }, [filteredEdges])

  const [reactFlowNodes, , onNodesChange] = useNodesState(nodes)
  const [reactFlowEdges, , onEdgesChange] = useEdgesState(edges)

  const handleNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      if (onNodeClick) {
        onNodeClick(node.id)
      }
    },
    [onNodeClick],
  )

  return (
    <div
      className="relative w-full rounded-lg border bg-background"
      style={{ height }}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <ReactFlow
        nodes={reactFlowNodes}
        edges={reactFlowEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        nodeTypes={customNodeTypes}
        connectionMode={ConnectionMode.Loose}
        fitView
        attributionPosition={isRTL ? 'bottom-left' : 'bottom-right'}
      >
        <Background variant={BackgroundVariant.Dots} gap={16} size={1} />

        {showControls && <Controls position={isRTL ? 'top-left' : 'top-right'} />}

        {showMiniMap && (
          <MiniMap
            position={isRTL ? 'bottom-left' : 'bottom-right'}
            nodeColor={(node) => getNodeColor(node.data?.type || '')}
            nodeBorderRadius={8}
            maskColor="rgba(0, 0, 0, 0.1)"
          />
        )}

        {/* T085: Custom Zoom Controls Panel - uses inner component to access useReactFlow() */}
        <ZoomControls isRTL={isRTL} />

        {/* T085: Filter Controls Panel */}
        {(enableTypeFilter || enableRelationshipFilter) && (
          <Panel
            position={isRTL ? 'top-left' : 'top-right'}
            className="bg-background/95 p-3 rounded-lg border shadow-sm flex flex-col gap-3"
          >
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Filter className="h-4 w-4" />
              <span>{t('graph.filters', 'Filters')}</span>
            </div>

            {enableTypeFilter && (
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-muted-foreground">
                  {t('graph.nodeType', 'Node Type')}
                </label>
                <Select value={selectedNodeType} onValueChange={setSelectedNodeType}>
                  <SelectTrigger className="h-8 w-[160px] text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availableNodeTypes.map((type) => (
                      <SelectItem key={type} value={type} className="text-xs">
                        {type === 'all'
                          ? t('graph.allTypes', 'All Types')
                          : type.replace(/_/g, ' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {enableRelationshipFilter && (
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-muted-foreground">
                  {t('graph.relationshipType', 'Relationship')}
                </label>
                <Select
                  value={selectedRelationshipType}
                  onValueChange={setSelectedRelationshipType}
                >
                  <SelectTrigger className="h-8 w-[160px] text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {relationshipTypes.map((type) => (
                      <SelectItem key={type} value={type} className="text-xs">
                        {type === 'all'
                          ? t('graph.allRelationships', 'All Relationships')
                          : type.replace(/_/g, ' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="text-xs text-muted-foreground pt-1 border-t">
              {filteredNodes.length} {t('graph.nodesShown', 'nodes')} · {filteredEdges.length}{' '}
              {t('graph.edgesShown', 'edges')}
            </div>
          </Panel>
        )}

        <Panel
          position={isRTL ? 'top-right' : 'top-left'}
          className="bg-background/95 p-3 rounded-lg border shadow-sm"
        >
          <div className="flex flex-col gap-2">
            <div className="text-sm font-semibold">{t('graph.legend', 'Legend')}</div>
            <div className="flex flex-col gap-1 text-xs">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full" style={{ backgroundColor: '#3b82f6' }} />
                <span>{t('graph.country', 'Country')}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full" style={{ backgroundColor: '#8b5cf6' }} />
                <span>{t('graph.organization', 'Organization')}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full" style={{ backgroundColor: '#10b981' }} />
                <span>{t('graph.individual', 'Individual')}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full" style={{ backgroundColor: '#f59e0b' }} />
                <span>{t('graph.forum', 'Forum')}</span>
              </div>
            </div>
          </div>
        </Panel>
      </ReactFlow>
    </div>
  )
}

// Wrap with ReactFlowProvider to enable useReactFlow() hooks
export function GraphVisualization(props: GraphVisualizationProps) {
  return (
    <ReactFlowProvider>
      <GraphVisualizationInner {...props} />
    </ReactFlowProvider>
  )
}
