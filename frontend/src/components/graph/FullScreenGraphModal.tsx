/**
 * FullScreenGraphModal
 * Full-screen relationship network graph in an AdaptiveDialog modal.
 *
 * Opens from RelationshipSidebar "Expand Graph" button.
 * Uses AdvancedGraphVisualization with graph-traversal edge function data.
 * Lazy-loaded via React.lazy to maintain 200KB bundle budget.
 *
 * RTL-compatible, mobile-first.
 */

import { type ReactElement, useMemo, useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { ReactFlowProvider } from '@xyflow/react'
import {
  AdaptiveDialog,
  AdaptiveDialogBody,
} from '@/components/ui/adaptive-dialog'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { AdvancedGraphVisualization } from '@/components/relationships/AdvancedGraphVisualization'
import { getDossierDetailPath } from '@/lib/dossier-routes'
import { supabase } from '@/lib/supabase'
import { Network, AlertCircle } from 'lucide-react'

// ============================================================================
// Types
// ============================================================================

interface FullScreenGraphModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  dossierId: string
  dossierType: string
}

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

// ============================================================================
// Data fetching
// ============================================================================

async function fetchGraphData(
  startDossierId: string,
  maxDegrees: number,
  relationshipType?: string,
): Promise<GraphData> {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (session == null) {
    throw new Error('Not authenticated')
  }

  const params = new URLSearchParams({
    startDossierId,
    maxDegrees: maxDegrees.toString(),
  })

  if (relationshipType !== undefined && relationshipType !== 'all') {
    params.append('relationshipType', relationshipType)
  }

  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/graph-traversal?${params.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    },
  )

  if (!response.ok) {
    const error = (await response.json()) as { error?: string }
    throw new Error(error.error ?? 'Failed to fetch graph data')
  }

  return response.json() as Promise<GraphData>
}

// ============================================================================
// Component
// ============================================================================

export default function FullScreenGraphModal({
  open,
  onOpenChange,
  dossierId,
}: FullScreenGraphModalProps): ReactElement {
  const { t } = useTranslation('dossier-shell')
  const navigate = useNavigate()

  // Controls state
  const [maxDegrees, setMaxDegrees] = useState(2)
  const [relationshipType, setRelationshipType] = useState<string>('all')

  // Fetch graph data -- only when modal is open
  const {
    data: graphData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['graph-traversal', dossierId, maxDegrees, relationshipType],
    queryFn: () => fetchGraphData(dossierId, maxDegrees, relationshipType),
    enabled: open,
    staleTime: 30000,
  })

  // Deduplicate nodes
  const deduplicatedNodes = useMemo(() => {
    if (graphData == null) return []

    const nodeMap = new Map<string, (typeof graphData.nodes)[0]>()

    nodeMap.set(graphData.start_dossier.id, {
      ...graphData.start_dossier,
      degree: 0,
      path: [],
    })

    graphData.nodes.forEach((node) => {
      if (!nodeMap.has(node.id)) {
        nodeMap.set(node.id, node)
      }
    })

    return Array.from(nodeMap.values())
  }, [graphData])

  const handleNodeClick = useCallback(
    (nodeId: string): void => {
      const node = deduplicatedNodes.find((n) => n.id === nodeId)
      if (node != null) {
        const path = getDossierDetailPath(node.id, node.type)
        void navigate({ to: path as '/' })
        onOpenChange(false)
      }
    },
    [deduplicatedNodes, navigate, onOpenChange],
  )

  return (
    <AdaptiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t('graph.fullScreen')}
      maxWidth="max-w-[95vw]"
    >
      <AdaptiveDialogBody className="h-[80vh] p-0">
        {/* Controls bar */}
        <div className="flex flex-wrap items-center gap-3 px-4 py-2 border-b bg-muted/30">
          <div className="flex items-center gap-2">
            <Network className="h-4 w-4 text-muted-foreground" />
            <Select
              value={maxDegrees.toString()}
              onValueChange={(v) => setMaxDegrees(parseInt(v, 10))}
            >
              <SelectTrigger className="h-8 w-[120px] text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 {t('graph.degree')}</SelectItem>
                <SelectItem value="2">2 {t('graph.degrees')}</SelectItem>
                <SelectItem value="3">3 {t('graph.degrees')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Select value={relationshipType} onValueChange={setRelationshipType}>
            <SelectTrigger className="h-8 w-[140px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('graph.allTypes')}</SelectItem>
              <SelectItem value="member_of">{t('graph.memberOf')}</SelectItem>
              <SelectItem value="partner">{t('graph.partner')}</SelectItem>
              <SelectItem value="hosted_by">{t('graph.hostedBy')}</SelectItem>
            </SelectContent>
          </Select>

          {graphData != null && (
            <span className="text-xs text-muted-foreground ms-auto">
              {graphData.stats.node_count} {t('graph.nodes')} &middot;{' '}
              {graphData.stats.edge_count} {t('graph.edges')}
            </span>
          )}
        </div>

        {/* Graph content */}
        <div className="flex-1 h-full min-h-0">
          {isLoading && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center space-y-3">
                <Skeleton className="h-8 w-8 rounded-full mx-auto" />
                <p className="text-sm text-muted-foreground">{t('graph.loading')}</p>
              </div>
            </div>
          )}

          {error != null && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center space-y-2">
                <AlertCircle className="h-8 w-8 text-destructive mx-auto" />
                <p className="text-sm text-destructive">
                  {(error as Error).message}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="min-h-11"
                  onClick={() => onOpenChange(false)}
                >
                  {t('graph.close')}
                </Button>
              </div>
            </div>
          )}

          {graphData != null && deduplicatedNodes.length === 0 && (
            <div className="flex items-center justify-center h-full">
              <p className="text-sm text-muted-foreground">{t('graph.empty')}</p>
            </div>
          )}

          {graphData != null && deduplicatedNodes.length > 0 && (
            <ReactFlowProvider>
              <AdvancedGraphVisualization
                nodes={deduplicatedNodes}
                edges={graphData.edges}
                onNodeClick={handleNodeClick}
                height="100%"
                showMiniMap
                centerNodeId={dossierId}
              />
            </ReactFlowProvider>
          )}
        </div>
      </AdaptiveDialogBody>
    </AdaptiveDialog>
  )
}
