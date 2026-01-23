/**
 * RelationshipGraph Component
 * Part of: 027-contact-directory Phase 6
 *
 * Network visualization of contact relationships using React Flow.
 * Mobile-first, RTL-aware with zoom/pan controls.
 */

import { useCallback, useEffect, useState } from 'react'
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
  type OnConnect,
  addEdge,
  Connection,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Building2, User, Loader2 } from 'lucide-react'
import type { RelationshipResponse } from '@/services/contact-relationship-api'
import type { Database } from '@/types/contact-directory.types'

type Contact = Database['public']['Tables']['cd_contacts']['Row']

/**
 * RelationshipGraph Props
 */
interface RelationshipGraphProps {
  /** Center contact ID */
  contactId: string
  /** All relationships to display */
  relationships: RelationshipResponse[]
  /** All contacts in the network */
  contacts: Contact[]
  /** Handle contact node click */
  onContactClick?: (contactId: string) => void
  /** Handle relationship edge click */
  onRelationshipClick?: (relationshipId: string) => void
  /** Loading state */
  isLoading?: boolean
  /** Height of the graph container */
  height?: string | number
  /** RTL direction */
  className?: string
}

/**
 * Relationship type colors
 */
const RELATIONSHIP_COLORS = {
  reports_to: '#ef4444', // red
  collaborates_with: '#3b82f6', // blue
  partner: '#10b981', // green
  colleague: '#f59e0b', // amber
  other: '#6b7280', // gray
} as const

/**
 * Custom node component for contacts
 */
function ContactNode({ data }: { data: any }) {
  const { t } = useTranslation('contacts')
  const isCenter = data.isCenter

  return (
    <Card
      className={`min-w-[180px] cursor-pointer p-3 transition-shadow hover:shadow-md sm:min-w-[200px] ${
        isCenter ? 'ring-2 ring-primary' : ''
      }`}
    >
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <User className="size-4 shrink-0 text-muted-foreground" />
          <span className="truncate text-sm font-semibold">{data.label}</span>
        </div>
        {data.position && <p className="truncate text-xs text-muted-foreground">{data.position}</p>}
        {data.organization && (
          <Badge variant="secondary" className="w-fit px-2 py-0.5 text-xs">
            <Building2 className="me-1 size-3" />
            {data.organization}
          </Badge>
        )}
      </div>
    </Card>
  )
}

const nodeTypes = {
  contact: ContactNode,
}

/**
 * RelationshipGraph Component
 */
export function RelationshipGraph({
  contactId,
  relationships,
  contacts,
  onContactClick,
  onRelationshipClick,
  isLoading = false,
  height = 500,
  className = '',
}: RelationshipGraphProps) {
  const { t, i18n } = useTranslation('contacts')
  const isRTL = i18n.language === 'ar'

  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])

  /**
   * Build nodes and edges from relationships
   */
  useEffect(() => {
    if (!contacts.length || !contactId) return

    // Create a map of contacts for quick lookup
    const contactMap = new Map(contacts.map((c) => [c.id, c]))
    const centerContact = contactMap.get(contactId)
    if (!centerContact) return

    // Collect all unique contacts involved in relationships
    const involvedContactIds = new Set<string>([contactId])
    relationships.forEach((rel) => {
      involvedContactIds.add(rel.from_contact_id)
      involvedContactIds.add(rel.to_contact_id)
    })

    // Create nodes for each contact
    const newNodes: Node[] = []
    const contactsArray = Array.from(involvedContactIds)
      .map((id) => contactMap.get(id))
      .filter(Boolean) as Contact[]

    // Calculate node positions in a circular layout
    const radius = 250
    const angleStep = (2 * Math.PI) / (contactsArray.length - 1 || 1)

    contactsArray.forEach((contact, index) => {
      const isCenter = contact.id === contactId

      // Center contact in the middle
      let x = isCenter ? 0 : radius * Math.cos(index * angleStep)
      const y = isCenter ? 0 : radius * Math.sin(index * angleStep)

      // For RTL, flip x coordinates
      if (isRTL) {
        x = -x
      }

      newNodes.push({
        id: contact.id,
        type: 'contact',
        position: { x, y },
        data: {
          label: contact.full_name,
          position: contact.position,
          organization: contact.organization?.name,
          isCenter,
        },
        sourcePosition: isRTL ? Position.Left : Position.Right,
        targetPosition: isRTL ? Position.Right : Position.Left,
      })
    })

    // Create edges for each relationship
    const newEdges: Edge[] = relationships.map((rel) => ({
      id: rel.id,
      source: rel.from_contact_id,
      target: rel.to_contact_id,
      type: 'smoothstep',
      animated: true,
      label: t(`contactDirectory.relationshipTypes.${rel.relationship_type}`),
      labelStyle: {
        fontSize: 11,
        fontWeight: 500,
      },
      labelBgPadding: [8, 4],
      labelBgBorderRadius: 4,
      labelBgStyle: {
        fill: '#ffffff',
        opacity: 0.9,
      },
      style: {
        stroke:
          RELATIONSHIP_COLORS[rel.relationship_type as keyof typeof RELATIONSHIP_COLORS] ||
          RELATIONSHIP_COLORS.other,
        strokeWidth: 2,
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 15,
        height: 15,
        color:
          RELATIONSHIP_COLORS[rel.relationship_type as keyof typeof RELATIONSHIP_COLORS] ||
          RELATIONSHIP_COLORS.other,
      },
    }))

    setNodes(newNodes)
    setEdges(newEdges)
  }, [contactId, relationships, contacts, isRTL, t, setNodes, setEdges])

  /**
   * Handle node click
   */
  const handleNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      if (onContactClick) {
        onContactClick(node.id)
      }
    },
    [onContactClick],
  )

  /**
   * Handle edge click
   */
  const handleEdgeClick = useCallback(
    (_event: React.MouseEvent, edge: Edge) => {
      if (onRelationshipClick) {
        onRelationshipClick(edge.id)
      }
    },
    [onRelationshipClick],
  )

  /**
   * Handle connection
   */
  const onConnect: OnConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  )

  // Loading state
  if (isLoading) {
    return (
      <div
        className="flex items-center justify-center bg-muted/10"
        style={{ height: typeof height === 'number' ? `${height}px` : height }}
      >
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            {t('contactDirectory.relationships.loading_network')}
          </p>
        </div>
      </div>
    )
  }

  // Empty state
  if (!relationships.length) {
    return (
      <div
        className="flex items-center justify-center rounded-lg border border-dashed bg-muted/10"
        style={{ height: typeof height === 'number' ? `${height}px` : height }}
      >
        <div className="px-4 text-center">
          <p className="mb-1 font-medium">{t('contactDirectory.relationships.no_relationships')}</p>
          <p className="text-sm text-muted-foreground">
            {t('contactDirectory.relationships.add_relationships_hint')}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div
      className={`overflow-hidden rounded-lg border ${className}`}
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
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
        attributionPosition={isRTL ? 'bottom-left' : 'bottom-right'}
        proOptions={{ hideAttribution: true }}
      >
        <Background />
        <Controls position={isRTL ? 'top-left' : 'top-right'} />
      </ReactFlow>
    </div>
  )
}
