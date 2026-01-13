/**
 * Relationships Section Component
 * Features: 028 - T059, universal-relationship-crud
 *
 * Displays dossier-to-dossier relationships with optional network graph visualization.
 * Includes CRUD functionality for managing relationships.
 * Reusable across all dossier types. Mobile-first with touch gestures and RTL support.
 *
 * @example
 * ```tsx
 * <Relationships dossierId={dossier.id} dossierName="United Nations" dossierType="organization" />
 * ```
 */

import { useTranslation } from 'react-i18next'
import {
  Network,
  Link2,
  Calendar,
  ArrowRight,
  Eye,
  Plus,
  Pencil,
  Trash2,
  MoreHorizontal,
  Share2,
  LayoutGrid,
  Rows3,
} from 'lucide-react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState, memo, useCallback } from 'react'
import ReactFlow, {
  Node,
  Edge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  OnNodesChange,
  OnEdgesChange,
  NodeTypes,
} from 'reactflow'
import 'reactflow/dist/style.css'
import { forceSimulation, forceLink, forceManyBody, forceCenter, forceCollide } from 'd3-force'
import { supabase } from '@/lib/supabase-client'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { RelationshipFormDialog } from '../RelationshipFormDialog'
import { RelationshipWizard } from '../RelationshipWizard'
import { GraphExportDialog } from '@/components/graph-export'
import { useDeleteRelationship } from '@/hooks/useRelationships'
import {
  RELATIONSHIP_TYPE_LABELS,
  type DossierRelationshipWithDossiers,
} from '@/types/relationship.types'
import { RelatedEntityCarousel, type CarouselItem } from '@/components/ui/related-entity-carousel'

interface Relationship {
  id: string
  source_dossier_id: string
  target_dossier_id: string
  relationship_type: string
  effective_from: string | null
  effective_to: string | null
  metadata?: Record<string, any>
  source_dossier?: {
    id: string
    type: string
    name_en: string
    name_ar: string
  }
  target_dossier?: {
    id: string
    type: string
    name_en: string
    name_ar: string
  }
}

interface RelationshipsProps {
  dossierId: string
  /**
   * Name of the dossier (for display in dialogs)
   */
  dossierName?: string
  /**
   * Type of the dossier (for display purposes)
   */
  dossierType?: string
  /**
   * Visualization mode: 'carousel' (default), 'list', 'graph', or 'all'
   */
  visualizationMode?: 'carousel' | 'list' | 'graph' | 'all' | 'both'
  /**
   * Optional filter by relationship type
   */
  relationshipTypeFilter?: string
  /**
   * Optional CSS class for container
   */
  className?: string
  /**
   * Whether to enable edit capabilities
   */
  editable?: boolean
}

// Custom node component for related dossiers (memoized for performance)
const DossierNode = memo(
  ({ data }: { data: { label: string; type: string; relationCount: number } }) => (
    <div className="bg-card border-2 border-primary rounded-lg px-3 py-2 sm:px-4 sm:py-3 shadow-md min-w-[80px] sm:min-w-[100px] hover:shadow-lg transition-shadow">
      <div className="flex flex-col items-center gap-1">
        <Badge variant="outline" className="text-xs">
          {data.type}
        </Badge>
        <div className="text-sm sm:text-base font-semibold text-foreground text-center">
          {data.label}
        </div>
        {data.relationCount > 0 && (
          <Badge variant="secondary" className="text-xs">
            {data.relationCount}
          </Badge>
        )}
      </div>
    </div>
  ),
)
DossierNode.displayName = 'DossierNode'

const nodeTypes: NodeTypes = {
  dossier: DossierNode,
}

/**
 * Format date in localized format
 */
function formatDate(dateString: string | null, locale: string): string {
  if (!dateString) return 'N/A'
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  } catch {
    return dateString
  }
}

/**
 * Shared Relationships Section Component
 *
 * Displays relationships for any dossier type with list and graph views
 */
