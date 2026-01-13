/**
 * Citation Network Graph Component
 * Feature: citation-tracking
 *
 * Interactive network visualization of citations using React Flow.
 * Shows citation relationships between dossiers, briefs, and external sources.
 * Mobile-first with touch gestures and RTL support.
 */

import { useMemo, memo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import ReactFlow, {
  Node,
  Edge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  NodeTypes,
  Handle,
  Position,
} from 'reactflow'
import 'reactflow/dist/style.css'
import { forceSimulation, forceLink, forceManyBody, forceCenter, forceCollide } from 'd3-force'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Slider } from '@/components/ui/slider'
import { Skeleton } from '@/components/ui/skeleton'
import {
  FolderOpen,
  FileText,
  File,
  MessageSquare,
  FileCheck,
  Calendar,
  ExternalLink,
  GraduationCap,
  Newspaper,
  Building,
  BarChart,
  Link,
  ZoomIn,
  ZoomOut,
  Maximize2,
} from 'lucide-react'
import { useCitationNetwork } from '@/hooks/useCitations'
import type {
  CitationNetworkGraph as CitationNetworkGraphType,
  CitationNetworkNode,
  CitationNetworkEdge,
  CitationSourceType,
  CitationNetworkParams,
} from '@/types/citation.types'
import { CITATION_SOURCE_TYPE_LABELS } from '@/types/citation.types'

// ============================================================================
// Props
// ============================================================================

interface CitationNetworkGraphProps {
  entityType: CitationSourceType
  entityId: string
  depth?: number
  maxNodes?: number
  className?: string
  height?: string
  onNodeClick?: (nodeId: string, nodeType: CitationSourceType) => void
}

// ============================================================================
// Node Icons
// ============================================================================

const getNodeIcon = (type: CitationSourceType, size = 16) => {
  const iconProps = { size, className: 'flex-shrink-0' }

  switch (type) {
    case 'dossier':
      return <FolderOpen {...iconProps} />
    case 'brief':
    case 'ai_brief':
      return <FileText {...iconProps} />
    case 'document':
      return <File {...iconProps} />
    case 'position':
      return <MessageSquare {...iconProps} />
    case 'mou':
      return <FileCheck {...iconProps} />
    case 'engagement':
      return <Calendar {...iconProps} />
    case 'external_url':
      return <ExternalLink {...iconProps} />
    case 'external_document':
      return <File {...iconProps} />
    case 'academic_paper':
      return <GraduationCap {...iconProps} />
    case 'news_article':
      return <Newspaper {...iconProps} />
    case 'government_doc':
      return <Building {...iconProps} />
    case 'report':
      return <BarChart {...iconProps} />
    default:
      return <Link {...iconProps} />
  }
}

// Node color based on type
const getNodeColor = (type: CitationSourceType, isStart: boolean): string => {
  if (isStart) return 'border-primary bg-primary/10'

  switch (type) {
    case 'dossier':
      return 'border-blue-500 bg-blue-50 dark:bg-blue-950'
    case 'brief':
    case 'ai_brief':
      return 'border-purple-500 bg-purple-50 dark:bg-purple-950'
    case 'document':
      return 'border-gray-500 bg-gray-50 dark:bg-gray-950'
    case 'position':
      return 'border-orange-500 bg-orange-50 dark:bg-orange-950'
    case 'mou':
      return 'border-green-500 bg-green-50 dark:bg-green-950'
    case 'engagement':
      return 'border-cyan-500 bg-cyan-50 dark:bg-cyan-950'
    case 'external_url':
    case 'external_document':
    case 'academic_paper':
    case 'news_article':
    case 'government_doc':
    case 'report':
      return 'border-amber-500 bg-amber-50 dark:bg-amber-950'
    default:
      return 'border-muted bg-muted/50'
  }
}

// ============================================================================
// Custom Node Component
// ============================================================================

interface CitationNodeData {
  label: string
  labelAr?: string
  type: CitationSourceType
  depth: number
  isStart: boolean
}

const CitationNode = memo(({ data, selected }: { data: CitationNodeData; selected?: boolean }) => {
  const { i18n } = useTranslation()
  const isRTL = i18n.language === 'ar'
  const label = isRTL && data.labelAr ? data.labelAr : data.label
  const typeLabel = CITATION_SOURCE_TYPE_LABELS[data.type]?.[isRTL ? 'ar' : 'en'] || data.type

  return (
    <>
      <Handle type="target" position={isRTL ? Position.Right : Position.Left} />
      <div
        className={`
          min-w-[100px] max-w-[200px] rounded-lg border-2 px-3 py-2
          shadow-md transition-all
          ${getNodeColor(data.type, data.isStart)}
          ${selected ? 'ring-2 ring-primary ring-offset-2' : ''}
          ${data.isStart ? 'border-primary shadow-lg' : ''}
        `}
      >
        <div className="flex items-start gap-2">
          {getNodeIcon(data.type)}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-foreground truncate">{label}</p>
            <Badge variant="outline" className="text-xs mt-1 px-1 py-0">
              {typeLabel}
            </Badge>
          </div>
        </div>
        {data.depth > 0 && (
          <div className="absolute -top-1 -end-1 h-5 w-5 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
            {data.depth}
          </div>
        )}
      </div>
      <Handle type="source" position={isRTL ? Position.Left : Position.Right} />
    </>
  )
})
CitationNode.displayName = 'CitationNode'

const nodeTypes: NodeTypes = {
  citation: CitationNode,
}

// ============================================================================
// Main Component
// ============================================================================

