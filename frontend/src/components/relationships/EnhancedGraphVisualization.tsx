/**
 * EnhancedGraphVisualization Component
 *
 * Advanced graph visualization that solves the "overwhelm" problem for complex networks.
 *
 * Features:
 * - Multiple layout algorithms (Circular, Clustered by Type, Force-Directed, Hierarchical)
 * - Progressive disclosure with expand/collapse functionality
 * - Focus mode to highlight selected node and connections
 * - Visual complexity controls (labels, node sizes, edge visibility)
 * - Node importance indicators (size based on connection count)
 * - Cluster grouping by entity type with collapsible groups
 * - Mobile-first with RTL support
 */

import { useCallback, useMemo, useState, useEffect, memo } from 'react'
import { useTranslation } from 'react-i18next'
import ReactFlow, {
  Node,
  Edge,
  Background,
  BackgroundVariant,
  MiniMap,
  useNodesState,
  useEdgesState,
  ConnectionMode,
  Panel,
  NodeTypes,
  useReactFlow,
  MarkerType,
  ReactFlowProvider,
} from 'reactflow'
import 'reactflow/dist/style.css'
import { motion } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Settings2,
  Eye,
  EyeOff,
  Layers,
  GitBranch,
  Circle,
  Network,
  Focus,
  Expand,
  Shrink,
  ChevronDown,
  ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ============================================
// Types
// ============================================

interface NodeData {
  id: string
  type: string
  name_en: string
  name_ar: string
  status: string
  degree: number
  connectionCount?: number
}

interface EdgeData {
  source_id: string
  target_id: string
  relationship_type: string
}

type LayoutType = 'circular' | 'clustered' | 'force' | 'hierarchical'

interface ClusterInfo {
  type: string
  count: number
  collapsed: boolean
  nodes: NodeData[]
}

interface EnhancedGraphVisualizationProps {
  nodes: NodeData[]
  edges: EdgeData[]
  onNodeClick?: (nodeId: string) => void
  height?: string
  showMiniMap?: boolean
  centerNodeId?: string
}

// ============================================
// Constants
// ============================================

const NODE_COLORS: Record<string, string> = {
  country: '#3b82f6',
  organization: '#8b5cf6',
  individual: '#10b981',
  forum: '#f59e0b',
  engagement: '#ec4899',
  mou: '#14b8a6',
  position: '#6366f1',
}

const EDGE_COLORS: Record<string, string> = {
  member_of: '#3b82f6',
  partner: '#10b981',
  parent_org: '#8b5cf6',
  hosted_by: '#f59e0b',
  participant: '#ec4899',
  signatory: '#14b8a6',
}

// ============================================
// Custom Node Components
// ============================================

