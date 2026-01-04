/**
 * Entity Link Manager Component
 * Feature: 024-intake-entity-linking
 * Task: T049
 *
 * Main container component for managing entity links on intake tickets
 * Lazy loaded for performance optimization
 */

import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from '@tanstack/react-router'
import { Plus, Trash, Link as LinkIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import { EntitySearchDialog } from './EntitySearchDialog'
import { LinkList } from './LinkList'
import { AISuggestionPanel } from './AISuggestionPanel'
import EntityLinkSuggestions from '@/components/ai/EntityLinkSuggestions'
import {
  useEntityLinks,
  useCreateEntityLink,
  useCreateBatchEntityLinks,
  useDeleteEntityLink,
  useRestoreEntityLink,
} from '@/hooks/use-entity-links'
import { intakeEntityLinksAPI } from '@/services/entity-links-api'
import type {
  EntitySearchResult,
  LinkType,
} from '../../../../backend/src/types/intake-entity-links.types'

export interface EntityLinkManagerProps {
  /** Intake ticket ID */
  intakeId: string
  /** Organization ID for filtering entities */
  organizationId?: string
  /** User's clearance level for filtering entities */
  classificationLevel?: number
  /** Whether user can restore deleted links (steward+ role) */
  canRestore?: boolean
  /** Enable drag-and-drop reordering */
  enableReorder?: boolean
  /** Use new AI agent-based suggestions (Feature 033) */
  useAgentSuggestions?: boolean
  /** Additional CSS classes */
  className?: string
}

/**
 * EntityLinkManager Component
 *
 * Manages all entity link operations for an intake ticket.
 * Provides search dialog, link list, and deleted links management.
 *
 * @example
 * ```tsx
 * <EntityLinkManager
 * intakeId={intakeId}
 * organizationId={currentOrgId}
 * classificationLevel={userProfile.clearance_level}
 * canRestore={hasRole('steward')}
 * enableReorder={true}
 * />
 * ```
 */
export function EntityLinkManager({
  intakeId,
  organizationId,
  classificationLevel,
  canRestore = false,
  enableReorder = false,
  useAgentSuggestions = true,
  className,
}: EntityLinkManagerProps) {
  const { t, i18n } = useTranslation()
  const isRTL = i18n.language === 'ar'
  const navigate = useNavigate()

  const [isSearchDialogOpen, setIsSearchDialogOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'active' | 'deleted'>('active')

  // Fetch entity links
  const { data: links = [], isLoading, error } = useEntityLinks(intakeId, activeTab === 'deleted')

  // Mutations
  const createLinkMutation = useCreateEntityLink(intakeId)
  const createBatchLinksMutation = useCreateBatchEntityLinks(intakeId)
  const deleteLinkMutation = useDeleteEntityLink(intakeId)
  const restoreLinkMutation = useRestoreEntityLink(intakeId)

  // Separate active and deleted links
  const activeLinks = useMemo(() => links.filter((link) => link.deleted_at === null), [links])
  const deletedLinks = useMemo(() => links.filter((link) => link.deleted_at !== null), [links])

  // Handle entity selection from search dialog (supports both single and batch)
  const handleEntitySelect = async (
    entities: EntitySearchResult[],
    shouldReplacePrimary?: boolean,
  ) => {
    // Check if there's already a primary link in the active links
    const existingPrimaryLink = activeLinks.find((link) => link.link_type === 'primary')

    // If user wants to replace the primary, convert the old primary to 'related' first
    if (shouldReplacePrimary && existingPrimaryLink) {
      try {
        // Update the existing primary link to 'related' using API client directly
        await intakeEntityLinksAPI.updateLink(intakeId, existingPrimaryLink.id, {
          link_type: 'related',
        })
      } catch (error) {
        console.error('[EntityLinkManager] Failed to demote existing primary:', error)
        // Continue anyway - the backend will reject duplicate primaries
      }
    }

    // Map entities to link format
    // Use the _shouldBePrimary flag from the dialog to determine link type
    const linksToCreate = entities.map((entity: any) => {
      // Determine link type based on user's selection or fallback logic
      let linkType: LinkType = 'related' // Default to related

      // Check if user explicitly marked this as primary
      if (entity._shouldBePrimary) {
        // If we're replacing, allow setting new primary
        // If no existing primary, allow setting new primary
        if (shouldReplacePrimary || !existingPrimaryLink) {
          linkType = 'primary'
        }
      } else if (
        // Fallback: if no primary exists and this is first anchor entity
        !existingPrimaryLink &&
        !shouldReplacePrimary &&
        !entities.some((e: any) => e._shouldBePrimary) && // No explicit primary selection
        (entity.entity_type === 'dossier' || entity.entity_type === 'position') &&
        entities.indexOf(entity) ===
          entities.findIndex((e) => e.entity_type === 'dossier' || e.entity_type === 'position')
      ) {
        linkType = 'primary'
      }

      return {
        entity_type: entity.entity_type,
        entity_id: entity.entity_id,
        link_type: linkType,
        notes: '',
      }
    })

    // Use batch creation for multiple entities, single creation for one entity
    if (linksToCreate.length === 1) {
      createLinkMutation.mutate(linksToCreate[0])
    } else if (linksToCreate.length > 1) {
      createBatchLinksMutation.mutate(linksToCreate)
    }
  }

  // Handle link deletion
  const handleDeleteLink = (linkId: string) => {
    deleteLinkMutation.mutate(linkId)
  }

  // Handle link restoration
  const handleRestoreLink = (linkId: string) => {
    restoreLinkMutation.mutate(linkId)
  }

  // Handle notes update
  const handleUpdateNotes = async (linkId: string, notes: string) => {
    try {
      await intakeEntityLinksAPI.updateLink(intakeId, linkId, { notes })
      // Optionally show success toast or refetch data here
    } catch (error) {
      console.error('[EntityLinkManager] Failed to update notes:', error)
      // Optionally show error toast here
    }
  }

  // Handle entity link click (navigate to entity)
  const handleLinkClick = (entityType: string, entityId: string) => {
    switch (entityType) {
      case 'dossier':
        navigate({ to: '/dossiers/$id', params: { id: entityId } })
        break
      case 'position':
        navigate({ to: '/positions/$id', params: { id: entityId } })
        break
      case 'person':
        navigate({ to: '/persons/$id', params: { id: entityId } })
        break
      case 'engagement':
        navigate({ to: '/engagements/$engagementId', params: { engagementId: entityId } })
        break
      case 'commitment':
        navigate({ to: '/commitments', search: { id: entityId } })
        break
      default:
        navigate({
          to: '/search',
          search: { q: entityId, type: entityType, includeArchived: false },
        })
    }
  }

  return (
    <div
      className={cn(
        // Container styles
        'w-full',
        className,
      )}
      aria-label={t('entityLinks.manager')}
    >
      {/* Header with actions */}
      <div
        className={cn(
          'flex items-center justify-between',
          'mb-4 sm:mb-6',
          'gap-3 sm:gap-4',
          isRTL && 'flex-row-reverse',
        )}
      >
        <div className={cn('flex items-center gap-2', isRTL && 'flex-row-reverse')}>
          <LinkIcon className="h-5 w-5 sm:h-6 sm:w-6 text-slate-600 dark:text-slate-400" />
          <h2
            className={cn(
              'text-lg sm:text-xl font-semibold',
              'text-slate-900 dark:text-slate-100',
              'text-start',
            )}
          >
            {t('entityLinks.title')}
          </h2>
        </div>

        {/* Add link button */}
        <Button
          variant="default"
          className={cn('px-4 sm:px-6', 'touch-manipulation', 'text-sm sm:text-base')}
          onClick={() => setIsSearchDialogOpen(true)}
          disabled={isLoading || createLinkMutation.isPending}
          aria-label={t('entityLinks.addLink')}
        >
          <Plus className={cn('h-4 w-4 sm:h-5 sm:w-5', isRTL ? 'ms-2' : 'me-2')} />
          <span className="hidden sm:inline">{t('entityLinks.addLink')}</span>
          <span className="sm:hidden">{t('entityLinks.add')}</span>
        </Button>
      </div>

      {/* AI Suggestions Panel - Use new agent-based suggestions (Feature 033) or legacy */}
      <div className="mb-6 sm:mb-8">
        {useAgentSuggestions ? (
          <EntityLinkSuggestions ticketId={intakeId} onLinkClick={handleLinkClick} />
        ) : (
          <AISuggestionPanel
            intakeId={intakeId}
            onManualSearchClick={() => setIsSearchDialogOpen(true)}
            onSuggestionAccepted={(_link) => {
              // Link is automatically added via mutation
            }}
          />
        )}
      </div>

      {/* Tabs for active/deleted links */}
      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as 'active' | 'deleted')}
        className="w-full"
      >
        <TabsList
          className={cn('w-full sm:w-auto', 'grid grid-cols-2 sm:inline-grid', 'mb-4 sm:mb-6')}
        >
          <TabsTrigger value="active" className={cn('touch-manipulation', 'text-sm sm:text-base')}>
            <span className={cn(isRTL && 'ms-2')}>
              {t('entityLinks.activeLinks')} ({activeLinks.length})
            </span>
          </TabsTrigger>

          {/* Deleted tab (show badge if there are deleted links) */}
          <TabsTrigger value="deleted" className={cn('touch-manipulation', 'text-sm sm:text-base')}>
            <Trash
              className={cn(
                'h-4 w-4',
                deletedLinks.length > 0 && 'text-red-600',
                isRTL ? 'ms-2' : 'me-2',
              )}
            />
            <span>
              {t('entityLinks.deletedLinks')} ({deletedLinks.length})
            </span>
          </TabsTrigger>
        </TabsList>

        {/* Active links tab */}
        <TabsContent value="active" className="mt-0">
          {/* Loading state */}
          {isLoading && (
            <div className="flex items-center justify-center py-8 sm:py-12">
              <div className="animate-pulse text-slate-400">{t('common.loading')}</div>
            </div>
          )}

          {/* Error state */}
          {error && (
            <div className="text-center py-8 sm:py-12">
              <p className="text-sm sm:text-base text-red-600">{t('entityLinks.loadError')}</p>
            </div>
          )}

          {/* Links list */}
          {!isLoading && !error && (
            <LinkList
              intakeId={intakeId}
              links={activeLinks}
              showDeleted={false}
              enableReorder={enableReorder}
              onDelete={handleDeleteLink}
              onUpdateNotes={handleUpdateNotes}
            />
          )}
        </TabsContent>

        {/* Deleted links tab */}
        <TabsContent value="deleted" className="mt-0">
          {/* Loading state */}
          {isLoading && (
            <div className="flex items-center justify-center py-8 sm:py-12">
              <div className="animate-pulse text-slate-400">{t('common.loading')}</div>
            </div>
          )}

          {/* Error state */}
          {error && (
            <div className="text-center py-8 sm:py-12">
              <p className="text-sm sm:text-base text-red-600">{t('entityLinks.loadError')}</p>
            </div>
          )}

          {/* Deleted links list */}
          {!isLoading && !error && (
            <LinkList
              intakeId={intakeId}
              links={deletedLinks}
              showDeleted={true}
              canRestore={canRestore}
              onRestore={handleRestoreLink}
            />
          )}
        </TabsContent>
      </Tabs>

      {/* Entity search dialog */}
      <EntitySearchDialog
        open={isSearchDialogOpen}
        onOpenChange={setIsSearchDialogOpen}
        onSelect={handleEntitySelect}
        intakeId={intakeId}
        organizationId={organizationId}
        classificationLevel={classificationLevel}
        includeArchived={false}
      />
    </div>
  )
}

export default EntityLinkManager
