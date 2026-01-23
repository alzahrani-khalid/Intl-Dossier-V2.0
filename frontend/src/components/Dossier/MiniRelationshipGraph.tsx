/**
 * MiniRelationshipGraph Component
 * Feature: Collapsible sidebar widget showing mini relationship graph for current dossier
 *
 * Displays immediate relationships (1-degree connections) with:
 * - Relationship type labels (membership, bilateral, partnership)
 * - Click to navigate to connected dossier
 * - Hover for quick preview
 * - 'View Full Graph' link to complete network visualization
 *
 * Mobile-first, RTL support, WCAG 2.1 AA compliant.
 */

import { useState, useCallback, useMemo, memo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from '@tanstack/react-router'
import {
  ReactFlow,
  Node,
  Edge,
  Background,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
  ConnectionMode,
  ReactFlowProvider,
  MarkerType,
  Panel,
  Handle,
  Position,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
// Note: HoverCard not currently used but may be needed for enhanced preview functionality
// import {
//   HoverCard,
//   HoverCardContent,
//   HoverCardTrigger,
// } from '@/components/ui/hover-card'
import { ChevronDown, ChevronUp, Network, ExternalLink, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getDossierDetailPath } from '@/lib/dossier-routes'
import { DossierTypeIcon } from './DossierTypeIcon'
import { useRelationshipsForDossier } from '@/hooks/useRelationships'
import type { Dossier } from '@/lib/dossier-type-guards'
import type { DossierType } from '@/types/relationship.types'
import type { RelationshipWithDossiers } from '@/services/relationship-api'

// ============================================================================
// Types
// ============================================================================

// Local types for graph nodes and edges (derived from relationship data)
interface GraphNode {
  id: string
  type: string
  name_en: string
  name_ar: string
  status: string
  degree: number
  path: string[]
}

interface GraphEdge {
  source_id: string
  target_id: string
  relationship_type: string
}

export interface MiniRelationshipGraphProps {
  /**
   * The dossier to show relationships for
   */
  dossier: Dossier
  /**
   * Whether the widget starts collapsed
   * @default false
   */
  defaultCollapsed?: boolean
  /**
   * Maximum height of the graph area
   * @default '200px'
   */
  maxHeight?: string
  /**
   * Custom CSS classes
   */
  className?: string
}

// ============================================================================
// Constants
// ============================================================================

const NODE_COLORS: Record<string, string> = {
  country: '#3b82f6',
  organization: '#8b5cf6',
  person: '#10b981',
  forum: '#f59e0b',
  engagement: '#ec4899',
  working_group: '#14b8a6',
  topic: '#6366f1',
  elected_official: '#ef4444',
}

const EDGE_COLORS: Record<string, string> = {
  member_of: '#3b82f6',
  participates_in: '#8b5cf6',
  cooperates_with: '#10b981',
  bilateral_relation: '#f59e0b',
  partnership: '#ec4899',
  parent_of: '#14b8a6',
  subsidiary_of: '#6366f1',
  related_to: '#9ca3af',
}

// ============================================================================
// Mini Node Component
// ============================================================================

interface MiniNodeData {
  id: string
  type: string
  name_en: string
  name_ar: string
  status: string
  degree: number
  isCenter?: boolean
  onNavigate?: () => void
}

const MiniDossierNode = memo(({ data }: { data: MiniNodeData }) => {
  const { i18n } = useTranslation()
  const isRTL = i18n.language === 'ar'
  const name = isRTL ? data.name_ar || data.name_en : data.name_en

  const nodeColor = NODE_COLORS[data.type] || '#6b7280'
  const size = data.isCenter ? 50 : 36

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.1 }}
      transition={{ duration: 0.2 }}
      className={cn(
        'relative flex items-center justify-center cursor-pointer',
        data.isCenter && 'ring-2 ring-primary ring-offset-2',
      )}
      style={{ width: size, height: size }}
      onClick={data.onNavigate}
    >
      {/* Connection handles for edges */}
      <Handle
        type="target"
        position={Position.Top}
        className="!w-2 !h-2 !bg-transparent !border-0"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-2 !h-2 !bg-transparent !border-0"
      />
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        className="!w-2 !h-2 !bg-transparent !border-0"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        className="!w-2 !h-2 !bg-transparent !border-0"
      />

      {/* Node circle */}
      <div
        className="absolute inset-0 rounded-full border-2 shadow-md transition-all"
        style={{
          backgroundColor: `${nodeColor}20`,
          borderColor: nodeColor,
        }}
      />

      {/* Type indicator */}
      <div
        className="absolute inset-0 flex items-center justify-center font-bold text-xs"
        style={{ color: nodeColor }}
      >
        {data.type?.[0]?.toUpperCase() || '?'}
      </div>

      {/* Label (only for non-center nodes) */}
      {!data.isCenter && (
        <div className="absolute top-full mt-1 whitespace-nowrap text-[10px] font-medium text-center max-w-[60px] truncate">
          {name}
        </div>
      )}
    </motion.div>
  )
})
MiniDossierNode.displayName = 'MiniDossierNode'

