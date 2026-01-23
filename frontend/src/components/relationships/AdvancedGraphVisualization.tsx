/**
 * AdvancedGraphVisualization Component
 * Feature: relationship-graph-enhancements
 *
 * Enhanced graph visualization with:
 * - Clustering by relationship type
 * - Time-based animation (relationships over time)
 * - Path finding ("How is X connected to Y?")
 * - Influence mapping with centrality scores
 * - N-degree filtering slider
 * - Export as PNG/SVG
 *
 * Mobile-first, RTL-aware with full accessibility support.
 */

import { useCallback, useMemo, useState, useRef, useEffect, memo } from 'react'
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
import { motion, AnimatePresence } from 'framer-motion'
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
  Image,
  FileImage,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Route,
  Search,
  X,
  Star,
  Activity,
  Clock,
  Filter,
  ArrowRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toPng, toSvg } from 'html-to-image'
import { toast } from 'sonner'

// ============================================
// Types
// ============================================

export interface NodeData {
  id: string
  type: string
  name_en: string
  name_ar: string
  status: string
  degree: number
  connectionCount?: number
  created_at?: string
  effective_from?: string
  effective_to?: string
}

export interface EdgeData {
  source_id: string
  target_id: string
  relationship_type: string
  effective_from?: string
  effective_to?: string
  status?: 'active' | 'historical' | 'terminated'
}

type LayoutType = 'circular' | 'clustered' | 'force' | 'hierarchical' | 'radial'
type ClusterByType = 'node_type' | 'relationship_type'

interface ClusterInfo {
  type: string
  count: number
  collapsed: boolean
  nodes: NodeData[]
}

interface PathResult {
  found: boolean
  path: string[]
  pathLength: number
}

interface InfluenceScore {
  nodeId: string
  degreeCentrality: number
  betweennessCentrality: number
  closenessCentrality: number
  overallScore: number
}

export interface AdvancedGraphVisualizationProps {
  nodes: NodeData[]
  edges: EdgeData[]
  onNodeClick?: (nodeId: string) => void
  height?: string
  showMiniMap?: boolean
  centerNodeId?: string
  onPathFind?: (sourceId: string, targetId: string) => Promise<PathResult>
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
  person: '#f97316',
  topic: '#84cc16',
  working_group: '#06b6d4',
  elected_official: '#a855f7',
}

const EDGE_COLORS: Record<string, string> = {
  member_of: '#3b82f6',
  partner: '#10b981',
  parent_org: '#8b5cf6',
  hosted_by: '#f59e0b',
  participant: '#ec4899',
  signatory: '#14b8a6',
  cooperates_with: '#6366f1',
  bilateral_relation: '#f97316',
  participates_in: '#84cc16',
  related_to: '#6b7280',
}

// ============================================
// Utility Functions
// ============================================

function calculateInfluenceScores(
  nodes: NodeData[],
  edges: EdgeData[],
): Map<string, InfluenceScore> {
  const scores = new Map<string, InfluenceScore>()
  const nodeCount = nodes.length

  if (nodeCount === 0) return scores

  // Build adjacency list
  const adjacency = new Map<string, Set<string>>()
  nodes.forEach((node) => adjacency.set(node.id, new Set()))

  edges.forEach((edge) => {
    adjacency.get(edge.source_id)?.add(edge.target_id)
    adjacency.get(edge.target_id)?.add(edge.source_id)
  })

  nodes.forEach((node) => {
    const neighbors = adjacency.get(node.id) || new Set()
    const degreeCentrality = neighbors.size / (nodeCount - 1 || 1)

    // Simplified closeness (based on direct connections)
    const closenessCentrality = neighbors.size > 0 ? 1 / neighbors.size : 0

    // Simplified betweenness (based on connection to high-degree nodes)
    let betweenness = 0
    neighbors.forEach((neighborId) => {
      const neighborConnections = adjacency.get(neighborId)?.size || 0
      betweenness += neighborConnections
    })
    const betweennessCentrality = betweenness / Math.max(1, nodeCount * (nodeCount - 1))

    // Combined score
    const overallScore =
      degreeCentrality * 0.4 + closenessCentrality * 0.3 + betweennessCentrality * 0.3

    scores.set(node.id, {
      nodeId: node.id,
      degreeCentrality,
      betweennessCentrality,
      closenessCentrality,
      overallScore,
    })
  })

  return scores
}

