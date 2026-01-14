/**
 * InfluenceNetworkGraph Component
 * Feature: stakeholder-influence-visualization
 *
 * Interactive network visualization of stakeholder influence using React Flow.
 * Shows nodes sized by influence score and colored by tier.
 * Mobile-first, RTL-aware with zoom/pan controls.
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  ReactFlow,
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  MarkerType,
  Position,
  MiniMap,
  Panel,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Loader2,
  Building2,
  Users,
  Globe,
  User,
  ZoomIn,
  ZoomOut,
  Maximize2,
  RefreshCw,
  Share2,
  GitBranch,
  Shield,
} from 'lucide-react'
import type {
  NetworkNode,
  NetworkEdge,
  NetworkVisualizationData,
  InfluenceTier,
  StakeholderRole,
} from '@/types/stakeholder-influence.types'
import {
  NODE_COLORS,
  getEdgeColor,
  getNodeSize,
  getEdgeWidth,
  INFLUENCE_TIER_LABELS,
  STAKEHOLDER_ROLE_LABELS,
} from '@/types/stakeholder-influence.types'

// ============================================================================
// Types
// ============================================================================

interface InfluenceNetworkGraphProps {
  /** Network visualization data */
  data?: NetworkVisualizationData
  /** Loading state */
  isLoading?: boolean
  /** Center dossier ID (highlighted) */
  centerDossierId?: string
  /** Handle node click */
  onNodeClick?: (dossierId: string) => void
  /** Handle edge click */
  onEdgeClick?: (source: string, target: string) => void
  /** Height of the graph container */
  height?: string | number
  /** Show mini map */
  showMiniMap?: boolean
  /** Show statistics panel */
  showStats?: boolean
  /** Additional class name */
  className?: string
}

// ============================================================================
// Node Type Icons
// ============================================================================

const TYPE_ICONS: Record<string, typeof User> = {
  person: User,
  organization: Building2,
  country: Globe,
  forum: Users,
  engagement_dossier: Users,
}

// ============================================================================
// Custom Node Component
// ============================================================================

function InfluenceNode({ data }: { data: Record<string, unknown> }) {
  const { i18n } = useTranslation()
  const isRTL = i18n.language === 'ar'

  const isCenter = data.isCenter as boolean
  const tier = data.tier as InfluenceTier
  const role = data.role as StakeholderRole
  const type = data.type as string
  const influenceScore = data.influenceScore as number
  const name = isRTL ? (data.name_ar as string) : (data.name_en as string)

  const Icon = TYPE_ICONS[type] || User
  const RoleIcon =
    role === 'hub' ? Share2 : role === 'bridge' ? GitBranch : role === 'gatekeeper' ? Shield : null

  // Calculate node size based on influence
  const size = getNodeSize(influenceScore)

  // Get tier color
  const tierColor = NODE_COLORS[tier] || NODE_COLORS.peripheral

  return (
    <div
      className={`relative rounded-full flex items-center justify-center cursor-pointer transition-all hover:ring-2 hover:ring-offset-2 ${
        isCenter ? 'ring-2 ring-primary ring-offset-2' : ''
      }`}
      style={{
        width: size,
        height: size,
        backgroundColor: tierColor,
        boxShadow: isCenter ? '0 0 20px rgba(0,0,0,0.2)' : '0 2px 8px rgba(0,0,0,0.15)',
      }}
    >
      <Icon className="text-white" style={{ width: size * 0.4, height: size * 0.4 }} />

      {/* Role badge */}
      {RoleIcon && (
        <div
          className="absolute -bottom-1 -end-1 bg-white rounded-full p-0.5 shadow-md"
          style={{ borderColor: tierColor, borderWidth: 2 }}
        >
          <RoleIcon className="w-3 h-3" style={{ color: tierColor }} />
        </div>
      )}

      {/* Tooltip with name */}
      <div
        className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-background border rounded shadow-sm whitespace-nowrap text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        {name}
        <span className="ms-1 text-muted-foreground">({influenceScore})</span>
      </div>
    </div>
  )
}

// ============================================================================
// Detailed Node Component (for selected node)
// ============================================================================