export function CitationNetworkGraph({
  entityType,
  entityId,
  depth = 2,
  maxNodes = 50,
  className = '',
  height = '500px',
  onNodeClick,
}: CitationNetworkGraphProps) {
  const { t, i18n } = useTranslation('citations')
  const isRTL = i18n.language === 'ar'

  // Fetch network data
  const {
    data: networkData,
    isLoading,
    error,
  } = useCitationNetwork(
    { entity_type: entityType, entity_id: entityId, depth, max_nodes: maxNodes },
    true,
  )

  // Generate React Flow nodes and edges
  const { initialNodes, initialEdges } = useMemo(() => {
    if (!networkData || !networkData.nodes || networkData.nodes.length === 0) {
      return { initialNodes: [], initialEdges: [] }
    }

    // Create nodes
    const nodes: Node[] = networkData.nodes.map((node) => ({
      id: node.id,
      type: 'citation',
      position: { x: 0, y: 0 }, // Will be calculated by d3-force
      data: {
        label: node.name || node.id.slice(0, 8),
        labelAr: node.name_ar,
        type: node.type,
        depth: node.depth,
        isStart: node.id === entityId,
      } as CitationNodeData,
    }))

    // Create edges
    const edges: Edge[] = (networkData.edges || []).map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      type: 'default',
      animated: edge.relevance_score && edge.relevance_score > 0.7,
      style: {
        stroke:
          edge.relevance_score && edge.relevance_score > 0.7
            ? 'hsl(var(--primary))'
            : 'hsl(var(--muted-foreground))',
        strokeWidth: Math.max(1, (edge.relevance_score || 0.5) * 3),
      },
      markerEnd: {
        type: 'arrowclosed' as const,
        color:
          edge.relevance_score && edge.relevance_score > 0.7
            ? 'hsl(var(--primary))'
            : 'hsl(var(--muted-foreground))',
      },
    }))

    // Apply d3-force layout
    if (nodes.length > 0) {
      const simulation = forceSimulation(nodes as any)
        .force(
          'link',
          forceLink(edges)
            .id((d: any) => d.id)
            .distance(150),
        )
        .force('charge', forceManyBody().strength(-400))
        .force('center', forceCenter(400, 300))
        .force('collide', forceCollide(100))
        .stop()

      // Run simulation
      for (let i = 0; i < 300; i++) simulation.tick()

      // Apply RTL position mirroring if needed
      if (isRTL) {
        nodes.forEach((node) => {
          node.position.x = 800 - node.position.x
        })
      }
    }

    return { initialNodes: nodes, initialEdges: edges }
  }, [networkData, entityId, isRTL])

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)

  // Update nodes/edges when data changes
  useMemo(() => {
    setNodes(initialNodes)
    setEdges(initialEdges)
  }, [initialNodes, initialEdges, setNodes, setEdges])

  // Handle node click
  const handleNodeClick = useCallback(
    (event: React.MouseEvent, node: Node) => {
      if (onNodeClick) {
        const nodeData = node.data as CitationNodeData
        onNodeClick(node.id, nodeData.type)
      }
    },
    [onNodeClick],
  )

  // Loading state
  if (isLoading) {
    return (
      <div className={`${className}`} style={{ height }}>
        <Skeleton className="w-full h-full rounded-lg" />
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-12">
          <p className="text-sm text-destructive">
            {t('network.error', 'Failed to load citation network')}
          </p>
        </CardContent>
      </Card>
    )
  }

  // Empty state
  if (!networkData || !networkData.nodes || networkData.nodes.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Link className="h-8 w-8 text-primary" />
          </div>
          <p className="text-sm text-muted-foreground text-center">
            {t('network.empty', 'No citations found for this entity')}
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={`border rounded-lg overflow-hidden ${className}`} style={{ height }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        nodeTypes={nodeTypes}
        fitView
        attributionPosition={isRTL ? 'top-left' : 'top-right'}
        minZoom={0.1}
        maxZoom={2}
        defaultEdgeOptions={{
          type: 'default',
        }}
        onlyRenderVisibleElements={nodes.length > 20}
      >
        <Background color="hsl(var(--muted-foreground))" gap={20} />
        <Controls position={isRTL ? 'top-left' : 'top-right'} showInteractive={false} />
        <MiniMap
          position={isRTL ? 'bottom-right' : 'bottom-left'}
          nodeColor={(node) => {
            const data = node.data as CitationNodeData
            if (data.isStart) return 'hsl(var(--primary))'
            return 'hsl(var(--muted))'
          }}
          maskColor="hsl(var(--background) / 0.7)"
          className="!bg-card"
        />
      </ReactFlow>

      {/* Legend */}
      <div
        className="absolute bottom-4 end-4 bg-card/90 backdrop-blur-sm rounded-lg p-3 border shadow-sm"
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <p className="text-xs font-medium mb-2">{t('network.legend', 'Legend')}</p>
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs">
            <div className="w-3 h-3 rounded border-2 border-primary bg-primary/10" />
            <span>{t('network.startNode', 'Current Entity')}</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="w-3 h-3 rounded border-2 border-blue-500 bg-blue-50 dark:bg-blue-950" />
            <span>{t('network.internal', 'Internal Reference')}</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="w-3 h-3 rounded border-2 border-amber-500 bg-amber-50 dark:bg-amber-950" />
            <span>{t('network.external', 'External Source')}</span>
          </div>
        </div>
      </div>

      {/* Stats badge */}
      <div className="absolute top-4 start-4 bg-card/90 backdrop-blur-sm rounded-lg px-3 py-2 border shadow-sm">
        <p className="text-xs text-muted-foreground">
          {t('network.stats', '{{nodes}} nodes, {{edges}} connections', {
            nodes: networkData.total_nodes || nodes.length,
            edges: edges.length,
          })}
        </p>
      </div>
    </div>
  )
}

export default CitationNetworkGraph
