/**
 * OrgHierarchy Section Component (Feature 028 - User Story 5 - T044/T058)
 *
 * Displays organizational hierarchy tree using React Flow with d3-hierarchy layout.
 * Optimized for performance with memoization and virtualization.
 * Mobile-first with touch gestures and RTL support.
 */

import { useTranslation } from 'react-i18next'
import { Network, Building2 } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useMemo, memo } from 'react'
import {
  ReactFlow,
  Node,
  Edge,
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  OnNodesChange,
  OnEdgesChange,
  NodeTypes,
  Position,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { hierarchy, tree } from 'd3-hierarchy'
import { supabase } from '@/lib/supabase-client'
import type { OrganizationDossier } from '@/lib/dossier-type-guards'
import { Badge } from '@/components/ui/badge'

interface OrgHierarchyProps {
  dossier: OrganizationDossier
}

interface OrgNode {
  id: string
  name_en: string
  name_ar: string
  extension: {
    org_code?: string
    org_type?: string
    parent_org_id?: string
    head_count?: number
  }
}

// Custom node component for organizations (memoized for performance)
const OrganizationNode = memo(
  ({ data }: { data: { label: string; orgCode: string; orgType: string; headCount?: number } }) => (
    <div className="bg-card border-2 border-primary rounded-lg px-3 py-2 sm:px-4 sm:py-3 shadow-md min-w-[120px] sm:min-w-[160px] hover:shadow-lg transition-shadow">
      <div className="flex flex-col items-center gap-1">
        <Badge variant="outline" className="text-xs">
          {data.orgCode}
        </Badge>
        <div className="text-sm sm:text-base font-semibold text-foreground text-center">
          {data.label}
        </div>
        <div className="text-xs text-muted-foreground">{data.orgType}</div>
        {data.headCount !== undefined && (
          <div className="text-xs text-muted-foreground">{data.headCount} employees</div>
        )}
      </div>
    </div>
  ),
)
OrganizationNode.displayName = 'OrganizationNode'

const nodeTypes: NodeTypes = {
  organization: OrganizationNode,
}

export function OrgHierarchy({ dossier }: OrgHierarchyProps) {
  const { t, i18n } = useTranslation('dossier')
  const isRTL = i18n.language === 'ar'
  const { extension } = dossier

  // Fetch organization hierarchy (parent and children)
  const { data: hierarchyOrgs, isLoading } = useQuery({
    queryKey: ['org-hierarchy', dossier.id],
    queryFn: async () => {
      // Fetch all organizations to build complete hierarchy
      const { data, error } = await supabase
        .from('dossiers')
        .select('id, name_en, name_ar, extension')
        .eq('type', 'organization')

      if (error) throw error
      return data as OrgNode[]
    },
  })

  // Build hierarchy tree structure and generate nodes/edges
  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
    if (!hierarchyOrgs || hierarchyOrgs.length === 0) {
      return { nodes: [], edges: [] }
    }

    // Build parent-child map
    const orgMap = new Map<string, OrgNode>()
    hierarchyOrgs.forEach((org) => orgMap.set(org.id, org))

    // Find root nodes (organizations without parent)
    const roots = hierarchyOrgs.filter((org) => !org.extension.parent_org_id)

    // Build hierarchy tree for each root
    interface HierarchyNode {
      id: string
      name: string
      orgCode: string
      orgType: string
      headCount?: number
      children: HierarchyNode[]
    }

    const buildTree = (orgId: string): HierarchyNode | null => {
      const org = orgMap.get(orgId)
      if (!org) return null

      const children = hierarchyOrgs
        .filter((child) => child.extension.parent_org_id === orgId)
        .map((child) => buildTree(child.id))
        .filter((node): node is HierarchyNode => node !== null)

      return {
        id: org.id,
        name: isRTL ? org.name_ar : org.name_en,
        orgCode: org.extension.org_code || org.id.slice(0, 8),
        orgType: org.extension.org_type || 'organization',
        headCount: org.extension.head_count,
        children,
      }
    }

    // Build tree starting from current dossier or first root
    let treeRoot: HierarchyNode | null = null

    // Try to find tree containing current dossier
    if (extension.parent_org_id) {
      // Find root of current dossier's tree
      let currentId = dossier.id
      let parentId = extension.parent_org_id

      while (parentId) {
        const parent = orgMap.get(parentId)
        if (!parent || !parent.extension.parent_org_id) {
          treeRoot = buildTree(parentId)
          break
        }
        currentId = parentId
        parentId = parent.extension.parent_org_id
      }
    } else {
      // Current dossier is root
      treeRoot = buildTree(dossier.id)
    }

    // If tree not found, use first root
    if (!treeRoot && roots.length > 0) {
      treeRoot = buildTree(roots[0].id)
    }

    if (!treeRoot) {
      return { nodes: [], edges: [] }
    }

    // Apply d3-hierarchy tree layout
    const root = hierarchy(treeRoot)
    const treeLayout = tree<HierarchyNode>()
      .size([800, 600])
      .separation((a, b) => (a.parent === b.parent ? 1 : 2))

    const treeData = treeLayout(root)

    // Convert to React Flow nodes
    const nodesData: Node[] = []
    treeData.descendants().forEach((node) => {
      const x = isRTL ? 800 - node.y : node.y
      const y = node.x

      nodesData.push({
        id: node.data.id,
        type: 'organization',
        position: { x, y },
        data: {
          label: node.data.name,
          orgCode: node.data.orgCode,
          orgType: node.data.orgType,
          headCount: node.data.headCount,
        },
        sourcePosition: isRTL ? Position.Left : Position.Right,
        targetPosition: isRTL ? Position.Right : Position.Left,
      })
    })

    // Convert to React Flow edges
    const edgesData: Edge[] = []
    treeData.links().forEach((link) => {
      edgesData.push({
        id: `${link.source.data.id}-${link.target.data.id}`,
        source: link.source.data.id,
        target: link.target.data.id,
        type: 'step',
        animated: false,
        style: {
          stroke: 'hsl(var(--primary))',
          strokeWidth: 2,
        },
      })
    })

    return { nodes: nodesData, edges: edgesData }
  }, [hierarchyOrgs, dossier.id, extension.parent_org_id, isRTL])

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)

  // Update nodes/edges when data changes
  useMemo(() => {
    setNodes(initialNodes)
    setEdges(initialEdges)
  }, [initialNodes, initialEdges, setNodes, setEdges])

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12 sm:py-16" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="text-center">
          <div className="h-12 w-12 sm:h-16 sm:w-16 rounded-full border-4 border-primary border-t-transparent animate-spin mx-auto mb-4" />
          <p className="text-sm sm:text-base text-muted-foreground">{t('common.loading')}</p>
        </div>
      </div>
    )
  }

  // Empty state
  if (!hierarchyOrgs || hierarchyOrgs.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center py-8 sm:py-12 text-center"
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <div className="rounded-full bg-muted p-4 sm:p-6 mb-4">
          <Network className="h-8 w-8 sm:h-10 sm:w-10 text-muted-foreground" />
        </div>
        <h3 className="text-sm sm:text-base font-medium text-muted-foreground mb-2">
          No Organizational Hierarchy
        </h3>
        <p className="text-xs sm:text-sm text-muted-foreground max-w-md">
          This organization does not have a parent organization defined.
        </p>
      </div>
    )
  }

  // Hierarchy chart view
  return (
    <div
      className="w-full h-[500px] sm:h-[600px] lg:h-[700px] border rounded-lg overflow-hidden"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange as OnNodesChange}
        onEdgesChange={onEdgesChange as OnEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        attributionPosition={isRTL ? 'top-left' : 'top-right'}
        minZoom={0.1}
        maxZoom={1.5}
        defaultEdgeOptions={{
          type: 'step',
          animated: false,
        }}
        onlyRenderVisibleElements={true}
      >
        <Background color="hsl(var(--muted-foreground))" gap={16} />
        <Controls position={isRTL ? 'top-left' : 'top-right'} />
      </ReactFlow>
    </div>
  )
}