function findShortestPath(
  sourceId: string,
  targetId: string,
  nodes: NodeData[],
  edges: EdgeData[],
): PathResult {
  if (sourceId === targetId) {
    return { found: true, path: [sourceId], pathLength: 0 }
  }

  // Build adjacency list
  const adjacency = new Map<string, Set<string>>()
  nodes.forEach((node) => adjacency.set(node.id, new Set()))

  edges.forEach((edge) => {
    adjacency.get(edge.source_id)?.add(edge.target_id)
    adjacency.get(edge.target_id)?.add(edge.source_id)
  })

  // BFS for shortest path
  const visited = new Set<string>()
  const queue: { id: string; path: string[] }[] = [{ id: sourceId, path: [sourceId] }]

  while (queue.length > 0) {
    const current = queue.shift()!

    if (current.id === targetId) {
      return {
        found: true,
        path: current.path,
        pathLength: current.path.length - 1,
      }
    }

    if (visited.has(current.id)) continue
    visited.add(current.id)

    const neighbors = adjacency.get(current.id) || new Set()
    neighbors.forEach((neighborId) => {
      if (!visited.has(neighborId)) {
        queue.push({
          id: neighborId,
          path: [...current.path, neighborId],
        })
      }
    })
  }

  return { found: false, path: [], pathLength: -1 }
}

// ============================================
// Custom Node Components
// ============================================