export function Relationships({
  dossierId,
  dossierName = '',
  dossierType = '',
  visualizationMode = 'all',
  relationshipTypeFilter,
  className = '',
  editable = true,
}: RelationshipsProps) {
  const { t, i18n } = useTranslation('dossier')
  const isRTL = i18n.language === 'ar'

  // Determine initial view mode based on visualization mode prop
  const getInitialViewMode = (): 'carousel' | 'list' | 'graph' => {
    if (
      visualizationMode === 'carousel' ||
      visualizationMode === 'list' ||
      visualizationMode === 'graph'
    ) {
      return visualizationMode
    }
    // For 'all' or 'both', default to carousel view
    return 'carousel'
  }

  const [viewMode, setViewMode] = useState<'carousel' | 'list' | 'graph'>(getInitialViewMode())

  // Dialog states
  const [formDialogOpen, setFormDialogOpen] = useState(false)
  const [editingRelationship, setEditingRelationship] =
    useState<DossierRelationshipWithDossiers | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingRelationship, setDeletingRelationship] = useState<Relationship | null>(null)
  const [exportDialogOpen, setExportDialogOpen] = useState(false)

  const deleteMutation = useDeleteRelationship()
  const queryClient = useQueryClient()

  // Handle add relationship
  const handleAddRelationship = useCallback(() => {
    setEditingRelationship(null)
    setFormDialogOpen(true)
  }, [])

  // Handle export graph
  const handleExportGraph = useCallback(() => {
    setExportDialogOpen(true)
  }, [])

  // Handle edit relationship
  const handleEditRelationship = useCallback((relationship: Relationship) => {
    setEditingRelationship(relationship as unknown as DossierRelationshipWithDossiers)
    setFormDialogOpen(true)
  }, [])

  // Handle delete confirmation
  const handleDeleteClick = useCallback((relationship: Relationship) => {
    setDeletingRelationship(relationship)
    setDeleteDialogOpen(true)
  }, [])

  // Handle delete
  const handleDelete = useCallback(async () => {
    if (!deletingRelationship) return

    await deleteMutation.mutateAsync({
      id: deletingRelationship.id,
      sourceDossierId: deletingRelationship.source_dossier_id,
      targetDossierId: deletingRelationship.target_dossier_id,
    })

    setDeleteDialogOpen(false)
    setDeletingRelationship(null)
  }, [deletingRelationship, deleteMutation])

  // Fetch relationships with related dossier info
  const { data: relationships, isLoading } = useQuery({
    queryKey: ['relationships', dossierId, relationshipTypeFilter],
    queryFn: async () => {
      let query = supabase
        .from('dossier_relationships')
        .select(
          `
          id,
          source_dossier_id,
          target_dossier_id,
          relationship_type,
          effective_from,
          effective_to,
          metadata:relationship_metadata,
          source_dossier:dossiers!source_dossier_id(id, type, name_en, name_ar),
          target_dossier:dossiers!target_dossier_id(id, type, name_en, name_ar)
        `,
        )
        .or(`source_dossier_id.eq.${dossierId},target_dossier_id.eq.${dossierId}`)

      if (relationshipTypeFilter) {
        query = query.eq('relationship_type', relationshipTypeFilter)
      }

      const { data, error } = await query.order('effective_from', { ascending: false })

      if (error) throw error
      return data as Relationship[]
    },
  })

  // Extract unique dossiers for graph view
  const uniqueDossiers = useMemo(() => {
    if (!relationships) return []

    const dossierMap = new Map<string, { id: string; type: string; name: string }>()

    relationships.forEach((rel) => {
      if (rel.source_dossier && !dossierMap.has(rel.source_dossier.id)) {
        dossierMap.set(rel.source_dossier.id, {
          id: rel.source_dossier.id,
          type: rel.source_dossier.type,
          name: isRTL ? rel.source_dossier.name_ar : rel.source_dossier.name_en,
        })
      }
      if (rel.target_dossier && !dossierMap.has(rel.target_dossier.id)) {
        dossierMap.set(rel.target_dossier.id, {
          id: rel.target_dossier.id,
          type: rel.target_dossier.type,
          name: isRTL ? rel.target_dossier.name_ar : rel.target_dossier.name_en,
        })
      }
    })

    return Array.from(dossierMap.values())
  }, [relationships, isRTL])

  // Generate nodes and edges for graph view
  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
    if (!relationships || relationships.length === 0 || uniqueDossiers.length === 0) {
      return { nodes: [], edges: [] }
    }

    // Count relationships per dossier
    const relationCounts = new Map<string, number>()
    relationships.forEach((rel) => {
      relationCounts.set(
        rel.source_dossier_id,
        (relationCounts.get(rel.source_dossier_id) || 0) + 1,
      )
      relationCounts.set(
        rel.target_dossier_id,
        (relationCounts.get(rel.target_dossier_id) || 0) + 1,
      )
    })

    // Create nodes
    const nodesData = uniqueDossiers.map((dossier) => ({
      id: dossier.id,
      type: 'dossier' as const,
      position: { x: 0, y: 0 }, // Will be calculated by d3-force
      data: {
        label: dossier.name,
        type: dossier.type,
        relationCount: relationCounts.get(dossier.id) || 0,
      },
    }))

    // Create edges
    const edgesData = relationships.map((rel) => {
      const isActive = !rel.effective_to || new Date(rel.effective_to) > new Date()

      return {
        id: rel.id,
        source: rel.source_dossier_id,
        target: rel.target_dossier_id,
        label: rel.relationship_type,
        type: 'default' as const,
        animated: isActive,
        style: {
          stroke: isActive ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))',
          strokeWidth: 2,
        },
      }
    })

    // Apply d3-force layout
    const simulation = forceSimulation(nodesData as any)
      .force(
        'link',
        forceLink(edgesData)
          .id((d: any) => d.id)
          .distance(150),
      )
      .force('charge', forceManyBody().strength(-300))
      .force('center', forceCenter(400, 300))
      .force('collide', forceCollide(80))
      .stop()

    // Run simulation synchronously
    for (let i = 0; i < 300; ++i) simulation.tick()

    // Apply RTL position mirroring if needed
    if (isRTL) {
      nodesData.forEach((node) => {
        node.position.x = 800 - node.position.x
      })
    }

    return { nodes: nodesData, edges: edgesData }
  }, [relationships, uniqueDossiers, isRTL])

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
      <div
        className={`flex items-center justify-center py-12 sm:py-16 ${className}`}
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <div className="text-center">
          <div className="h-12 w-12 sm:h-16 sm:w-16 rounded-full border-4 border-primary border-t-transparent animate-spin mx-auto mb-4" />
          <p className="text-sm sm:text-base text-muted-foreground">{t('common.loading')}</p>
        </div>
      </div>
    )
  }

  // Empty state with interactive wizard
  if (!relationships || relationships.length === 0) {
    return (
      <div className={`py-4 sm:py-6 ${className}`} dir={isRTL ? 'rtl' : 'ltr'}>
        {editable ? (
          <RelationshipWizard
            dossierId={dossierId}
            dossierName={dossierName}
            dossierType={dossierType}
            onCreateRelationship={handleAddRelationship}
          />
        ) : (
          <div className="flex flex-col items-center justify-center py-8 sm:py-12 text-center">
            <div className="mb-4 sm:mb-6">
              <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-primary/10 flex items-center justify-center">
                <Link2 className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
              </div>
            </div>

            <h3 className="text-base sm:text-lg font-semibold text-foreground mb-2">
              {t('section.relationshipsEmpty')}
            </h3>

            <p className="text-sm sm:text-base text-muted-foreground max-w-md mb-6 px-4">
              {t('section.relationshipsEmptyDescription')}
            </p>
          </div>
        )}

        {/* Form Dialog */}
        <RelationshipFormDialog
          open={formDialogOpen}
          onOpenChange={setFormDialogOpen}
          dossierId={dossierId}
          dossierName={dossierName}
          dossierType={dossierType}
          relationship={editingRelationship || undefined}
          mode={editingRelationship ? 'edit' : 'create'}
        />
      </div>
    )
  }

  // Render view tabs if 'all' or 'both' mode
  const showTabs = visualizationMode === 'all' || visualizationMode === 'both'

  return (
    <div className={className} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header with Add and Export buttons */}
      <div className="flex justify-end gap-2 mb-4">
        <Button variant="outline" size="sm" onClick={handleExportGraph}>
          <Share2 className="h-4 w-4 me-2" />
          {t('actions.exportGraph')}
        </Button>
        {editable && (
          <Button variant="outline" size="sm" onClick={handleAddRelationship}>
            <Plus className="h-4 w-4 me-2" />
            {t('actions.addRelationship')}
          </Button>
        )}
      </div>

      {showTabs ? (
        <Tabs
          value={viewMode}
          onValueChange={(v) => setViewMode(v as 'carousel' | 'list' | 'graph')}
        >
          <TabsList className="mb-4">
            <TabsTrigger value="carousel" className="flex items-center gap-2">
              <LayoutGrid className="h-4 w-4" />
              {t('views.carousel', 'Carousel')}
            </TabsTrigger>
            <TabsTrigger value="list" className="flex items-center gap-2">
              <Rows3 className="h-4 w-4" />
              {t('views.list')}
            </TabsTrigger>
            <TabsTrigger value="graph" className="flex items-center gap-2">
              <Network className="h-4 w-4" />
              {t('views.graph')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="carousel">
            <RelationshipsCarousel
              relationships={relationships}
              dossierId={dossierId}
              isRTL={isRTL}
              editable={editable}
              onEdit={handleEditRelationship}
              onDelete={handleDeleteClick}
            />
          </TabsContent>

          <TabsContent value="list">
            <RelationshipsList
              relationships={relationships}
              isRTL={isRTL}
              editable={editable}
              onEdit={handleEditRelationship}
              onDelete={handleDeleteClick}
            />
          </TabsContent>

          <TabsContent value="graph">
            <RelationshipsGraph
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              nodeTypes={nodeTypes}
              isRTL={isRTL}
            />
          </TabsContent>
        </Tabs>
      ) : viewMode === 'carousel' ? (
        <RelationshipsCarousel
          relationships={relationships}
          dossierId={dossierId}
          isRTL={isRTL}
          editable={editable}
          onEdit={handleEditRelationship}
          onDelete={handleDeleteClick}
        />
      ) : viewMode === 'list' ? (
        <RelationshipsList
          relationships={relationships}
          isRTL={isRTL}
          editable={editable}
          onEdit={handleEditRelationship}
          onDelete={handleDeleteClick}
        />
      ) : (
        <RelationshipsGraph
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          isRTL={isRTL}
        />
      )}

      {/* Form Dialog */}
      <RelationshipFormDialog
        open={formDialogOpen}
        onOpenChange={setFormDialogOpen}
        dossierId={dossierId}
        dossierName={dossierName}
        dossierType={dossierType}
        relationship={editingRelationship || undefined}
        mode={editingRelationship ? 'edit' : 'create'}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent dir={isRTL ? 'rtl' : 'ltr'}>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('dialogs.deleteTitle')}</AlertDialogTitle>
            <AlertDialogDescription>{t('dialogs.deleteDescription')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-col-reverse sm:flex-row gap-2">
            <AlertDialogCancel>{t('actions.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? t('actions.deleting') : t('actions.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Graph Export Dialog */}
      <GraphExportDialog
        open={exportDialogOpen}
        onOpenChange={setExportDialogOpen}
        startDossierId={dossierId}
        startDossierName={dossierName}
      />
    </div>
  )
}