const EnhancedDossierNode = memo(
  ({
    data,
    selected,
  }: {
    data: NodeData & {
      isFocused?: boolean
      showLabels?: boolean
      sizeMultiplier?: number
      isCenter?: boolean
      dimmed?: boolean
    }
    selected?: boolean
  }) => {
    const { i18n } = useTranslation()
    const isRTL = i18n.language === 'ar'
    const name = isRTL ? data.name_ar : data.name_en

    const baseSize = 40
    const connectionBonus = Math.min((data.connectionCount || 0) * 2, 30)
    const size = baseSize + connectionBonus * (data.sizeMultiplier || 1)

    const nodeColor = NODE_COLORS[data.type] || '#6b7280'

    return (
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{
          scale: 1,
          opacity: data.dimmed ? 0.3 : 1,
        }}
        whileHover={{ scale: 1.05 }}
        transition={{ duration: 0.2 }}
        className={cn(
          'relative flex items-center justify-center transition-all duration-200',
          data.isFocused && 'ring-4 ring-primary ring-offset-2',
          data.isCenter && 'ring-2 ring-primary',
          selected && 'ring-2 ring-primary/50',
        )}
        style={{ width: size, height: size }}
      >
        {/* Node circle */}
        <div
          className={cn(
            'absolute inset-0 rounded-full border-2 shadow-md transition-all duration-200',
            data.dimmed && 'opacity-50',
          )}
          style={{
            backgroundColor: `${nodeColor}20`,
            borderColor: nodeColor,
          }}
        />

        {/* Type icon/indicator */}
        <div
          className="absolute inset-0 flex items-center justify-center text-white font-bold text-xs"
          style={{ color: nodeColor }}
        >
          {data.type?.[0]?.toUpperCase() || '?'}
        </div>

        {/* Degree badge */}
        {data.degree > 0 && (
          <div className="absolute -top-1 -end-1 bg-background rounded-full px-1 text-[10px] border shadow-sm">
            {data.degree}°
          </div>
        )}

        {/* Connection count badge */}
        {(data.connectionCount || 0) > 2 && (
          <div className="absolute -bottom-1 -end-1 bg-primary text-primary-foreground rounded-full px-1.5 text-[10px] shadow-sm">
            {data.connectionCount}
          </div>
        )}

        {/* Label */}
        {data.showLabels !== false && (
          <div
            className={cn(
              'absolute top-full mt-1 whitespace-nowrap text-xs font-medium text-center',
              'max-w-[120px] truncate',
              data.dimmed && 'opacity-50',
            )}
          >
            {name}
          </div>
        )}
      </motion.div>
    )
  },
)
EnhancedDossierNode.displayName = 'EnhancedDossierNode'

// Cluster Node for collapsed groups
const ClusterNode = memo(
  ({
    data,
  }: {
    data: {
      clusterType: string
      count: number
      color: string
      onExpand: () => void
    }
  }) => {
    const { t } = useTranslation('graph')

    return (
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={{ scale: 1.05 }}
        className="cursor-pointer"
        onClick={data.onExpand}
      >
        <div
          className="flex flex-col items-center justify-center rounded-xl border-2 shadow-lg p-4 min-w-[100px]"
          style={{
            backgroundColor: `${data.color}15`,
            borderColor: data.color,
          }}
        >
          <Layers className="h-6 w-6 mb-1" style={{ color: data.color }} />
          <span className="text-sm font-semibold" style={{ color: data.color }}>
            {data.count}
          </span>
          <span className="text-xs text-muted-foreground capitalize">
            {t(data.clusterType, data.clusterType)}
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="mt-2 h-6 text-xs"
            onClick={(e) => {
              e.stopPropagation()
              data.onExpand()
            }}
          >
            <Expand className="h-3 w-3 me-1" />
            {t('expand', 'Expand')}
          </Button>
        </div>
      </motion.div>
    )
  },
)
ClusterNode.displayName = 'ClusterNode'

const enhancedNodeTypes: NodeTypes = {
  dossier: EnhancedDossierNode,
  cluster: ClusterNode,
}

// ============================================
// Layout Algorithms
// ============================================

function calculateCircularLayout(
  nodes: NodeData[],
  centerX: number,
  centerY: number,
  radius: number,
): Record<string, { x: number; y: number }> {
  const positions: Record<string, { x: number; y: number }> = {}

  nodes.forEach((node, index) => {
    if (node.degree === 0) {
      // Center node
      positions[node.id] = { x: centerX, y: centerY }
    } else {
      const angle = (index / nodes.length) * 2 * Math.PI
      positions[node.id] = {
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle),
      }
    }
  })

  return positions
}