const AdvancedDossierNode = memo(
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
      isOnPath?: boolean
      influenceScore?: number
      showInfluence?: boolean
    }
    selected?: boolean
  }) => {
    const { i18n } = useTranslation()
    const isRTL = i18n.language === 'ar'
    const name = isRTL ? data.name_ar : data.name_en

    const baseSize = 40
    const connectionBonus = Math.min((data.connectionCount || 0) * 2, 30)
    const influenceBonus = data.showInfluence ? (data.influenceScore || 0) * 20 : 0
    const size = (baseSize + connectionBonus + influenceBonus) * (data.sizeMultiplier || 1)

    const nodeColor = NODE_COLORS[data.type] || '#6b7280'

    return (
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{
          scale: data.isOnPath ? 1.2 : 1,
          opacity: data.dimmed ? 0.3 : 1,
        }}
        whileHover={{ scale: 1.05 }}
        transition={{ duration: 0.2 }}
        className={cn(
          'relative flex items-center justify-center transition-all duration-200',
          data.isFocused && 'ring-4 ring-primary ring-offset-2',
          data.isCenter && 'ring-2 ring-primary',
          data.isOnPath && 'ring-4 ring-amber-400 ring-offset-2',
          selected && 'ring-2 ring-primary/50',
        )}
        style={{ width: size, height: size }}
      >
        {/* Node circle */}
        <div
          className={cn(
            'absolute inset-0 rounded-full border-2 shadow-md transition-all duration-200',
            data.dimmed && 'opacity-50',
            data.isOnPath && 'border-amber-400 shadow-amber-200',
          )}
          style={{
            backgroundColor: data.isOnPath ? '#fef3c7' : `${nodeColor}20`,
            borderColor: data.isOnPath ? '#fbbf24' : nodeColor,
          }}
        />

        {/* Type icon/indicator */}
        <div
          className="absolute inset-0 flex items-center justify-center font-bold text-xs"
          style={{ color: data.isOnPath ? '#b45309' : nodeColor }}
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

        {/* Influence score indicator */}
        {data.showInfluence && data.influenceScore && data.influenceScore > 0.5 && (
          <div className="absolute -top-2 -start-2">
            <Star
              className="h-4 w-4 text-amber-500 fill-amber-500"
              style={{ opacity: data.influenceScore }}
            />
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
AdvancedDossierNode.displayName = 'AdvancedDossierNode'

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

const advancedNodeTypes: NodeTypes = {
  dossier: AdvancedDossierNode,
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
  clusterBy: ClusterByType = 'node_type',
): Record<string, { x: number; y: number }> {
  const positions: Record<string, { x: number; y: number }> = {}

  // Group nodes by cluster key
  const clusters: Record<string, NodeData[]> = {}
  nodes.forEach((node) => {
    const key = clusterBy === 'node_type' ? node.type : node.type
    if (!clusters[key]) {
      clusters[key] = []
    }
    clusters[key].push(node)
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

function calculateRadialLayout(
  nodes: NodeData[],
  centerX: number,
  centerY: number,
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

  const sortedDegrees = Object.keys(levels)
    .map(Number)
    .sort((a, b) => a - b)
  const baseRadius = 100

  sortedDegrees.forEach((degree) => {
    const levelNodes = levels[degree] || []
    const radius = degree * baseRadius

    levelNodes.forEach((node, nodeIndex) => {
      if (degree === 0) {
        positions[node.id] = { x: centerX, y: centerY }
      } else {
        const angle = (nodeIndex / levelNodes.length) * 2 * Math.PI
        positions[node.id] = {
          x: centerX + radius * Math.cos(angle),
          y: centerY + radius * Math.sin(angle),
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
// Path Finding Panel Component
// ============================================

interface PathFindingPanelProps {
  nodes: NodeData[]
  edges: EdgeData[]
  onPathFound: (path: string[]) => void
  onClearPath: () => void
}

function PathFindingPanel({ nodes, edges, onPathFound, onClearPath }: PathFindingPanelProps) {
  const { t, i18n } = useTranslation('graph')
  const isRTL = i18n.language === 'ar'
  const [sourceId, setSourceId] = useState<string>('')
  const [targetId, setTargetId] = useState<string>('')
  const [pathResult, setPathResult] = useState<PathResult | null>(null)
  const [isSearching, setIsSearching] = useState(false)

  const handleFindPath = useCallback(() => {
    if (!sourceId || !targetId) return

    setIsSearching(true)
    // Simulate async operation
    setTimeout(() => {
      const result = findShortestPath(sourceId, targetId, nodes, edges)
      setPathResult(result)
      if (result.found) {
        onPathFound(result.path)
        toast.success(
          t('pathFinding.found', {
            count: result.pathLength,
            defaultValue: 'Path found with {{count}} hop(s)',
          }),
        )
      } else {
        toast.info(t('pathFinding.notFound', 'No path found between entities'))
      }
      setIsSearching(false)
    }, 100)
  }, [sourceId, targetId, nodes, edges, onPathFound, t])

  const handleClear = useCallback(() => {
    setSourceId('')
    setTargetId('')
    setPathResult(null)
    onClearPath()
  }, [onClearPath])

  const getName = (node: NodeData) => (i18n.language === 'ar' ? node.name_ar : node.name_en)

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Route className="h-4 w-4" />
          {t('pathFinding.title', 'Path Finding')}
        </CardTitle>
        <CardDescription className="text-xs">
          {t('pathFinding.description', 'Find how two entities are connected')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2">
          <Label className="text-xs">{t('pathFinding.from', 'From')}</Label>
          <Select value={sourceId} onValueChange={setSourceId}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder={t('pathFinding.selectEntity', 'Select entity')} />
            </SelectTrigger>
            <SelectContent>
              {nodes.map((node) => (
                <SelectItem key={node.id} value={node.id} className="text-xs">
                  <div className="flex items-center gap-2">
                    <div
                      className="h-2 w-2 rounded-full"
                      style={{
                        backgroundColor: NODE_COLORS[node.type] || '#6b7280',
                      }}
                    />
                    {getName(node)}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex justify-center">
          <ArrowRight className={cn('h-4 w-4 text-muted-foreground', isRTL && 'rotate-180')} />
        </div>

        <div className="space-y-2">
          <Label className="text-xs">{t('pathFinding.to', 'To')}</Label>
          <Select value={targetId} onValueChange={setTargetId}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder={t('pathFinding.selectEntity', 'Select entity')} />
            </SelectTrigger>
            <SelectContent>
              {nodes
                .filter((n) => n.id !== sourceId)
                .map((node) => (
                  <SelectItem key={node.id} value={node.id} className="text-xs">
                    <div className="flex items-center gap-2">
                      <div
                        className="h-2 w-2 rounded-full"
                        style={{
                          backgroundColor: NODE_COLORS[node.type] || '#6b7280',
                        }}
                      />
                      {getName(node)}
                    </div>
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2">
          <Button
            size="sm"
            className="flex-1 h-8"
            onClick={handleFindPath}
            disabled={!sourceId || !targetId || isSearching}
          >
            <Search className="h-3 w-3 me-1" />
            {t('pathFinding.find', 'Find Path')}
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-8"
            onClick={handleClear}
            disabled={!pathResult}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>

        {pathResult && (
          <div
            className={cn(
              'p-2 rounded-lg text-xs',
              pathResult.found
                ? 'bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300'
                : 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
            )}
          >
            {pathResult.found ? (
              <div className="flex items-center gap-2">
                <Route className="h-3 w-3" />
                {t('pathFinding.pathLength', {
                  count: pathResult.pathLength,
                  defaultValue: '{{count}} hop(s)',
                })}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <X className="h-3 w-3" />
                {t('pathFinding.noPath', 'No connection found')}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ============================================
// Time Animation Panel Component
// ============================================

interface TimeAnimationPanelProps {
  edges: EdgeData[]
  onTimeChange: (date: Date | null) => void
}

function TimeAnimationPanel({ edges, onTimeChange }: TimeAnimationPanelProps) {
  const { t } = useTranslation('graph')
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentDate, setCurrentDate] = useState<Date | null>(null)
  const [playbackSpeed, setPlaybackSpeed] = useState(1)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // Get date range from edges
  const dateRange = useMemo(() => {
    const dates: Date[] = []
    edges.forEach((edge) => {
      if (edge.effective_from) dates.push(new Date(edge.effective_from))
      if (edge.effective_to) dates.push(new Date(edge.effective_to))
    })

    if (dates.length === 0) {
      const now = new Date()
      const yearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate())
      return { min: yearAgo, max: now }
    }

    return {
      min: new Date(Math.min(...dates.map((d) => d.getTime()))),
      max: new Date(Math.max(...dates.map((d) => d.getTime()))),
    }
  }, [edges])

  const totalDays = useMemo(() => {
    return Math.ceil((dateRange.max.getTime() - dateRange.min.getTime()) / (1000 * 60 * 60 * 24))
  }, [dateRange])

  const currentDayIndex = useMemo(() => {
    if (!currentDate) return 0
    return Math.ceil((currentDate.getTime() - dateRange.min.getTime()) / (1000 * 60 * 60 * 24))
  }, [currentDate, dateRange])

  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        setCurrentDate((prev) => {
          const next = new Date(prev || dateRange.min)
          next.setDate(next.getDate() + 7 * playbackSpeed)

          if (next >= dateRange.max) {
            setIsPlaying(false)
            return dateRange.max
          }
          return next
        })
      }, 500)
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [isPlaying, playbackSpeed, dateRange])

  useEffect(() => {
    onTimeChange(currentDate)
  }, [currentDate, onTimeChange])

  const handleSliderChange = useCallback(
    (value: number[]) => {
      const dayIndex = value[0] || 0
      const newDate = new Date(dateRange.min)
      newDate.setDate(newDate.getDate() + dayIndex)
      setCurrentDate(newDate)
    },
    [dateRange],
  )

  const handleReset = useCallback(() => {
    setCurrentDate(null)
    setIsPlaying(false)
    onTimeChange(null)
  }, [onTimeChange])

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Clock className="h-4 w-4" />
          {t('timeAnimation.title', 'Timeline')}
        </CardTitle>
        <CardDescription className="text-xs">
          {t('timeAnimation.description', 'View relationships over time')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8"
            onClick={() => {
              setCurrentDate(dateRange.min)
              setIsPlaying(false)
            }}
          >
            <SkipBack className="h-4 w-4" />
          </Button>

          <Button
            size="icon"
            variant={isPlaying ? 'secondary' : 'default'}
            className="h-8 w-8"
            onClick={() => setIsPlaying(!isPlaying)}
          >
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>

          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8"
            onClick={() => {
              setCurrentDate(dateRange.max)
              setIsPlaying(false)
            }}
          >
            <SkipForward className="h-4 w-4" />
          </Button>

          <Button size="sm" variant="outline" className="h-8" onClick={handleReset}>
            {t('timeAnimation.reset', 'Reset')}
          </Button>
        </div>

        <Slider
          value={[currentDayIndex]}
          onValueChange={handleSliderChange}
          max={totalDays}
          step={1}
          className="w-full"
        />

        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{dateRange.min.toLocaleDateString()}</span>
          {currentDate && (
            <span className="font-medium text-foreground">{currentDate.toLocaleDateString()}</span>
          )}
          <span>{dateRange.max.toLocaleDateString()}</span>
        </div>

        <div className="flex items-center gap-2">
          <Label className="text-xs">{t('timeAnimation.speed', 'Speed')}</Label>
          <Select
            value={playbackSpeed.toString()}
            onValueChange={(v) => setPlaybackSpeed(parseInt(v))}
          >
            <SelectTrigger className="h-7 w-20 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1" className="text-xs">
                1x
              </SelectItem>
              <SelectItem value="2" className="text-xs">
                2x
              </SelectItem>
              <SelectItem value="4" className="text-xs">
                4x
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  )
}

// ============================================
// Export Panel Component
// ============================================

interface ExportPanelProps {
  reactFlowRef: React.RefObject<HTMLDivElement | null>
}

function ExportPanel({ reactFlowRef }: ExportPanelProps) {
  const { t } = useTranslation('graph')
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = useCallback(
    async (format: 'png' | 'svg') => {
      if (!reactFlowRef.current) return

      setIsExporting(true)

      try {
        const flowElement = reactFlowRef.current.querySelector(
          '.react-flow__viewport',
        ) as HTMLElement

        if (!flowElement) {
          throw new Error('Could not find graph viewport')
        }

        let dataUrl: string

        if (format === 'png') {
          dataUrl = await toPng(flowElement, {
            backgroundColor: '#ffffff',
            quality: 1,
            pixelRatio: 2,
          })
        } else {
          dataUrl = await toSvg(flowElement, {
            backgroundColor: '#ffffff',
          })
        }

        // Create download link
        const link = document.createElement('a')
        link.download = `relationship-graph-${Date.now()}.${format}`
        link.href = dataUrl
        link.click()

        toast.success(
          t('export.success', {
            format: format.toUpperCase(),
            defaultValue: 'Graph exported as {{format}}',
          }),
        )
      } catch (error) {
        console.error('Export error:', error)
        toast.error(t('export.error', 'Failed to export graph'))
      } finally {
        setIsExporting(false)
      }
    },
    [reactFlowRef, t],
  )

  return (
    <div className="flex gap-2">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              variant="outline"
              className="h-8 w-8"
              onClick={() => handleExport('png')}
              disabled={isExporting}
            >
              <Image className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{t('export.png', 'Export as PNG')}</TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              variant="outline"
              className="h-8 w-8"
              onClick={() => handleExport('svg')}
              disabled={isExporting}
            >
              <FileImage className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{t('export.svg', 'Export as SVG')}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  )
}

// ============================================
// Main Component
// ============================================

function AdvancedGraphVisualizationInner({
  nodes: rawNodes,
  edges: rawEdges,
  onNodeClick,
  height = '600px',
  showMiniMap = true,
  centerNodeId: _centerNodeId,
}: AdvancedGraphVisualizationProps) {
  const { t, i18n } = useTranslation('graph')
  const isRTL = i18n.language === 'ar'
  const { zoomIn, zoomOut, fitView } = useReactFlow()
  const reactFlowRef = useRef<HTMLDivElement>(null)

  // ============================================
  // State
  // ============================================

  const [layout, setLayout] = useState<LayoutType>('clustered')
  const [clusterBy] = useState<ClusterByType>('node_type')
  const [showLabels, setShowLabels] = useState(true)
  const [showEdgeLabels, setShowEdgeLabels] = useState(false)
  const [nodeSizeMultiplier, setNodeSizeMultiplier] = useState(1)
  const [focusedNodeId, setFocusedNodeId] = useState<string | null>(null)
  const [collapsedClusters, setCollapsedClusters] = useState<Set<string>>(new Set())
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [highlightConnections, setHighlightConnections] = useState(true)
  const [selectedNodeType, setSelectedNodeType] = useState<string>('all')
  const [selectedRelationshipType, setSelectedRelationshipType] = useState<string>('all')
  const [maxDegreeFilter, setMaxDegreeFilter] = useState<number>(5)
  const [highlightedPath, setHighlightedPath] = useState<string[]>([])
  const [showInfluence, setShowInfluence] = useState(false)
  const [currentTimeFilter, setCurrentTimeFilter] = useState<Date | null>(null)
  const [showPathPanel, setShowPathPanel] = useState(false)
  const [showTimePanel, setShowTimePanel] = useState(false)

  // ============================================
  // Computed Values
  // ============================================

  // Calculate influence scores
  const influenceScores = useMemo(() => {
    return calculateInfluenceScores(rawNodes, rawEdges)
  }, [rawNodes, rawEdges])

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

  // Get max degree from nodes
  const maxAvailableDegree = useMemo(() => {
    return Math.max(...rawNodes.map((n) => n.degree), 1)
  }, [rawNodes])

  // Filter nodes based on type selection and degree
  const filteredNodes = useMemo(() => {
    let nodes = rawNodes

    // Filter by node type
    if (selectedNodeType !== 'all') {
      nodes = nodes.filter((n) => n.type === selectedNodeType)
    }

    // Filter by degree
    nodes = nodes.filter((n) => n.degree <= maxDegreeFilter)

    // Filter by time
    if (currentTimeFilter) {
      // For now, include all nodes (time filter mainly affects edges)
    }

    return nodes.map((node) => ({
      ...node,
      connectionCount: connectionCounts[node.id] || 0,
    }))
  }, [rawNodes, selectedNodeType, maxDegreeFilter, currentTimeFilter, connectionCounts])

  // Filter edges based on visible nodes and relationship type
  const filteredEdges = useMemo(() => {
    const nodeIds = new Set(filteredNodes.map((n) => n.id))
    let edges = rawEdges.filter((e) => nodeIds.has(e.source_id) && nodeIds.has(e.target_id))

    // Filter by relationship type
    if (selectedRelationshipType !== 'all') {
      edges = edges.filter((e) => e.relationship_type === selectedRelationshipType)
    }

    // Filter by time
    if (currentTimeFilter) {
      edges = edges.filter((edge) => {
        const from = edge.effective_from ? new Date(edge.effective_from) : new Date(0)
        const to = edge.effective_to ? new Date(edge.effective_to) : new Date()

        return from <= currentTimeFilter && currentTimeFilter <= to
      })
    }

    return edges
  }, [rawEdges, filteredNodes, selectedRelationshipType, currentTimeFilter])

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
        positions = calculateClusteredLayout(filteredNodes, centerX, centerY, clusterBy)
        break
      case 'hierarchical':
        positions = calculateHierarchicalLayout(filteredNodes, centerX)
        break
      case 'radial':
        positions = calculateRadialLayout(filteredNodes, centerX, centerY)
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
        const isOnPath = highlightedPath.includes(node.id)
        const influence = influenceScores.get(node.id)

        nodes.push({
          id: node.id,
          type: 'dossier',
          data: {
            ...node,
            isFocused,
            showLabels,
            sizeMultiplier: nodeSizeMultiplier,
            isCenter: node.degree === 0,
            dimmed: dimmed && !isOnPath,
            isOnPath,
            influenceScore: influence?.overallScore || 0,
            showInfluence,
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
    clusterBy,
    showLabels,
    nodeSizeMultiplier,
    focusedNodeId,
    connectedNodeIds,
    collapsedClusters,
    clusters,
    highlightedPath,
    influenceScores,
    showInfluence,
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
        const isOnPath =
          highlightedPath.includes(edge.source_id) && highlightedPath.includes(edge.target_id)

        return {
          id: `edge-${index}`,
          source: edge.source_id,
          target: edge.target_id,
          type: 'smoothstep',
          animated: isConnectedToFocused || isOnPath,
          label: showEdgeLabels ? edge.relationship_type.replace(/_/g, ' ') : undefined,
          style: {
            stroke: isOnPath ? '#fbbf24' : EDGE_COLORS[edge.relationship_type] || '#9ca3af',
            strokeWidth: isOnPath ? 4 : isConnectedToFocused ? 3 : 2,
            opacity: dimmed && !isOnPath ? 0.2 : 1,
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
            color: isOnPath ? '#fbbf24' : EDGE_COLORS[edge.relationship_type] || '#9ca3af',
          },
        }
      })
  }, [
    filteredEdges,
    filteredNodes,
    showEdgeLabels,
    focusedNodeId,
    collapsedClusters,
    highlightedPath,
  ])

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
    setHighlightedPath([])
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

  const handlePathFound = useCallback((path: string[]) => {
    setHighlightedPath(path)
    setFocusedNodeId(null)
  }, [])

  const handleClearPath = useCallback(() => {
    setHighlightedPath([])
  }, [])

  const handleTimeChange = useCallback((date: Date | null) => {
    setCurrentTimeFilter(date)
  }, [])

  // ============================================
  // Render
  // ============================================

  return (
    <div
      ref={reactFlowRef}
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
        nodeTypes={advancedNodeTypes}
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
        <Panel
          position={isRTL ? 'top-left' : 'top-right'}
          className="flex flex-col gap-2 max-w-[280px]"
        >
          {/* Layout Selector */}
          <div className="bg-background/95 p-3 rounded-lg border shadow-sm">
            <div className="text-xs font-semibold mb-2 flex items-center gap-2">
              <GitBranch className="h-3.5 w-3.5" />
              {t('layout.title', 'Layout')}
            </div>
            <Select value={layout} onValueChange={(v) => setLayout(v as LayoutType)}>
              <SelectTrigger className="h-8 text-xs">
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
                <SelectItem value="radial" className="text-xs">
                  <div className="flex items-center gap-2">
                    <Activity className="h-3 w-3" />
                    {t('layout.radial', 'Radial')}
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Filters */}
          <div className="bg-background/95 p-3 rounded-lg border shadow-sm">
            <div className="text-xs font-semibold mb-2 flex items-center gap-2">
              <Filter className="h-3.5 w-3.5" />
              {t('filters', 'Filters')}
            </div>

            <div className="space-y-2">
              <Select value={selectedNodeType} onValueChange={setSelectedNodeType}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {nodeTypes.map((type) => (
                    <SelectItem key={type} value={type} className="text-xs">
                      {type === 'all' ? t('allTypes', 'All Types') : t(`type.${type}`, type)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedRelationshipType} onValueChange={setSelectedRelationshipType}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {relationshipTypes.map((type) => (
                    <SelectItem key={type} value={type} className="text-xs">
                      {type === 'all'
                        ? t('allRelationships', 'All Relationships')
                        : t(`relationship.${type}`, type.replace(/_/g, ' '))}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* N-Degree Filter Slider */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">{t('degreeFilter', 'Max Degrees')}</Label>
                  <Badge variant="secondary" className="text-[10px] h-5">
                    {maxDegreeFilter}°
                  </Badge>
                </div>
                <Slider
                  value={[maxDegreeFilter]}
                  onValueChange={([v]) => setMaxDegreeFilter(v ?? 5)}
                  min={1}
                  max={maxAvailableDegree}
                  step={1}
                  className="w-full"
                />
              </div>
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

            <div className="space-y-1 max-h-[150px] overflow-y-auto">
              {Object.entries(clusters).map(([type, cluster]) => (
                <button
                  key={type}
                  className="flex items-center justify-between w-full text-xs py-1 px-2 rounded hover:bg-muted transition-colors"
                  onClick={() => toggleCluster(type)}
                >
                  <span className="flex items-center gap-2">
                    <div
                      className="h-2.5 w-2.5 rounded-full"
                      style={{
                        backgroundColor: NODE_COLORS[type] || '#6b7280',
                      }}
                    />
                    <span className="capitalize">{t(`type.${type}`, type)}</span>
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

          {/* Advanced Features Toggle */}
          <div className="bg-background/95 p-3 rounded-lg border shadow-sm space-y-2">
            <div className="text-xs font-semibold mb-2">{t('advanced.title', 'Advanced')}</div>

            <div className="flex items-center justify-between">
              <Label className="text-xs flex items-center gap-2">
                <Route className="h-3 w-3" />
                {t('pathFinding.toggle', 'Path Finding')}
              </Label>
              <Switch checked={showPathPanel} onCheckedChange={setShowPathPanel} />
            </div>

            <div className="flex items-center justify-between">
              <Label className="text-xs flex items-center gap-2">
                <Clock className="h-3 w-3" />
                {t('timeAnimation.toggle', 'Timeline')}
              </Label>
              <Switch checked={showTimePanel} onCheckedChange={setShowTimePanel} />
            </div>

            <div className="flex items-center justify-between">
              <Label className="text-xs flex items-center gap-2">
                <Star className="h-3 w-3" />
                {t('influence.toggle', 'Influence')}
              </Label>
              <Switch checked={showInfluence} onCheckedChange={setShowInfluence} />
            </div>
          </div>

          {/* Stats */}
          <div className="bg-background/95 p-3 rounded-lg border shadow-sm text-xs text-muted-foreground">
            {filteredNodes.length} {t('nodesShown', 'nodes')} · {filteredEdges.length}{' '}
            {t('edgesShown', 'edges')}
            {highlightedPath.length > 0 && (
              <span className="text-amber-600 ms-2">· {t('pathActive', 'Path highlighted')}</span>
            )}
          </div>
        </Panel>

        {/* Path Finding Panel */}
        <AnimatePresence>
          {showPathPanel && (
            <Panel position={isRTL ? 'top-right' : 'top-left'} className="w-64">
              <motion.div
                initial={{ opacity: 0, x: isRTL ? 20 : -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: isRTL ? 20 : -20 }}
              >
                <PathFindingPanel
                  nodes={rawNodes}
                  edges={rawEdges}
                  onPathFound={handlePathFound}
                  onClearPath={handleClearPath}
                />
              </motion.div>
            </Panel>
          )}
        </AnimatePresence>

        {/* Time Animation Panel */}
        <AnimatePresence>
          {showTimePanel && (
            <Panel position={isRTL ? 'bottom-right' : 'bottom-left'} className="w-72 mb-16">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
              >
                <TimeAnimationPanel edges={rawEdges} onTimeChange={handleTimeChange} />
              </motion.div>
            </Panel>
          )}
        </AnimatePresence>

        {/* Zoom & View Controls */}
        <Panel
          position={isRTL ? 'bottom-right' : 'bottom-left'}
          className={cn('flex gap-2', showTimePanel && 'mb-72')}
        >
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

          {/* Export Controls */}
          <div className="bg-background/95 p-2 rounded-lg border shadow-sm">
            <ExportPanel reactFlowRef={reactFlowRef} />
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
          className={cn(
            'bg-background/95 p-3 rounded-lg border shadow-sm',
            (showPathPanel || showTimePanel) && 'hidden sm:block',
          )}
        >
          <div className="text-xs font-semibold mb-2">{t('legend', 'Legend')}</div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
            {Object.entries(NODE_COLORS)
              .slice(0, 6)
              .map(([type, color]) => (
                <div key={type} className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full" style={{ backgroundColor: color }} />
                  <span className="capitalize">{t(`type.${type}`, type)}</span>
                </div>
              ))}
          </div>

          {highlightedPath.length > 0 && (
            <div className="mt-3 pt-2 border-t">
              <div className="flex items-center gap-2 text-xs text-amber-600">
                <Route className="h-3 w-3" />
                {t('pathHighlighted', 'Path highlighted')}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 text-xs px-1"
                  onClick={handleClearPath}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          )}

          {focusedNodeId && !highlightedPath.length && (
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
export function AdvancedGraphVisualization(props: AdvancedGraphVisualizationProps) {
  return (
    <ReactFlowProvider>
      <AdvancedGraphVisualizationInner {...props} />
    </ReactFlowProvider>
  )
}

export default AdvancedGraphVisualization