function DetailedInfluenceNode({ data }: { data: Record<string, unknown> }) {
  const { i18n } = useTranslation()
  const isRTL = i18n.language === 'ar'

  const tier = data.tier as InfluenceTier
  const role = data.role as StakeholderRole
  const type = data.type as string
  const influenceScore = data.influenceScore as number
  const name = isRTL ? (data.name_ar as string) : (data.name_en as string)
  const isCenter = data.isCenter as boolean

  const Icon = TYPE_ICONS[type] || User
  const tierLabel = isRTL ? INFLUENCE_TIER_LABELS[tier].ar : INFLUENCE_TIER_LABELS[tier].en
  const roleLabel = isRTL ? STAKEHOLDER_ROLE_LABELS[role].ar : STAKEHOLDER_ROLE_LABELS[role].en

  return (
    <Card
      className={`p-3 min-w-[160px] sm:min-w-[180px] cursor-pointer transition-shadow hover:shadow-lg ${
        isCenter ? 'ring-2 ring-primary' : ''
      }`}
    >
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-full" style={{ backgroundColor: NODE_COLORS[tier] + '20' }}>
            <Icon className="h-4 w-4" style={{ color: NODE_COLORS[tier] }} />
          </div>
          <span className="font-semibold text-sm truncate">{name}</span>
        </div>

        <div className="flex items-center justify-between text-xs">
          <Badge variant="secondary" className="text-xs">
            {tierLabel}
          </Badge>
          <span className="font-bold" style={{ color: NODE_COLORS[tier] }}>
            {influenceScore}
          </span>
        </div>

        <div className="text-xs text-muted-foreground">{roleLabel}</div>
      </div>
    </Card>
  )
}

const nodeTypes = {
  influence: InfluenceNode,
  detailed: DetailedInfluenceNode,
}

// ============================================================================
// Main Component
// ============================================================================