const miniNodeTypes = {
  mini: MiniDossierNode,
}

// ============================================================================
// Quick Preview Component
// ============================================================================

interface DossierPreviewProps {
  node: GraphNode
  isRTL: boolean
  t: (key: string, fallback?: string | Record<string, unknown>) => string
}

function DossierQuickPreview({ node, isRTL, t }: DossierPreviewProps) {
  const displayName = isRTL ? node.name_ar || node.name_en : node.name_en

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <DossierTypeIcon type={node.type as DossierType} size="sm" colored />
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">{displayName}</p>
          <p className="text-xs text-muted-foreground capitalize">
            {t(`type.${node.type}`, node.type)}
          </p>
        </div>
      </div>
      <Badge
        variant={node.status === 'active' ? 'default' : 'secondary'}
        className="w-fit text-[10px]"
      >
        {t(`status.${node.status}`, node.status)}
      </Badge>
      <p className="text-xs text-muted-foreground">
        {t('miniGraph.clickToNavigate', 'Click to view dossier')}
      </p>
    </div>
  )
}

// ============================================================================
// Relationship List Item (for mobile/compact view)
// ============================================================================

interface RelationshipListItemProps {
  node: GraphNode
  relationship: GraphEdge
  isRTL: boolean
  t: (key: string, fallback?: string | Record<string, unknown>) => string
}

function RelationshipListItem({ node, relationship, isRTL, t }: RelationshipListItemProps) {
  const displayName = isRTL ? node.name_ar || node.name_en : node.name_en
  const relationshipLabel = t(
    `relationship.${relationship.relationship_type}`,
    relationship.relationship_type.replace(/_/g, ' '),
  )

  return (
    <Link
      to={getDossierDetailPath(node.id, node.type)}
      className="flex items-center gap-2 p-2 rounded-lg hover:bg-accent/50 transition-colors"
    >
      <DossierTypeIcon type={node.type as DossierType} size="sm" colored />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{displayName}</p>
        <p className="text-xs text-muted-foreground">{relationshipLabel}</p>
      </div>
      <ExternalLink className="size-3 text-muted-foreground shrink-0" />
    </Link>
  )
}

// ============================================================================
// Mini Graph Inner Component
// ============================================================================

interface MiniGraphInnerProps {
  centerDossier: Dossier
  nodes: GraphNode[]
  edges: GraphEdge[]
  height: string
  isRTL: boolean
  t: (key: string, fallback?: string | Record<string, unknown>) => string
}