function calculateClusteredLayout(
  nodes: NodeData[],
  centerX: number,
  centerY: number,
): Record<string, { x: number; y: number }> {
  const positions: Record<string, { x: number; y: number }> = {}

  // Group nodes by type
  const clusters: Record<string, NodeData[]> = {}
  nodes.forEach((node) => {
    const type = node.type
    if (!clusters[type]) {
      clusters[type] = []
    }
    clusters[type].push(node)
  })

  const clusterTypes = Object.keys(clusters)
  const clusterRadius = 300
  const nodeRadius = 80

  clusterTypes.forEach((type, clusterIndex) => {
    const clusterAngle = (clusterIndex / clusterTypes.length) * 2 * Math.PI
    const clusterCenterX = centerX + clusterRadius * Math.cos(clusterAngle)
    const clusterCenterY = centerY + clusterRadius * Math.sin(clusterAngle)

    const clusterNodes = clusters[type] || []
    clusterNodes.forEach((node, nodeIndex) => {
      if (node.degree === 0) {
        positions[node.id] = { x: centerX, y: centerY }
      } else {
        const nodeAngle = (nodeIndex / Math.max(clusterNodes.length, 1)) * 2 * Math.PI
        positions[node.id] = {
          x: clusterCenterX + nodeRadius * Math.cos(nodeAngle),
          y: clusterCenterY + nodeRadius * Math.sin(nodeAngle),
        }
      }
    })
  })

  return positions
}

function calculateHierarchicalLayout(
  nodes: NodeData[],
  centerX: number,
): Record<string, { x: number; y: number }> {
  const positions: Record<string, { x: number; y: number }> = {}

  // Group by degree
  const levels: Record<number, NodeData[]> = {}
  nodes.forEach((node) => {
    const degree = node.degree
    if (!levels[degree]) {
      levels[degree] = []
    }
    levels[degree].push(node)
  })

  const levelSpacing = 150
  const sortedDegrees = Object.keys(levels)
    .map(Number)
    .sort((a, b) => a - b)

  sortedDegrees.forEach((degree, levelIndex) => {
    const levelNodes = levels[degree] || []
    const levelY = 100 + levelIndex * levelSpacing
    const levelWidth = Math.max(levelNodes.length, 1) * 150
    const startX = centerX - levelWidth / 2

    levelNodes.forEach((node, nodeIndex) => {
      positions[node.id] = {
        x: startX + nodeIndex * 150 + 75,
        y: levelY,
      }
    })
  })

  return positions
}

// ============================================
// Main Component
// ============================================