export function InfluenceNetworkGraph({
  data,
  isLoading = false,
  centerDossierId,
  onNodeClick,
  onEdgeClick,
  height = 600,
  showMiniMap = true,
  showStats = true,
  className = '',
}: InfluenceNetworkGraphProps) {
  const { t, i18n } = useTranslation('stakeholder-influence')
  const isRTL = i18n.language === 'ar'

  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [selectedNode, setSelectedNode] = useState<string | null>(null)

  /**
   * Build nodes and edges from network data
   */
  useEffect(() => {
    if (!data?.nodes?.length) return

    // Calculate positions using force-directed layout simulation
    const nodeCount = data.nodes.length
    const radius = Math.max(200, nodeCount * 15)
    const angleStep = (2 * Math.PI) / nodeCount

    // Build nodes
    const newNodes: Node[] = data.nodes.map((node, index) => {
      const isCenter = node.id === centerDossierId
      const isSelected = node.id === selectedNode

      // Position: center node in middle, others in circle
      let x: number
      let y: number

      if (isCenter) {
        x = 0
        y = 0
      } else {
        // Adjust position by influence score (higher score = closer to center)
        const adjustedRadius = radius * (1 - node.influence_score / 200)
        x = adjustedRadius * Math.cos(index * angleStep)
        y = adjustedRadius * Math.sin(index * angleStep)
      }

      // RTL: flip x coordinates
      if (isRTL) {
        x = -x
      }

      return {
        id: node.id,
        type: isSelected ? 'detailed' : 'influence',
        position: { x, y },
        data: {
          name_en: node.name_en,
          name_ar: node.name_ar,
          type: node.type,
          tier: node.influence_tier,
          role: node.role,
          influenceScore: node.influence_score,
          isCenter,
          clusterId: node.cluster_id,
        },
        sourcePosition: isRTL ? Position.Left : Position.Right,
        targetPosition: isRTL ? Position.Right : Position.Left,
      }
    })

    // Build edges
    const newEdges: Edge[] = data.edges.map((edge, index) => ({
      id: `edge-${index}`,
      source: edge.source,
      target: edge.target,
      type: 'smoothstep',
      animated: edge.health_score !== null && edge.health_score >= 70,
      style: {
        stroke: getEdgeColor(edge.health_score),
        strokeWidth: getEdgeWidth(edge.health_score),
        opacity: 0.7,
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 12,
        height: 12,
        color: getEdgeColor(edge.health_score),
      },
    }))

    setNodes(newNodes)
    setEdges(newEdges)
  }, [data, centerDossierId, selectedNode, isRTL, setNodes, setEdges])

  /**
   * Handle node click
   */
  const handleNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      setSelectedNode(node.id === selectedNode ? null : node.id)
      if (onNodeClick) {
        onNodeClick(node.id)
      }
    },
    [selectedNode, onNodeClick],
  )

  /**
   * Handle edge click
   */
  const handleEdgeClick = useCallback(
    (_event: React.MouseEvent, edge: Edge) => {
      if (onEdgeClick) {
        onEdgeClick(edge.source, edge.target)
      }
    },
    [onEdgeClick],
  )

  // Loading state
  if (isLoading) {
    return (
      <div
        className="flex items-center justify-center bg-muted/10 rounded-lg"
        style={{ height: typeof height === 'number' ? `${height}px` : height }}
      >
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            {t('loading_network', 'Loading network...')}
          </p>
        </div>
      </div>
    )
  }

  // Empty state
  if (!data?.nodes?.length) {
    return (
      <div
        className="flex items-center justify-center bg-muted/10 rounded-lg border border-dashed"
        style={{ height: typeof height === 'number' ? `${height}px` : height }}
      >
        <div className="text-center px-4">
          <Users className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <p className="font-medium mb-1">{t('no_network_data', 'No network data available')}</p>
          <p className="text-sm text-muted-foreground">
            {t('no_network_hint', 'Select a stakeholder to view their influence network')}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div
      className={`rounded-lg border overflow-hidden bg-background ${className}`}
      style={{ height: typeof height === 'number' ? `${height}px` : height }}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        onEdgeClick={handleEdgeClick}
        nodeTypes={nodeTypes}
        fitView
        attributionPosition={isRTL ? 'bottom-left' : 'bottom-right'}
        proOptions={{ hideAttribution: true }}
        minZoom={0.2}
        maxZoom={2}
        defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
      >
        <Background gap={20} size={1} />
        <Controls position={isRTL ? 'top-left' : 'top-right'} showInteractive={false} />

        {showMiniMap && (
          <MiniMap
            position={isRTL ? 'bottom-right' : 'bottom-left'}
            nodeColor={(node) => {
              const tier = node.data?.tier as InfluenceTier
              return NODE_COLORS[tier] || NODE_COLORS.peripheral
            }}
            maskColor="rgba(0, 0, 0, 0.1)"
            className="bg-background/80 backdrop-blur-sm rounded-lg border"
          />
        )}

        {/* Statistics Panel */}
        {showStats && data?.statistics && (
          <Panel position={isRTL ? 'top-right' : 'top-left'}>
            <Card className="p-3 bg-background/90 backdrop-blur-sm">
              <div className="text-xs space-y-1">
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">{t('nodes', 'Nodes')}:</span>
                  <span className="font-medium">{data.statistics.total_nodes}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">{t('edges', 'Connections')}:</span>
                  <span className="font-medium">{data.statistics.total_edges}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">{t('avg_connections', 'Avg Conn')}:</span>
                  <span className="font-medium">{data.statistics.avg_connections.toFixed(1)}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">{t('density', 'Density')}:</span>
                  <span className="font-medium">{(data.statistics.density * 100).toFixed(1)}%</span>
                </div>
              </div>
            </Card>
          </Panel>
        )}

        {/* Legend Panel */}
        <Panel position="bottom-right" className={isRTL ? 'left-4 right-auto' : ''}>
          <Card className="p-3 bg-background/90 backdrop-blur-sm">
            <div className="text-xs space-y-2">
              <p className="font-medium mb-2">{t('legend', 'Legend')}</p>
              <div className="grid grid-cols-2 gap-2">
                {(Object.entries(NODE_COLORS) as [InfluenceTier, string][]).map(([tier, color]) => (
                  <div key={tier} className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                    <span className="text-muted-foreground">
                      {isRTL ? INFLUENCE_TIER_LABELS[tier].ar : INFLUENCE_TIER_LABELS[tier].en}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </Panel>
      </ReactFlow>
    </div>
  )
}

export default InfluenceNetworkGraph
