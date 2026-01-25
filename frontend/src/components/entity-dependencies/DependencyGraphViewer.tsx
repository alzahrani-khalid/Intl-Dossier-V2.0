/**
 * Dependency Graph Viewer Component
 * Feature: entity-dependency-impact
 *
 * Interactive visualization of entity dependencies using React Flow
 * Mobile-first, RTL-compatible
 */

import { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  ReactFlow,
  Node,
  Edge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Position,
  MarkerType,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Building2,
  Flag,
  Users,
  Briefcase,
  FileText,
  Calendar,
  Globe,
  Target,
  RefreshCw,
  ZoomIn,
  ZoomOut,
  Maximize2,
} from 'lucide-react'

import { useDependencyGraph } from '@/hooks/useEntityDependencies'
import type {
  DependencyGraph,
  DependencyNode,
  DependencyEdge,
} from '@/types/entity-dependency.types'
import { DEPENDENCY_TYPE_LABELS } from '@/types/entity-dependency.types'
import { cn } from '@/lib/utils'

// ============================================================================
// Types
// ============================================================================

interface DependencyGraphViewerProps {
  entityId: string
  entityName?: string
  maxDepth?: number
  includeTransitive?: boolean
  className?: string
  onNodeClick?: (nodeId: string, nodeType: string) => void
}

// ============================================================================
// Entity Type Config
// ============================================================================

const ENTITY_TYPE_CONFIG: Record<
  string,
  { icon: typeof Building2; color: string; bgColor: string }
> = {
  country: {
    icon: Flag,
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
  },
  organization: {
    icon: Building2,
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-50 dark:bg-purple-900/20',
  },
  forum: {
    icon: Globe,
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-50 dark:bg-green-900/20',
  },
  person: {
    icon: Users,
    color: 'text-orange-600 dark:text-orange-400',
    bgColor: 'bg-orange-50 dark:bg-orange-900/20',
  },
  working_group: {
    icon: Briefcase,
    color: 'text-teal-600 dark:text-teal-400',
    bgColor: 'bg-teal-50 dark:bg-teal-900/20',
  },
  commitment: {
    icon: Target,
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-50 dark:bg-red-900/20',
  },
  engagement: {
    icon: Calendar,
    color: 'text-indigo-600 dark:text-indigo-400',
    bgColor: 'bg-indigo-50 dark:bg-indigo-900/20',
  },
  topic: {
    icon: FileText,
    color: 'text-gray-600 dark:text-gray-400',
    bgColor: 'bg-gray-50 dark:bg-gray-900/20',
  },
}

// ============================================================================
// Custom Node Component
// ============================================================================

interface CustomNodeData {
  label: string
  type: string
  isSource: boolean
  dependencyType: string
  depth: number
}

function CustomNode({ data }: { data: CustomNodeData }) {
  const { t, i18n } = useTranslation('entity-dependencies')
  const isRTL = i18n.language === 'ar'
  const config = ENTITY_TYPE_CONFIG[data.type] || ENTITY_TYPE_CONFIG.topic
  const Icon = config.icon

  return (
    <div
      className={cn(
        'px-3 py-2 sm:px-4 sm:py-3 rounded-lg border-2 shadow-md min-w-[120px] sm:min-w-[150px] max-w-[180px] sm:max-w-[220px]',
        'transition-all hover:shadow-lg',
        data.isSource
          ? 'border-primary bg-primary/10'
          : data.depth === 1
            ? 'border-blue-400 bg-white dark:bg-gray-800'
            : 'border-gray-300 bg-gray-50 dark:bg-gray-900',
        config.bgColor,
      )}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <div className="flex items-center gap-2">
        <div className={cn('p-1 rounded', config.color)}>
          <Icon className="h-3 w-3 sm:h-4 sm:w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs sm:text-sm font-medium truncate">{data.label}</p>
          <p className="text-[10px] sm:text-xs text-muted-foreground capitalize">{data.type}</p>
        </div>
      </div>
      {!data.isSource && (
        <Badge
          variant="outline"
          className={cn(
            'mt-1.5 sm:mt-2 text-[10px] sm:text-xs',
            data.depth === 1 ? 'bg-blue-50 dark:bg-blue-900/30' : 'bg-gray-100 dark:bg-gray-800',
          )}
        >
          {isRTL
            ? DEPENDENCY_TYPE_LABELS[data.dependencyType as keyof typeof DEPENDENCY_TYPE_LABELS]?.ar
            : DEPENDENCY_TYPE_LABELS[data.dependencyType as keyof typeof DEPENDENCY_TYPE_LABELS]
                ?.en}
        </Badge>
      )}
    </div>
  )
}