function EnhancedGraphVisualizationInner({
  nodes: rawNodes,
  edges: rawEdges,
  onNodeClick,
  height = '600px',
  showMiniMap = true,
  // centerNodeId is used for potential future enhancements like auto-focusing
  centerNodeId: _centerNodeId,
}: EnhancedGraphVisualizationProps) {
  const { t, i18n } = useTranslation('graph')
  const isRTL = i18n.language === 'ar'
  const { zoomIn, zoomOut, fitView } = useReactFlow()

  // ============================================
  // State
  // ============================================

  const [layout, setLayout] = useState<LayoutType>('clustered')
  const [showLabels, setShowLabels] = useState(true)
  const [showEdgeLabels, setShowEdgeLabels] = useState(false)
  const [nodeSizeMultiplier, setNodeSizeMultiplier] = useState(1)
  const [focusedNodeId, setFocusedNodeId] = useState<string | null>(null)
  const [collapsedClusters, setCollapsedClusters] = useState<Set<string>>(new Set())
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [highlightConnections, setHighlightConnections] = useState(true)
  const [selectedNodeType, setSelectedNodeType] = useState<string>('all')
  const [selectedRelationshipType, setSelectedRelationshipType] = useState<string>('all')

  // ============================================
  // Computed Values
  // ============================================

  // Calculate connection counts for each node
  const connectionCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    rawEdges.forEach((edge) => {
      counts[edge.source_id] = (counts[edge.source_id] || 0) + 1
      counts[edge.target_id] = (counts[edge.target_id] || 0) + 1
    })
    return counts
  }, [rawEdges])

  // Get unique node and relationship types
  const nodeTypes = useMemo(() => {
    const types = new Set(rawNodes.map((n) => n.type))
    return ['all', ...Array.from(types)]
  }, [rawNodes])

  const relationshipTypes = useMemo(() => {
    const types = new Set(rawEdges.map((e) => e.relationship_type))
    return ['all', ...Array.from(types)]
  }, [rawEdges])

  // Filter nodes based on type selection
  const filteredNodes = useMemo(() => {
    let nodes = rawNodes
    if (selectedNodeType !== 'all') {
      nodes = nodes.filter((n) => n.type === selectedNodeType)
    }
    return nodes.map((node) => ({
      ...node,
      connectionCount: connectionCounts[node.id] || 0,
    }))
  }, [rawNodes, selectedNodeType, connectionCounts])

  // Filter edges based on visible nodes and relationship type
  const filteredEdges = useMemo(() => {
    const nodeIds = new Set(filteredNodes.map((n) => n.id))
    let edges = rawEdges.filter((e) => nodeIds.has(e.source_id) && nodeIds.has(e.target_id))
    if (selectedRelationshipType !== 'all') {
      edges = edges.filter((e) => e.relationship_type === selectedRelationshipType)
    }
    return edges
  }, [rawEdges, filteredNodes, selectedRelationshipType])

  // Get connected node IDs for focused node
  const connectedNodeIds = useMemo(() => {
    if (!focusedNodeId || !highlightConnections) return new Set<string>()

    const connected = new Set<string>([focusedNodeId])
    filteredEdges.forEach((edge) => {
      if (edge.source_id === focusedNodeId) {
        connected.add(edge.target_id)
      }
      if (edge.target_id === focusedNodeId) {
        connected.add(edge.source_id)
      }
    })
    return connected
  }, [focusedNodeId, filteredEdges, highlightConnections])

  // Cluster information
  const clusters = useMemo(() => {
    const clusterMap: Record<string, ClusterInfo> = {}
    filteredNodes.forEach((node) => {
      const type = node.type
      if (!clusterMap[type]) {
        clusterMap[type] = {
          type,
          count: 0,
          collapsed: collapsedClusters.has(type),
          nodes: [],
        }
      }
      clusterMap[type].count++
      clusterMap[type].nodes.push(node)
    })
    return clusterMap
  }, [filteredNodes, collapsedClusters])

  // ============================================
  // Layout Calculation
  // ============================================

  const reactFlowNodes: Node[] = useMemo(() => {
    const centerX = 400
    const centerY = 300

    let positions: Record<string, { x: number; y: number }>

    switch (layout) {
      case 'clustered':
        positions = calculateClusteredLayout(filteredNodes, centerX, centerY)
        break
      case 'hierarchical':
        positions = calculateHierarchicalLayout(filteredNodes, centerX)
        break
      case 'circular':
      default:
        positions = calculateCircularLayout(filteredNodes, centerX, centerY, 250)
    }

    // Create nodes, handling collapsed clusters
    const nodes: Node[] = []
    const processedClusters = new Set<string>()

    filteredNodes.forEach((node) => {
      const type = node.type
      const isCollapsed = collapsedClusters.has(type)

      if (isCollapsed) {
        // Add cluster node if not already added
        if (!processedClusters.has(type)) {
          processedClusters.add(type)
          const cluster = clusters[type]

          if (cluster) {
            // Use position of first node in cluster
            const firstNodeId = cluster.nodes[0]?.id
            const position =
              firstNodeId && positions[firstNodeId]
                ? positions[firstNodeId]
                : { x: centerX, y: centerY }

            nodes.push({
              id: `cluster-${type}`,
              type: 'cluster',
              data: {
                clusterType: type,
                count: cluster.count,
                color: NODE_COLORS[type] || '#6b7280',
                onExpand: () => {
                  setCollapsedClusters((prev) => {
                    const next = new Set(prev)
                    next.delete(type)
                    return next
                  })
                },
              },
              position,
            })
          }
        }
      } else {
        const position = positions[node.id] || { x: centerX, y: centerY }
        const isFocused = focusedNodeId === node.id
        const isConnected = connectedNodeIds.has(node.id)
        const dimmed = focusedNodeId !== null && !isConnected

        nodes.push({
          id: node.id,
          type: 'dossier',
          data: {
            ...node,
            isFocused,
            showLabels,
            sizeMultiplier: nodeSizeMultiplier,
            isCenter: node.degree === 0,
            dimmed,
          },
          position,
          style: {
            borderColor: NODE_COLORS[node.type] || '#6b7280',
          },
        })
      }
    })

    return nodes
  }, [
    filteredNodes,
    layout,
    showLabels,
    nodeSizeMultiplier,
    focusedNodeId,
    connectedNodeIds,
    collapsedClusters,
    clusters,
  ])

  const reactFlowEdges: Edge[] = useMemo(() => {
    return filteredEdges
      .filter((edge) => {
        // Don't show edges for collapsed clusters
        const sourceType = filteredNodes.find((n) => n.id === edge.source_id)?.type
        const targetType = filteredNodes.find((n) => n.id === edge.target_id)?.type
        if (sourceType && collapsedClusters.has(sourceType)) return false
        if (targetType && collapsedClusters.has(targetType)) return false
        return true
      })
      .map((edge, index) => {
        const isConnectedToFocused =
          focusedNodeId === edge.source_id || focusedNodeId === edge.target_id
        const dimmed = focusedNodeId !== null && !isConnectedToFocused

        return {
          id: `edge-${index}`,
          source: edge.source_id,
          target: edge.target_id,
          type: 'smoothstep',
          animated: isConnectedToFocused,
          label: showEdgeLabels ? edge.relationship_type.replace(/_/g, ' ') : undefined,
          style: {
            stroke: EDGE_COLORS[edge.relationship_type] || '#9ca3af',
            strokeWidth: isConnectedToFocused ? 3 : 2,
            opacity: dimmed ? 0.2 : 1,
          },
          labelStyle: {
            fontSize: 10,
            fontWeight: 500,
            fill: dimmed ? '#9ca3af' : '#000',
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 15,
            height: 15,
            color: EDGE_COLORS[edge.relationship_type] || '#9ca3af',
          },
        }
      })
  }, [filteredEdges, filteredNodes, showEdgeLabels, focusedNodeId, collapsedClusters])

  const [nodes, setNodes, onNodesChange] = useNodesState(reactFlowNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(reactFlowEdges)

  // Update nodes when layout or data changes
  useEffect(() => {
    setNodes(reactFlowNodes)
  }, [reactFlowNodes, setNodes])

  useEffect(() => {
    setEdges(reactFlowEdges)
  }, [reactFlowEdges, setEdges])

  // ============================================
  // Handlers
  // ============================================

  const handleNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      if (node.type === 'cluster') return

      if (focusedNodeId === node.id) {
        // Double-click to navigate
        if (onNodeClick) {
          onNodeClick(node.id)
        }
      } else {
        // Single click to focus
        setFocusedNodeId(node.id)
      }
    },
    [focusedNodeId, onNodeClick],
  )

  const handleBackgroundClick = useCallback(() => {
    setFocusedNodeId(null)
  }, [])

  const toggleCluster = useCallback((type: string) => {
    setCollapsedClusters((prev) => {
      const next = new Set(prev)
      if (next.has(type)) {
        next.delete(type)
      } else {
        next.add(type)
      }
      return next
    })
  }, [])

  const collapseAllClusters = useCallback(() => {
    setCollapsedClusters(new Set(Object.keys(clusters)))
  }, [clusters])

  const expandAllClusters = useCallback(() => {
    setCollapsedClusters(new Set())
  }, [])

  // ============================================
  // Render
  // ============================================

  return (
    <div
      className="relative w-full rounded-lg border bg-background overflow-hidden"
      style={{ height }}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        onPaneClick={handleBackgroundClick}
        nodeTypes={enhancedNodeTypes}
        connectionMode={ConnectionMode.Loose}
        fitView
        attributionPosition={isRTL ? 'bottom-left' : 'bottom-right'}
        minZoom={0.1}
        maxZoom={2}
      >
        <Background variant={BackgroundVariant.Dots} gap={16} size={1} />

        {showMiniMap && (
          <MiniMap
            position={isRTL ? 'bottom-left' : 'bottom-right'}
            nodeColor={(node) => NODE_COLORS[node.data?.type] || '#6b7280'}
            nodeBorderRadius={8}
            maskColor="rgba(0, 0, 0, 0.1)"
            className="!bottom-20 sm:!bottom-4"
          />
        )}

        {/* Layout & Controls Panel */}
        <Panel position={isRTL ? 'top-left' : 'top-right'} className="flex flex-col gap-2">
          {/* Layout Selector */}
          <div className="bg-background/95 p-3 rounded-lg border shadow-sm">
            <div className="text-xs font-semibold mb-2 flex items-center gap-2">
              <GitBranch className="h-3.5 w-3.5" />
              {t('layout.title', 'Layout')}
            </div>
            <Select value={layout} onValueChange={(v) => setLayout(v as LayoutType)}>
              <SelectTrigger className="h-8 w-[140px] text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="circular" className="text-xs">
                  <div className="flex items-center gap-2">
                    <Circle className="h-3 w-3" />
                    {t('layout.circular', 'Circular')}
                  </div>
                </SelectItem>
                <SelectItem value="clustered" className="text-xs">
                  <div className="flex items-center gap-2">
                    <Layers className="h-3 w-3" />
                    {t('layout.clustered', 'Clustered')}
                  </div>
                </SelectItem>
                <SelectItem value="hierarchical" className="text-xs">
                  <div className="flex items-center gap-2">
                    <Network className="h-3 w-3" />
                    {t('layout.hierarchical', 'Hierarchical')}
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Filters */}
          <div className="bg-background/95 p-3 rounded-lg border shadow-sm">
            <div className="text-xs font-semibold mb-2">{t('filters', 'Filters')}</div>

            <div className="space-y-2">
              <Select value={selectedNodeType} onValueChange={setSelectedNodeType}>
                <SelectTrigger className="h-8 w-[140px] text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {nodeTypes.map((type) => (
                    <SelectItem key={type} value={type} className="text-xs">
                      {type === 'all' ? t('allTypes', 'All Types') : t(type, type)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedRelationshipType} onValueChange={setSelectedRelationshipType}>
                <SelectTrigger className="h-8 w-[140px] text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {relationshipTypes.map((type) => (
                    <SelectItem key={type} value={type} className="text-xs">
                      {type === 'all'
                        ? t('allRelationships', 'All Relationships')
                        : type.replace(/_/g, ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Cluster Controls */}
          <div className="bg-background/95 p-3 rounded-lg border shadow-sm">
            <div className="text-xs font-semibold mb-2 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Layers className="h-3.5 w-3.5" />
                {t('clusters', 'Clusters')}
              </span>
              <div className="flex gap-1">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={collapseAllClusters}
                      >
                        <Shrink className="h-3 w-3" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      {t('collapseAll', 'Collapse All')}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={expandAllClusters}
                      >
                        <Expand className="h-3 w-3" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">{t('expandAll', 'Expand All')}</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>

            <div className="space-y-1">
              {Object.entries(clusters).map(([type, cluster]) => (
                <button
                  key={type}
                  className="flex items-center justify-between w-full text-xs py-1 px-2 rounded hover:bg-muted transition-colors"
                  onClick={() => toggleCluster(type)}
                >
                  <span className="flex items-center gap-2">
                    <div
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: NODE_COLORS[type] || '#6b7280' }}
                    />
                    <span className="capitalize">{t(type, type)}</span>
                    <Badge variant="secondary" className="text-[10px] h-4 px-1">
                      {cluster.count}
                    </Badge>
                  </span>
                  {cluster.collapsed ? (
                    <ChevronRight className="h-3 w-3" />
                  ) : (
                    <ChevronDown className="h-3 w-3" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="bg-background/95 p-3 rounded-lg border shadow-sm text-xs text-muted-foreground">
            {filteredNodes.length} {t('nodesShown', 'nodes')} · {filteredEdges.length}{' '}
            {t('edgesShown', 'edges')}
          </div>
        </Panel>

        {/* Zoom & View Controls */}
        <Panel position={isRTL ? 'bottom-right' : 'bottom-left'} className="flex gap-2">
          <div className="bg-background/95 p-2 rounded-lg border shadow-sm flex gap-1">
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              onClick={() => zoomIn()}
              title={t('zoomIn', 'Zoom In')}
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              onClick={() => zoomOut()}
              title={t('zoomOut', 'Zoom Out')}
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              onClick={() => fitView()}
              title={t('fitView', 'Fit View')}
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
          </div>

          {/* Settings Popover */}
          <Popover open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
            <PopoverTrigger asChild>
              <Button size="icon" variant="outline" className="h-8 w-8 bg-background/95">
                <Settings2 className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent side={isRTL ? 'left' : 'right'} className="w-64" align="start">
              <div className="space-y-4">
                <h4 className="font-medium text-sm">{t('settings.title', 'Display Settings')}</h4>

                {/* Show Labels */}
                <div className="flex items-center justify-between">
                  <Label className="text-sm flex items-center gap-2">
                    {showLabels ? (
                      <Eye className="h-3.5 w-3.5" />
                    ) : (
                      <EyeOff className="h-3.5 w-3.5" />
                    )}
                    {t('settings.showLabels', 'Show Labels')}
                  </Label>
                  <Switch checked={showLabels} onCheckedChange={setShowLabels} />
                </div>

                {/* Show Edge Labels */}
                <div className="flex items-center justify-between">
                  <Label className="text-sm">{t('settings.showEdgeLabels', 'Edge Labels')}</Label>
                  <Switch checked={showEdgeLabels} onCheckedChange={setShowEdgeLabels} />
                </div>

                {/* Highlight Connections */}
                <div className="flex items-center justify-between">
                  <Label className="text-sm flex items-center gap-2">
                    <Focus className="h-3.5 w-3.5" />
                    {t('settings.highlightConnections', 'Focus Mode')}
                  </Label>
                  <Switch
                    checked={highlightConnections}
                    onCheckedChange={setHighlightConnections}
                  />
                </div>

                {/* Node Size */}
                <div className="space-y-2">
                  <Label className="text-sm">{t('settings.nodeSize', 'Node Size')}</Label>
                  <Slider
                    value={[nodeSizeMultiplier]}
                    onValueChange={([v]) => setNodeSizeMultiplier(v ?? 1)}
                    min={0.5}
                    max={2}
                    step={0.1}
                    className="w-full"
                  />
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </Panel>

        {/* Legend */}
        <Panel
          position={isRTL ? 'top-right' : 'top-left'}
          className="bg-background/95 p-3 rounded-lg border shadow-sm"
        >
          <div className="text-xs font-semibold mb-2">{t('legend', 'Legend')}</div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
            {Object.entries(NODE_COLORS)
              .slice(0, 6)
              .map(([type, color]) => (
                <div key={type} className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full" style={{ backgroundColor: color }} />
                  <span className="capitalize">{t(type, type)}</span>
                </div>
              ))}
          </div>

          {focusedNodeId && (
            <div className="mt-3 pt-2 border-t">
              <div className="text-xs text-muted-foreground flex items-center gap-2">
                <Focus className="h-3 w-3" />
                {t('focusedNode', 'Click background to clear focus')}
              </div>
            </div>
          )}
        </Panel>
      </ReactFlow>
    </div>
  )
}

// Wrap with ReactFlowProvider
export function EnhancedGraphVisualization(props: EnhancedGraphVisualizationProps) {
  return (
    <ReactFlowProvider>
      <EnhancedGraphVisualizationInner {...props} />
    </ReactFlowProvider>
  )
}

export default EnhancedGraphVisualization