/**
 * Convert Relationship to CarouselItem with id
 */
interface RelationshipCarouselItem extends CarouselItem {
  relationship: Relationship
  relatedDossier: {
    id: string
    type: string
    name_en: string
    name_ar: string
  }
  isActive: boolean
  relationshipLabel: string
}

/**
 * Carousel view of relationships using horizontal scrolling cards
 */
function RelationshipsCarousel({
  relationships,
  dossierId,
  isRTL,
  editable = false,
  onEdit,
  onDelete,
}: {
  relationships: Relationship[]
  dossierId: string
  isRTL: boolean
  editable?: boolean
  onEdit?: (relationship: Relationship) => void
  onDelete?: (relationship: Relationship) => void
}) {
  const { t, i18n } = useTranslation('dossier')

  // Transform relationships into carousel items
  const carouselItems: RelationshipCarouselItem[] = useMemo(() => {
    return relationships
      .map((rel) => {
        const relatedDossier =
          rel.source_dossier?.id !== dossierId ? rel.source_dossier : rel.target_dossier

        if (!relatedDossier) return null

        const isActive = !rel.effective_to || new Date(rel.effective_to) > new Date()
        const relationshipLabel =
          RELATIONSHIP_TYPE_LABELS[
            rel.relationship_type as keyof typeof RELATIONSHIP_TYPE_LABELS
          ]?.[isRTL ? 'ar' : 'en'] || rel.relationship_type

        return {
          id: rel.id,
          relationship: rel,
          relatedDossier,
          isActive,
          relationshipLabel,
        }
      })
      .filter((item): item is RelationshipCarouselItem => item !== null)
  }, [relationships, dossierId, isRTL])

  // Render each carousel item card
  const renderCard = useCallback(
    (item: RelationshipCarouselItem) => {
      const { relationship: rel, relatedDossier, isActive, relationshipLabel } = item

      return (
        <Card className="h-full hover:shadow-md transition-shadow">
          <CardContent className="p-4 sm:p-5 h-full flex flex-col">
            {/* Badges */}
            <div className="flex items-start gap-2 flex-wrap mb-3">
              <Badge variant={isActive ? 'default' : 'secondary'} className="text-xs">
                {relationshipLabel}
              </Badge>
              {!isActive && (
                <Badge variant="outline" className="text-xs">
                  {t('status.historical')}
                </Badge>
              )}
            </div>

            {/* Title and Type */}
            <div className="flex-1 min-h-0">
              <h4 className="text-sm sm:text-base font-semibold text-foreground line-clamp-2 mb-1">
                {isRTL ? relatedDossier.name_ar : relatedDossier.name_en}
              </h4>
              <Badge variant="outline" className="text-xs">
                {relatedDossier.type}
              </Badge>
            </div>

            {/* Date Info */}
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mt-3">
              {rel.effective_from && (
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  <span>{formatDate(rel.effective_from, i18n.language)}</span>
                </div>
              )}
              {rel.effective_to && (
                <>
                  <ArrowRight className={`h-3 w-3 ${isRTL ? 'rotate-180' : ''}`} />
                  <span>{formatDate(rel.effective_to, i18n.language)}</span>
                </>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 mt-4 pt-3 border-t">
              <Button variant="outline" size="sm" className="flex-1 min-h-10">
                <Eye className="h-4 w-4 me-2" />
                {t('actions.view')}
              </Button>

              {editable && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-10 w-10 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">{t('actions.more')}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align={isRTL ? 'start' : 'end'}>
                    <DropdownMenuItem onClick={() => onEdit?.(rel)}>
                      <Pencil className="h-4 w-4 me-2" />
                      {t('actions.edit')}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onDelete?.(rel)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="h-4 w-4 me-2" />
                      {t('actions.delete')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </CardContent>
        </Card>
      )
    },
    [isRTL, t, i18n.language, editable, onEdit, onDelete],
  )

  return (
    <RelatedEntityCarousel
      items={carouselItems}
      renderItem={renderCard}
      title={t('carousel.relatedDossiers')}
      emptyMessage={t('section.relationshipsEmpty')}
      emptyDescription={t('section.relationshipsEmptyDescription')}
      showNavigation={true}
      showIndicators={true}
      testId="relationships-carousel"
    />
  )
}

/**
 * List view of relationships
 */
function RelationshipsList({
  relationships,
  isRTL,
  editable = false,
  onEdit,
  onDelete,
}: {
  relationships: Relationship[]
  isRTL: boolean
  editable?: boolean
  onEdit?: (relationship: Relationship) => void
  onDelete?: (relationship: Relationship) => void
}) {
  const { t, i18n } = useTranslation('dossier')

  return (
    <div className="grid grid-cols-1 gap-3 sm:gap-4">
      {relationships.map((rel) => {
        const isActive = !rel.effective_to || new Date(rel.effective_to) > new Date()
        const relatedDossier =
          rel.source_dossier?.id !== rel.source_dossier_id ? rel.source_dossier : rel.target_dossier

        if (!relatedDossier) return null

        // Get translated relationship type label
        const relationshipLabel =
          RELATIONSHIP_TYPE_LABELS[
            rel.relationship_type as keyof typeof RELATIONSHIP_TYPE_LABELS
          ]?.[isRTL ? 'ar' : 'en'] || rel.relationship_type

        return (
          <Card key={rel.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
                <div className="flex-1 space-y-2">
                  <div className="flex items-start gap-2 flex-wrap">
                    <Badge variant={isActive ? 'default' : 'secondary'} className="text-xs">
                      {relationshipLabel}
                    </Badge>
                    {!isActive && (
                      <Badge variant="outline" className="text-xs">
                        {t('status.historical')}
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-sm sm:text-base font-semibold text-foreground">
                      {isRTL ? relatedDossier.name_ar : relatedDossier.name_en}
                    </h4>
                    <Badge variant="outline" className="text-xs">
                      {relatedDossier.type}
                    </Badge>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm text-muted-foreground">
                    {rel.effective_from && (
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                        <span>{formatDate(rel.effective_from, i18n.language)}</span>
                      </div>
                    )}
                    {rel.effective_to && (
                      <>
                        <ArrowRight
                          className={`h-3 w-3 sm:h-4 sm:w-4 ${isRTL ? 'rotate-180' : ''}`}
                        />
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                          <span>{formatDate(rel.effective_to, i18n.language)}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-center">
                  <Button variant="outline" size="sm" className="min-h-9">
                    <Eye className="h-4 w-4 me-2" />
                    {t('actions.view')}
                  </Button>

                  {editable && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">{t('actions.more')}</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align={isRTL ? 'start' : 'end'}>
                        <DropdownMenuItem onClick={() => onEdit?.(rel)}>
                          <Pencil className="h-4 w-4 me-2" />
                          {t('actions.edit')}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => onDelete?.(rel)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="h-4 w-4 me-2" />
                          {t('actions.delete')}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

/**
 * Graph view of relationships using React Flow
 */
function RelationshipsGraph({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  nodeTypes,
  isRTL,
}: {
  nodes: Node[]
  edges: Edge[]
  onNodesChange: OnNodesChange
  onEdgesChange: OnEdgesChange
  nodeTypes: NodeTypes
  isRTL: boolean
}) {
  return (
    <div className="w-full h-[400px] sm:h-[500px] lg:h-[600px] border rounded-lg overflow-hidden">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        attributionPosition={isRTL ? 'top-left' : 'top-right'}
        minZoom={0.1}
        maxZoom={2}
        defaultEdgeOptions={{
          type: 'default',
          animated: false,
        }}
        onlyRenderVisibleElements={true}
      >
        <Background color="hsl(var(--muted-foreground))" gap={16} />
        <Controls position={isRTL ? 'top-left' : 'top-right'} />
        <MiniMap
          position={isRTL ? 'bottom-right' : 'bottom-left'}
          nodeColor="hsl(var(--primary))"
          maskColor="hsl(var(--muted) / 0.5)"
        />
      </ReactFlow>
    </div>
  )
}