const nodeTypes = { custom: CustomNode }

// ============================================================================
// Transform Functions
// ============================================================================

function transformGraphToReactFlow(
  graph: DependencyGraph,
  isRTL: boolean,
): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = []
  const edges: Edge[] = []

  // Calculate positions using a radial layout
  const centerX = 400
  const centerY = 300
  const levelRadius = 180

  // Group nodes by depth
  const nodesByDepth: Map<number, DependencyNode[]> = new Map()
  graph.nodes.forEach((node) => {
    const depth = node.depth
    if (!nodesByDepth.has(depth)) {
      nodesByDepth.set(depth, [])
    }
    nodesByDepth.get(depth)!.push(node)
  })

  // Position nodes
  nodesByDepth.forEach((depthNodes, depth) => {
    const count = depthNodes.length
    const radius = depth * levelRadius

    depthNodes.forEach((node, index) => {
      const angle = (2 * Math.PI * index) / count - Math.PI / 2
      const x = depth === 0 ? centerX : centerX + radius * Math.cos(angle)
      const y = depth === 0 ? centerY : centerY + radius * Math.sin(angle)

      nodes.push({
        id: node.id,
        type: 'custom',
        position: { x, y },
        data: {
          label: isRTL ? node.name_ar || node.name_en : node.name_en,
          type: node.type,
          isSource: node.is_source || false,
          dependencyType: node.dependency_type,
          depth: node.depth,
        },
        sourcePosition: isRTL ? Position.Left : Position.Right,
        targetPosition: isRTL ? Position.Right : Position.Left,
      })
    })
  })

  // Create edges
  graph.edges.forEach((edge, index) => {
    edges.push({
      id: edge.id || `edge-${index}`,
      source: edge.source,
      target: edge.target,
      type: 'smoothstep',
      animated: edge.depth === 1,
      label: edge.relationship_type.replace(/_/g, ' '),
      labelStyle: { fontSize: 10, fill: '#666' },
      style: {
        stroke: edge.depth === 1 ? '#3b82f6' : '#9ca3af',
        strokeWidth: edge.depth === 1 ? 2 : 1,
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: edge.depth === 1 ? '#3b82f6' : '#9ca3af',
      },
    })
  })

  return { nodes, edges }
}

// ============================================================================
// Stats Component
// ============================================================================

interface GraphStatsProps {
  graph: DependencyGraph
}

function GraphStats({ graph }: GraphStatsProps) {
  const { t, i18n } = useTranslation('entity-dependencies')
  const isRTL = i18n.language === 'ar'

  return (
    <div
      className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 mb-4"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <Card className="p-2 sm:p-3">
        <p className="text-[10px] sm:text-xs text-muted-foreground">{t('stats.total')}</p>
        <p className="text-lg sm:text-xl font-bold">{graph.total_nodes - 1}</p>
      </Card>
      <Card className="p-2 sm:p-3">
        <p className="text-[10px] sm:text-xs text-muted-foreground">{t('stats.direct')}</p>
        <p className="text-lg sm:text-xl font-bold text-blue-600">
          {graph.stats.direct_dependencies}
        </p>
      </Card>
      <Card className="p-2 sm:p-3">
        <p className="text-[10px] sm:text-xs text-muted-foreground">{t('stats.transitive')}</p>
        <p className="text-lg sm:text-xl font-bold text-gray-600">
          {graph.stats.transitive_dependencies}
        </p>
      </Card>
      <Card className="p-2 sm:p-3">
        <p className="text-[10px] sm:text-xs text-muted-foreground">{t('stats.depth')}</p>
        <p className="text-lg sm:text-xl font-bold">{graph.actual_depth}</p>
      </Card>
    </div>
  )
}