function MiniGraphInner({ centerDossier, nodes, edges, height, isRTL, t }: MiniGraphInnerProps) {
  const navigate = useNavigate()
  const containerRef = useRef<HTMLDivElement>(null)
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null)

  // Calculate circular layout for 1-degree nodes around center
  const { flowNodes, flowEdges } = useMemo(() => {
    const centerX = 150
    const centerY = 100
    const radius = 70

    // Filter to only 1-degree connections
    const immediateNodes = nodes.filter((n) => n.degree <= 1)
    const immediateEdges = edges.filter((e) => {
      const sourceNode = nodes.find((n) => n.id === e.source_id)
      const targetNode = nodes.find((n) => n.id === e.target_id)
      return sourceNode && targetNode && sourceNode.degree <= 1 && targetNode.degree <= 1
    })

    const flowNodes: Node[] = []
    const flowEdges: Edge[] = []

    // Add center node
    flowNodes.push({
      id: centerDossier.id,
      type: 'mini',
      position: { x: centerX - 25, y: centerY - 25 },
      data: {
        id: centerDossier.id,
        type: centerDossier.type,
        name_en: centerDossier.name_en,
        name_ar: centerDossier.name_ar,
        status: 'active', // Center node is always active since we're viewing it
        degree: 0,
        isCenter: true,
      },
    })

    // Add surrounding nodes in circular layout
    const surroundingNodes = immediateNodes.filter((n) => n.id !== centerDossier.id)
    const angleStep = (2 * Math.PI) / Math.max(surroundingNodes.length, 1)

    surroundingNodes.forEach((node, index) => {
      const angle = index * angleStep - Math.PI / 2 // Start from top
      const x = centerX + radius * Math.cos(angle) - 18
      const y = centerY + radius * Math.sin(angle) - 18

      flowNodes.push({
        id: node.id,
        type: 'mini',
        position: { x, y },
        data: {
          ...node,
          onNavigate: () => {
            navigate({ to: getDossierDetailPath(node.id, node.type) })
          },
        },
      })
    })

    // Add edges
    immediateEdges.forEach((edge, index) => {
      flowEdges.push({
        id: `edge-${index}`,
        source: edge.source_id,
        target: edge.target_id,
        type: 'smoothstep',
        style: {
          stroke: EDGE_COLORS[edge.relationship_type] || '#9ca3af',
          strokeWidth: 1.5,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 10,
          height: 10,
          color: EDGE_COLORS[edge.relationship_type] || '#9ca3af',
        },
        label: edge.relationship_type.replace(/_/g, ' '),
        labelStyle: {
          fontSize: 8,
          fill: '#6b7280',
        },
        labelBgStyle: {
          fill: 'white',
          fillOpacity: 0.8,
        },
      })
    })

    return { flowNodes, flowEdges }
  }, [centerDossier, nodes, edges, navigate])

  const [reactFlowNodes] = useNodesState(flowNodes)
  const [reactFlowEdges] = useEdgesState(flowEdges)

  // Find hovered node data for preview
  const hoveredNodeData = useMemo(() => {
    if (!hoveredNode) return null
    return nodes.find((n) => n.id === hoveredNode.id)
  }, [hoveredNode, nodes])

  const handleNodeMouseEnter = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      if (node.id !== centerDossier.id) {
        const graphNode = nodes.find((n) => n.id === node.id)
        if (graphNode) {
          setHoveredNode(graphNode)
        }
      }
    },
    [centerDossier.id, nodes],
  )

  const handleNodeMouseLeave = useCallback(() => {
    setHoveredNode(null)
  }, [])

  const handleNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      if (node.id !== centerDossier.id) {
        const graphNode = nodes.find((n) => n.id === node.id)
        if (graphNode) {
          navigate({ to: getDossierDetailPath(graphNode.id, graphNode.type) })
        }
      }
    },
    [centerDossier.id, nodes, navigate],
  )

  return (
    <div
      ref={containerRef}
      className="relative w-full rounded-lg border bg-background/50 overflow-hidden"
      style={{ height }}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <ReactFlow
        nodes={reactFlowNodes}
        edges={reactFlowEdges}
        nodeTypes={miniNodeTypes}
        connectionMode={ConnectionMode.Loose}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        onNodeMouseEnter={handleNodeMouseEnter}
        onNodeMouseLeave={handleNodeMouseLeave}
        onNodeClick={handleNodeClick}
        panOnDrag={false}
        zoomOnScroll={false}
        zoomOnPinch={false}
        zoomOnDoubleClick={false}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        attributionPosition={isRTL ? 'bottom-left' : 'bottom-right'}
        proOptions={{ hideAttribution: true }}
      >
        <Background variant={BackgroundVariant.Dots} gap={12} size={0.5} color="#e5e7eb" />

        {/* Stats Panel */}
        <Panel
          position={isRTL ? 'top-left' : 'top-right'}
          className="bg-background/80 px-2 py-1 rounded text-[10px] text-muted-foreground"
        >
          {flowNodes.length - 1} {t('miniGraph.connections', 'connections')}
        </Panel>
      </ReactFlow>

      {/* Hover Preview */}
      <AnimatePresence>
        {hoveredNodeData && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            className={cn(
              'absolute bottom-2 bg-popover border rounded-lg shadow-lg p-3 z-10',
              isRTL ? 'start-2' : 'end-2',
            )}
            style={{ maxWidth: '200px' }}
          >
            <DossierQuickPreview node={hoveredNodeData} isRTL={isRTL} t={t} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ============================================================================
// Main Component
// ============================================================================

export function MiniRelationshipGraph({
  dossier,
  defaultCollapsed = false,
  maxHeight = '200px',
  className,
}: MiniRelationshipGraphProps) {
  const { t, i18n } = useTranslation('graph')
  const isRTL = i18n.language === 'ar'

  // State
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed)

  // Fetch relationships data (using same source as main RelationshipGraph)
  // Note: page is 0-indexed, so page=0 means offset=0
  const {
    data: relationshipsData,
    isLoading,
    isError,
    refetch,
  } = useRelationshipsForDossier(
    dossier.id,
    0, // page (0-indexed) - first page
    50, // page_size - enough for mini graph
    {
      enabled: !isCollapsed, // Only fetch when expanded
    },
  )

  // Transform relationships into nodes and edges format
  const data = useMemo(() => {
    const relationships = relationshipsData?.data || []

    if (relationships.length === 0) {
      return { nodes: [] as GraphNode[], edges: [] as GraphEdge[] }
    }

    const nodesMap = new Map<string, GraphNode>()
    const edges: GraphEdge[] = []

    // Add center node (current dossier)
    nodesMap.set(dossier.id, {
      id: dossier.id,
      type: dossier.type,
      name_en: dossier.name_en,
      name_ar: dossier.name_ar || '',
      status: 'active',
      degree: 0,
      path: [dossier.id],
    })

    // Process relationships to extract nodes and edges
    relationships.forEach((rel: RelationshipWithDossiers) => {
      // Add source dossier node if not the center and not already added
      if (
        rel.source_dossier &&
        rel.source_dossier.id !== dossier.id &&
        !nodesMap.has(rel.source_dossier.id)
      ) {
        nodesMap.set(rel.source_dossier.id, {
          id: rel.source_dossier.id,
          type: rel.source_dossier.type,
          name_en: rel.source_dossier.name_en,
          name_ar: rel.source_dossier.name_ar || '',
          status: 'active',
          degree: 1,
          path: [dossier.id, rel.source_dossier.id],
        })
      }

      // Add target dossier node if not the center and not already added
      if (
        rel.target_dossier &&
        rel.target_dossier.id !== dossier.id &&
        !nodesMap.has(rel.target_dossier.id)
      ) {
        nodesMap.set(rel.target_dossier.id, {
          id: rel.target_dossier.id,
          type: rel.target_dossier.type,
          name_en: rel.target_dossier.name_en,
          name_ar: rel.target_dossier.name_ar || '',
          status: 'active',
          degree: 1,
          path: [dossier.id, rel.target_dossier.id],
        })
      }

      // Add edge
      edges.push({
        source_id: rel.source_dossier_id,
        target_id: rel.target_dossier_id,
        relationship_type: rel.relationship_type,
      })
    })

    return {
      nodes: Array.from(nodesMap.values()),
      edges,
    }
  }, [relationshipsData, dossier])

  const hasConnections = data && data.nodes.length > 1

  // Loading state
  if (isLoading && !isCollapsed) {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Network className="size-4" />
            <Skeleton className="h-5 w-32" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[200px] w-full" />
        </CardContent>
      </Card>
    )
  }

  // Error state
  if (isError && !isCollapsed) {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Network className="size-4" />
            {t('miniGraph.title', 'Relationships')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-destructive text-sm p-3 bg-destructive/10 rounded-lg">
            <AlertCircle className="size-4 shrink-0" />
            <span>{t('error', 'Failed to load graph data')}</span>
            <Button variant="ghost" size="sm" onClick={() => refetch()} className="ms-auto">
              {t('retry', 'Retry')}
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <Collapsible open={!isCollapsed} onOpenChange={(open) => setIsCollapsed(!open)}>
        <CardHeader className="pb-3">
          <CollapsibleTrigger asChild>
            <button className="flex items-center justify-between w-full text-start group">
              <CardTitle className="flex items-center gap-2 text-base">
                <Network className="size-4" />
                {t('miniGraph.title', 'Relationships')}
                {hasConnections && (
                  <Badge variant="secondary" className="ms-2 text-[10px]">
                    {(data?.nodes.length || 1) - 1}
                  </Badge>
                )}
              </CardTitle>
              <div className="flex items-center gap-1 text-muted-foreground group-hover:text-foreground transition-colors">
                {isCollapsed ? (
                  <ChevronDown className="size-4" />
                ) : (
                  <ChevronUp className="size-4" />
                )}
              </div>
            </button>
          </CollapsibleTrigger>
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="pt-0 space-y-3">
            {/* No connections state */}
            {!hasConnections && !isLoading && (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <Network className="size-10 text-muted-foreground/50 mb-3" />
                <p className="text-sm text-muted-foreground">
                  {t('miniGraph.noConnections', 'No relationships found')}
                </p>
              </div>
            )}

            {/* Mini Graph (hidden on mobile, shown on sm+) */}
            {hasConnections && data && (
              <>
                <div className="hidden sm:block">
                  <ReactFlowProvider>
                    <MiniGraphInner
                      centerDossier={dossier}
                      nodes={data.nodes}
                      edges={data.edges}
                      height={maxHeight}
                      isRTL={isRTL}
                      t={t as any}
                    />
                  </ReactFlowProvider>
                </div>

                {/* List view for mobile */}
                <div className="sm:hidden space-y-1">
                  {data.nodes
                    .filter((n) => n.id !== dossier.id)
                    .slice(0, 5)
                    .map((node) => {
                      const relationship = data.edges.find(
                        (e) => e.source_id === node.id || e.target_id === node.id,
                      )
                      return (
                        relationship && (
                          <RelationshipListItem
                            key={node.id}
                            node={node}
                            relationship={relationship}
                            isRTL={isRTL}
                            t={t as any}
                          />
                        )
                      )
                    })}
                  {data.nodes.length > 6 && (
                    <p className="text-xs text-muted-foreground text-center pt-2">
                      {t('miniGraph.moreConnections', '+{{count}} more', {
                        count: data.nodes.length - 6,
                      })}
                    </p>
                  )}
                </div>
              </>
            )}

            {/* View Full Graph Link */}
            <Button variant="outline" size="sm" className="w-full min-h-10" asChild>
              <Link to="/relationships/graph" search={{ dossierId: dossier.id } as any}>
                <Network className={cn('size-4', isRTL ? 'ms-2' : 'me-2')} />
                {t('miniGraph.viewFullGraph', 'View Full Graph')}
                <ExternalLink className={cn('size-3', isRTL ? 'me-2' : 'ms-2')} />
              </Link>
            </Button>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}

export default MiniRelationshipGraph
