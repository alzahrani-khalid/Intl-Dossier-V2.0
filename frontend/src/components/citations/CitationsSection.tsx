/**
 * Citations Section Component
 * Feature: citation-tracking
 *
 * Displays citations for any entity type with list and graph views.
 * Includes CRUD functionality for managing citations.
 * Mobile-first with touch gestures and RTL support.
 *
 * @example
 * ```tsx
 * <CitationsSection entityType="dossier" entityId={dossier.id} entityName="Saudi Arabia" />
 * ```
 */

import { useState, memo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Link2,
  Plus,
  ExternalLink,
  Trash2,
  MoreHorizontal,
  Network,
  List,
  AlertTriangle,
  CheckCircle,
  Clock,
  ArrowUpRight,
  ArrowDownLeft,
  Edit,
  Eye,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
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
import { Skeleton } from '@/components/ui/skeleton'
import { useEntityCitations, useDeleteCitation, useEntityCitationStats } from '@/hooks/useCitations'
import { CitationNetworkGraph } from './CitationNetworkGraph'
import { CitationFormDialog } from './CitationFormDialog'
import type { CitationSourceType, CitationStatus, EntityCitation } from '@/types/citation.types'
import {
  CITATION_SOURCE_TYPE_LABELS,
  CITATION_STATUS_LABELS,
  getCitationStatusColor,
  isExternalSourceType,
} from '@/types/citation.types'

// ============================================================================
// Props
// ============================================================================

interface CitationsSectionProps {
  entityType: CitationSourceType
  entityId: string
  entityName?: string
  entityNameAr?: string
  visualizationMode?: 'list' | 'graph' | 'both'
  editable?: boolean
  className?: string
}

// ============================================================================
// Helper Functions
// ============================================================================

function formatDate(dateString: string, locale: string): string {
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

// ============================================================================
// Citation Card Component
// ============================================================================

interface CitationCardProps {
  citation: EntityCitation
  direction: 'outgoing' | 'incoming'
  isRTL: boolean
  locale: string
  editable: boolean
  onEdit?: (citation: EntityCitation) => void
  onDelete?: (citationId: string) => void
  onView?: (citation: EntityCitation) => void
}

const CitationCard = memo(
  ({
    citation,
    direction,
    isRTL,
    locale,
    editable,
    onEdit,
    onDelete,
    onView,
  }: CitationCardProps) => {
    const { t } = useTranslation('citations')
    const isExternal = isExternalSourceType(citation.related_entity_type)
    const typeLabel =
      CITATION_SOURCE_TYPE_LABELS[citation.related_entity_type]?.[isRTL ? 'ar' : 'en'] ||
      citation.related_entity_type
    const statusLabel =
      CITATION_STATUS_LABELS[citation.status]?.[isRTL ? 'ar' : 'en'] || citation.status
    const statusColor = getCitationStatusColor(citation.status)

    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div className="flex-1 space-y-2">
              {/* Direction and type badges */}
              <div className="flex items-center gap-2 flex-wrap">
                <Badge
                  variant={direction === 'outgoing' ? 'default' : 'secondary'}
                  className="text-xs flex items-center gap-1"
                >
                  {direction === 'outgoing' ? (
                    <ArrowUpRight className={`h-3 w-3 ${isRTL ? 'rotate-180' : ''}`} />
                  ) : (
                    <ArrowDownLeft className={`h-3 w-3 ${isRTL ? 'rotate-180' : ''}`} />
                  )}
                  {direction === 'outgoing'
                    ? t('direction.outgoing', 'Cites')
                    : t('direction.incoming', 'Cited by')}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {typeLabel}
                </Badge>
                {citation.status !== 'active' && (
                  <Badge className={`text-xs ${statusColor}`}>{statusLabel}</Badge>
                )}
                {isExternal && (
                  <Badge variant="outline" className="text-xs flex items-center gap-1">
                    <ExternalLink className="h-3 w-3" />
                    {t('badges.external', 'External')}
                  </Badge>
                )}
              </div>

              {/* Title/Name */}
              <div>
                <h4 className="text-sm sm:text-base font-semibold text-foreground">
                  {citation.external_title ||
                    citation.related_entity_name ||
                    citation.related_entity_id?.slice(0, 8) ||
                    t('unknown', 'Unknown')}
                </h4>
                {citation.external_url && (
                  <a
                    href={citation.external_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline truncate block max-w-full"
                  >
                    {citation.external_url}
                  </a>
                )}
              </div>

              {/* Context excerpt */}
              {citation.citation_context && (
                <p className="text-xs text-muted-foreground line-clamp-2">
                  "{citation.citation_context}"
                </p>
              )}

              {/* Metadata row */}
              <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                {citation.relevance_score !== undefined && citation.relevance_score !== null && (
                  <span className="flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" />
                    {t('relevance', 'Relevance')}: {Math.round(citation.relevance_score * 100)}%
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatDate(citation.created_at, locale)}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 self-start">
              {citation.external_url && (
                <Button variant="outline" size="sm" asChild className="min-h-9">
                  <a href={citation.external_url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 me-2" />
                    {t('actions.open', 'Open')}
                  </a>
                </Button>
              )}

              {!citation.external_url && citation.related_entity_id && onView && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onView(citation)}
                  className="min-h-9"
                >
                  <Eye className="h-4 w-4 me-2" />
                  {t('actions.view', 'View')}
                </Button>
              )}

              {editable && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">{t('actions.more', 'More')}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align={isRTL ? 'start' : 'end'}>
                    {onEdit && (
                      <DropdownMenuItem onClick={() => onEdit(citation)}>
                        <Edit className="h-4 w-4 me-2" />
                        {t('actions.edit', 'Edit')}
                      </DropdownMenuItem>
                    )}
                    {onDelete && (
                      <DropdownMenuItem
                        onClick={() => onDelete(citation.citation_id)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="h-4 w-4 me-2" />
                        {t('actions.delete', 'Delete')}
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  },
)
CitationCard.displayName = 'CitationCard'

// ============================================================================
// Citations List Component
// ============================================================================

interface CitationsListProps {
  citations: EntityCitation[]
  isRTL: boolean
  locale: string
  editable: boolean
  onEdit?: (citation: EntityCitation) => void
  onDelete?: (citationId: string) => void
  onView?: (citation: EntityCitation) => void
}

function CitationsList({
  citations,
  isRTL,
  locale,
  editable,
  onEdit,
  onDelete,
  onView,
}: CitationsListProps) {
  const { t } = useTranslation('citations')

  // Group by direction
  const outgoing = citations.filter((c) => c.direction === 'outgoing')
  const incoming = citations.filter((c) => c.direction === 'incoming')

  return (
    <div className="space-y-6">
      {/* Outgoing citations (what this entity cites) */}
      {outgoing.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
            <ArrowUpRight className={`h-4 w-4 ${isRTL ? 'rotate-180' : ''}`} />
            {t('sections.outgoing', 'References')} ({outgoing.length})
          </h4>
          <div className="grid grid-cols-1 gap-3">
            {outgoing.map((citation) => (
              <CitationCard
                key={citation.citation_id}
                citation={citation}
                direction="outgoing"
                isRTL={isRTL}
                locale={locale}
                editable={editable}
                onEdit={onEdit}
                onDelete={onDelete}
                onView={onView}
              />
            ))}
          </div>
        </div>
      )}

      {/* Incoming citations (what cites this entity) */}
      {incoming.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
            <ArrowDownLeft className={`h-4 w-4 ${isRTL ? 'rotate-180' : ''}`} />
            {t('sections.incoming', 'Cited By')} ({incoming.length})
          </h4>
          <div className="grid grid-cols-1 gap-3">
            {incoming.map((citation) => (
              <CitationCard
                key={citation.citation_id}
                citation={citation}
                direction="incoming"
                isRTL={isRTL}
                locale={locale}
                editable={editable}
                onEdit={onEdit}
                onDelete={onDelete}
                onView={onView}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ============================================================================
// Main Component
// ============================================================================

export function CitationsSection({
  entityType,
  entityId,
  entityName = '',
  entityNameAr,
  visualizationMode = 'both',
  editable = true,
  className = '',
}: CitationsSectionProps) {
  const { t, i18n } = useTranslation('citations')
  const isRTL = i18n.language === 'ar'
  const [viewMode, setViewMode] = useState<'list' | 'graph'>(
    visualizationMode === 'both' ? 'list' : visualizationMode,
  )

  // Dialog states
  const [formDialogOpen, setFormDialogOpen] = useState(false)
  const [editingCitation, setEditingCitation] = useState<EntityCitation | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingCitationId, setDeletingCitationId] = useState<string | null>(null)

  // Fetch citations
  const {
    data: citations,
    isLoading,
    error,
  } = useEntityCitations({ entity_type: entityType, entity_id: entityId, direction: 'both' }, true)

  // Get stats
  const stats = useEntityCitationStats(entityType, entityId)

  // Delete mutation
  const deleteMutation = useDeleteCitation()

  // Handlers
  const handleAddCitation = useCallback(() => {
    setEditingCitation(null)
    setFormDialogOpen(true)
  }, [])

  const handleEditCitation = useCallback((citation: EntityCitation) => {
    setEditingCitation(citation)
    setFormDialogOpen(true)
  }, [])

  const handleDeleteClick = useCallback((citationId: string) => {
    setDeletingCitationId(citationId)
    setDeleteDialogOpen(true)
  }, [])

  const handleDeleteConfirm = useCallback(async () => {
    if (deletingCitationId) {
      await deleteMutation.mutateAsync(deletingCitationId)
      setDeleteDialogOpen(false)
      setDeletingCitationId(null)
    }
  }, [deletingCitationId, deleteMutation])

  const handleViewCitation = useCallback((citation: EntityCitation) => {
    // Navigate to the related entity - implement based on your routing
    console.log('View citation:', citation)
  }, [])

  // Loading state
  if (isLoading) {
    return (
      <div className={`space-y-4 ${className}`} dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-9 w-24" />
        </div>
        <Skeleton className="h-[400px] w-full" />
      </div>
    )
  }

  // Empty state
  if (!citations || citations.length === 0) {
    return (
      <div
        className={`flex flex-col items-center justify-center py-8 sm:py-12 text-center ${className}`}
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <div className="mb-4 sm:mb-6">
          <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-primary/10 flex items-center justify-center">
            <Link2 className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
          </div>
        </div>

        <h3 className="text-base sm:text-lg font-semibold text-foreground mb-2">
          {t('empty.title', 'No Citations')}
        </h3>

        <p className="text-sm sm:text-base text-muted-foreground max-w-md mb-6 px-4">
          {t(
            'empty.description',
            'Track references to other dossiers, documents, and external sources.',
          )}
        </p>

        {editable && (
          <Button variant="outline" size="sm" onClick={handleAddCitation}>
            <Plus className="h-4 w-4 me-2" />
            {t('actions.addCitation', 'Add Citation')}
          </Button>
        )}

        {/* Form Dialog */}
        <CitationFormDialog
          open={formDialogOpen}
          onOpenChange={setFormDialogOpen}
          citingEntityType={entityType}
          citingEntityId={entityId}
          citingEntityName={entityName}
        />
      </div>
    )
  }

  const showTabs = visualizationMode === 'both'

  return (
    <div className={className} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header with stats and actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div className="flex items-center gap-3 flex-wrap">
          <Badge variant="secondary" className="text-xs">
            {t('stats.outgoing', '{{count}} References', { count: stats.outgoing })}
          </Badge>
          <Badge variant="outline" className="text-xs">
            {t('stats.incoming', '{{count}} Cited By', { count: stats.incoming })}
          </Badge>
          {stats.external > 0 && (
            <Badge variant="outline" className="text-xs flex items-center gap-1">
              <ExternalLink className="h-3 w-3" />
              {stats.external} {t('stats.external', 'External')}
            </Badge>
          )}
        </div>

        {editable && (
          <Button variant="outline" size="sm" onClick={handleAddCitation}>
            <Plus className="h-4 w-4 me-2" />
            {t('actions.addCitation', 'Add Citation')}
          </Button>
        )}
      </div>

      {/* View tabs or single view */}
      {showTabs ? (
        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'list' | 'graph')}>
          <TabsList className="mb-4">
            <TabsTrigger value="list" className="flex items-center gap-2">
              <List className="h-4 w-4" />
              {t('views.list', 'List')}
            </TabsTrigger>
            <TabsTrigger value="graph" className="flex items-center gap-2">
              <Network className="h-4 w-4" />
              {t('views.graph', 'Graph')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="list">
            <CitationsList
              citations={citations}
              isRTL={isRTL}
              locale={i18n.language}
              editable={editable}
              onEdit={handleEditCitation}
              onDelete={handleDeleteClick}
              onView={handleViewCitation}
            />
          </TabsContent>

          <TabsContent value="graph">
            <CitationNetworkGraph
              entityType={entityType}
              entityId={entityId}
              height="500px"
              onNodeClick={(nodeId, nodeType) => {
                console.log('Clicked node:', nodeId, nodeType)
              }}
            />
          </TabsContent>
        </Tabs>
      ) : viewMode === 'list' ? (
        <CitationsList
          citations={citations}
          isRTL={isRTL}
          locale={i18n.language}
          editable={editable}
          onEdit={handleEditCitation}
          onDelete={handleDeleteClick}
          onView={handleViewCitation}
        />
      ) : (
        <CitationNetworkGraph entityType={entityType} entityId={entityId} height="500px" />
      )}

      {/* Form Dialog */}
      <CitationFormDialog
        open={formDialogOpen}
        onOpenChange={setFormDialogOpen}
        citingEntityType={entityType}
        citingEntityId={entityId}
        citingEntityName={entityName}
        editingCitation={editingCitation}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent dir={isRTL ? 'rtl' : 'ltr'}>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('dialogs.delete.title', 'Delete Citation')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t(
                'dialogs.delete.description',
                'Are you sure you want to delete this citation? This action cannot be undone.',
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-col-reverse sm:flex-row gap-2">
            <AlertDialogCancel>{t('actions.cancel', 'Cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending
                ? t('actions.deleting', 'Deleting...')
                : t('actions.delete', 'Delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default CitationsSection