// ============================================================================
// Main Component
// ============================================================================

export function DependencyGraphViewer({
  entityId,
  entityName,
  maxDepth = 3,
  includeTransitive = true,
  className,
  onNodeClick,
}: DependencyGraphViewerProps) {
  const { t, i18n } = useTranslation('entity-dependencies')
  const isRTL = i18n.language === 'ar'

  const {
    data: graph,
    isLoading,
    error,
    refetch,
  } = useDependencyGraph(entityId, { maxDepth, includeTransitive })

  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
    if (!graph) return { nodes: [], edges: [] }
    return transformGraphToReactFlow(graph, isRTL)
  }, [graph, isRTL])

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)

  // Update nodes when graph changes
  useMemo(() => {
    if (initialNodes.length > 0) {
      setNodes(initialNodes)
      setEdges(initialEdges)
    }
  }, [initialNodes, initialEdges, setNodes, setEdges])

  const handleNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      if (onNodeClick && node.data) {
        onNodeClick(node.id, node.data.type)
      }
    },
    [onNodeClick],
  )

  if (isLoading) {
    return (
      <Card className={cn('w-full', className)}>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 mb-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-16 sm:h-20" />
            ))}
          </div>
          <Skeleton className="h-[400px] sm:h-[500px] w-full" />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={cn('w-full', className)}>
        <CardContent className="p-6 text-center">
          <p className="text-destructive mb-4">{t('errors.loadFailed')}</p>
          <Button onClick={() => refetch()} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 me-2" />
            {t('actions.retry')}
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (!graph || graph.total_nodes <= 1) {
    return (
      <Card className={cn('w-full', className)}>
        <CardContent className="p-6 text-center">
          <div className="py-8">
            <Globe className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">{t('empty.noDependencies')}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn('w-full', className)} dir={isRTL ? 'rtl' : 'ltr'}>
      <CardHeader className="pb-2 sm:pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <CardTitle className="text-base sm:text-lg">
            {entityName ? t('title.withName', { name: entityName }) : t('title.default')}
          </CardTitle>
          <Button onClick={() => refetch()} variant="outline" size="sm" className="h-8 sm:h-9">
            <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4 me-1.5 sm:me-2" />
            {t('actions.refresh')}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-2 sm:p-4">
        <GraphStats graph={graph} />

        <div className="h-[400px] sm:h-[500px] lg:h-[600px] border rounded-lg overflow-hidden">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={handleNodeClick}
            nodeTypes={nodeTypes}
            fitView
            fitViewOptions={{ padding: 0.2 }}
            minZoom={0.3}
            maxZoom={2}
            defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
          >
            <Background color="#e5e7eb" gap={16} />
            <Controls showInteractive={false} className="!bg-background !border !shadow-md" />
            <MiniMap
              nodeColor={(node) => {
                const config = ENTITY_TYPE_CONFIG[node.data?.type] || ENTITY_TYPE_CONFIG.topic
                return config.color.includes('blue')
                  ? '#3b82f6'
                  : config.color.includes('purple')
                    ? '#9333ea'
                    : config.color.includes('green')
                      ? '#22c55e'
                      : config.color.includes('orange')
                        ? '#f97316'
                        : config.color.includes('teal')
                          ? '#14b8a6'
                          : config.color.includes('red')
                            ? '#ef4444'
                            : '#6b7280'
              }}
              maskColor="rgba(0,0,0,0.1)"
              className="!bg-background !border"
            />
          </ReactFlow>
        </div>

        {/* Legend */}
        <div className="mt-4 flex flex-wrap gap-2 sm:gap-4 text-xs sm:text-sm">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-primary/20 border-2 border-primary" />
            <span>{t('legend.source')}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-blue-50 border-2 border-blue-400" />
            <span>{t('legend.direct')}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-gray-50 border-2 border-gray-300" />
            <span>{t('legend.transitive')}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default DependencyGraphViewer
