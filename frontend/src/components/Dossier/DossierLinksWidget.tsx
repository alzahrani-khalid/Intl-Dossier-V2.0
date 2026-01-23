/**
 * DossierLinksWidget Component
 * Feature: 035-dossier-context (Smart Dossier Context Inheritance)
 *
 * Reusable widget for displaying and managing dossier links on entity detail pages.
 * Shows linked dossiers with type badges, inheritance path, and navigation.
 *
 * Mobile-first, RTL support, WCAG 2.1 AA compliant.
 */

import { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from '@tanstack/react-router'
import {
  Plus,
  X,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Loader2,
  Link2,
  ArrowRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { getDossierDetailPath } from '@/lib/dossier-routes'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { DossierTypeIcon } from './DossierTypeIcon'
import { DossierSelector, type SelectedDossier } from './DossierSelector'
import { useWorkItemDossierLinks } from '@/hooks/useWorkItemDossierLinks'
import { useCreateWorkItemDossierLinks } from '@/hooks/useCreateWorkItemDossierLinks'
import { useDeleteWorkItemDossierLink } from '@/hooks/useDeleteWorkItemDossierLink'
import type {
  WorkItemType,
  InheritanceSource,
  WorkItemDossierLink,
} from '@/types/dossier-context.types'
import type { DossierType } from '@/types/relationship.types'

// ============================================================================
// Types
// ============================================================================

export interface DossierLinksWidgetProps {
  /**
   * The type of work item (task, commitment, intake).
   */
  workItemType: WorkItemType
  /**
   * The ID of the work item.
   */
  workItemId: string
  /**
   * Whether to allow editing (add/remove links).
   * @default false
   */
  editable?: boolean
  /**
   * Whether to show in compact mode (minimal UI).
   * @default false
   */
  compact?: boolean
  /**
   * Whether to show the card wrapper.
   * @default true
   */
  showCard?: boolean
  /**
   * Whether to show empty state when no links.
   * @default true
   */
  showEmptyState?: boolean
  /**
   * Maximum number of links to show before collapsing.
   * @default 5
   */
  maxVisible?: number
  /**
   * Additional CSS classes.
   */
  className?: string
  /**
   * Title override.
   */
  title?: string
}

// ============================================================================
// Inheritance Source Config
// ============================================================================

const INHERITANCE_SOURCE_CONFIG: Record<InheritanceSource, { icon: string; color: string }> = {
  direct: { icon: 'link', color: 'text-blue-600 dark:text-blue-400' },
  engagement: { icon: 'calendar', color: 'text-purple-600 dark:text-purple-400' },
  after_action: { icon: 'clipboard', color: 'text-amber-600 dark:text-amber-400' },
  position: { icon: 'briefcase', color: 'text-green-600 dark:text-green-400' },
  mou: { icon: 'file-text', color: 'text-indigo-600 dark:text-indigo-400' },
}

// ============================================================================
// Helper Components
// ============================================================================

interface DossierLinkItemProps {
  link: WorkItemDossierLink
  isRTL: boolean
  editable: boolean
  compact: boolean
  onRemove: (link: WorkItemDossierLink) => void
  t: (key: string, fallback?: string) => string
}

function DossierLinkItem({ link, isRTL, editable, compact, onRemove, t }: DossierLinkItemProps) {
  const dossier = link.dossier
  if (!dossier) return null

  const displayName = isRTL ? dossier.name_ar || dossier.name_en : dossier.name_en
  const inheritanceConfig = INHERITANCE_SOURCE_CONFIG[link.inheritance_source]

  // Inheritance path for tooltip
  const inheritancePath = link.inheritance_path?.map((step) =>
    isRTL ? step.name_ar || step.name_en : step.name_en,
  )

  return (
    <div
      className={cn(
        'group flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg border bg-card',
        'hover:bg-accent/50 transition-colors',
        compact && 'p-1.5 sm:p-2',
      )}
    >
      {/* Dossier Type Icon */}
      <DossierTypeIcon type={dossier.type as DossierType} size={compact ? 'sm' : 'md'} colored />

      {/* Dossier Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Dossier Name with Link */}
          <Link
            to={getDossierDetailPath(dossier.id, dossier.type as DossierType)}
            className="font-medium text-sm sm:text-base truncate hover:text-primary hover:underline"
          >
            {displayName}
          </Link>

          {/* Primary Badge */}
          {link.is_primary && (
            <Badge variant="default" className="text-[10px] px-1.5 py-0 h-5">
              {t('widget.primary', 'Primary')}
            </Badge>
          )}

          {/* Type Badge */}
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 hidden sm:inline-flex">
            {t(`type.${dossier.type}`, dossier.type)}
          </Badge>
        </div>

        {/* Inheritance Info */}
        {link.inheritance_source !== 'direct' && !compact && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  className={cn('flex items-center gap-1 mt-1 text-xs', inheritanceConfig.color)}
                >
                  <ArrowRight className={cn('size-3', isRTL && 'rotate-180')} />
                  <span>
                    {t(`inheritance.${link.inheritance_source}`, link.inheritance_source)}
                  </span>
                </div>
              </TooltipTrigger>
              {inheritancePath && inheritancePath.length > 0 && (
                <TooltipContent side={isRTL ? 'left' : 'right'} className="max-w-xs">
                  <div className="space-y-1">
                    <p className="font-medium text-xs">
                      {t('widget.inheritance_path', 'Inheritance Path')}
                    </p>
                    <p className="text-xs text-muted-foreground">{inheritancePath.join(' → ')}</p>
                  </div>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 shrink-0">
        {/* Navigate Button */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm" className="size-8 p-0" asChild>
                <Link to={getDossierDetailPath(dossier.id, dossier.type as DossierType)}>
                  <ExternalLink className="size-4" />
                  <span className="sr-only">{t('widget.view_dossier', 'View Dossier')}</span>
                </Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t('widget.view_dossier', 'View Dossier')}</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Remove Button (only for direct links when editable) */}
        {editable && link.inheritance_source === 'direct' && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="size-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => onRemove(link)}
                >
                  <X className="size-4" />
                  <span className="sr-only">{t('widget.remove_link', 'Remove Link')}</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t('widget.remove_link', 'Remove Link')}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
    </div>
  )
}

// ============================================================================
// Main Component
// ============================================================================

export function DossierLinksWidget({
  workItemType,
  workItemId,
  editable = false,
  compact = false,
  showCard = true,
  showEmptyState = true,
  maxVisible = 5,
  className,
  title,
}: DossierLinksWidgetProps) {
  const { t, i18n } = useTranslation('dossier-context')
  const isRTL = i18n.language === 'ar'

  // State
  const [isExpanded, setIsExpanded] = useState(false)
  const [isAddingDossier, setIsAddingDossier] = useState(false)
  const [linkToRemove, setLinkToRemove] = useState<WorkItemDossierLink | null>(null)

  // Fetch dossier links
  const { links, isLoading, isError, refetch } = useWorkItemDossierLinks(workItemType, workItemId)

  // Create link mutation
  const createLinks = useCreateWorkItemDossierLinks({
    onSuccess: () => {
      setIsAddingDossier(false)
      refetch()
    },
  })

  // Delete link mutation
  const deleteLink = useDeleteWorkItemDossierLink({
    onSuccess: () => {
      setLinkToRemove(null)
      refetch()
    },
  })

  // Handlers
  const handleAddDossier = useCallback(
    (dossierIds: string[], dossiers: SelectedDossier[]) => {
      if (dossierIds.length === 0) return

      createLinks.mutate({
        work_item_type: workItemType,
        work_item_id: workItemId,
        dossier_ids: dossierIds,
        inheritance_source: 'direct',
        is_primary: links.length === 0, // First link is primary
      })
    },
    [createLinks, workItemType, workItemId, links.length],
  )

  const handleRemoveLink = useCallback((link: WorkItemDossierLink) => {
    setLinkToRemove(link)
  }, [])

  const confirmRemoveLink = useCallback(() => {
    if (!linkToRemove) return

    deleteLink.mutate({
      linkId: linkToRemove.id,
      workItemType: linkToRemove.work_item_type,
      workItemId: linkToRemove.work_item_id,
      dossierId: linkToRemove.dossier_id,
    })
  }, [linkToRemove, deleteLink])

  // Visible links (collapsible)
  const visibleLinks = isExpanded ? links : links.slice(0, maxVisible)
  const hasMore = links.length > maxVisible

  // Loading state
  if (isLoading) {
    const content = (
      <div className="space-y-2">
        {[1, 2].map((i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    )

    if (!showCard) return <div className={className}>{content}</div>

    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Link2 className="size-4" />
            <Skeleton className="h-5 w-32" />
          </CardTitle>
        </CardHeader>
        <CardContent>{content}</CardContent>
      </Card>
    )
  }

  // Error state
  if (isError) {
    const content = (
      <div className="flex items-center gap-2 text-destructive text-sm p-3 bg-destructive/10 rounded-lg">
        <AlertCircle className="size-4 shrink-0" />
        <span>{t('errors.load_timeline_failed', 'Failed to load dossier links')}</span>
        <Button variant="ghost" size="sm" onClick={() => refetch()} className="ms-auto">
          {t('actions.retry', 'Retry')}
        </Button>
      </div>
    )

    if (!showCard) return <div className={className}>{content}</div>

    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Link2 className="size-4" />
            {title || t('widget.title', 'Linked Dossiers')}
          </CardTitle>
        </CardHeader>
        <CardContent>{content}</CardContent>
      </Card>
    )
  }

  // Empty state
  if (links.length === 0 && !isAddingDossier) {
    if (!showEmptyState && !editable) return null

    const content = (
      <div className="flex flex-col items-center justify-center py-6 text-center">
        <Link2 className="size-10 text-muted-foreground/50 mb-3" />
        <p className="text-sm text-muted-foreground mb-3">
          {t('widget.no_links', 'No dossiers linked')}
        </p>
        {editable && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAddingDossier(true)}
            className="min-h-11"
          >
            <Plus className={cn('size-4', isRTL ? 'ms-2' : 'me-2')} />
            {t('widget.add_dossier', 'Add Dossier')}
          </Button>
        )}
      </div>
    )

    if (!showCard) return <div className={className}>{content}</div>

    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Link2 className="size-4" />
            {title || t('widget.title', 'Linked Dossiers')}
          </CardTitle>
        </CardHeader>
        <CardContent>{content}</CardContent>
      </Card>
    )
  }

  // Main content
  const mainContent = (
    <div className="space-y-3" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Dossier Links List */}
      <Collapsible open={isExpanded || links.length <= maxVisible} onOpenChange={setIsExpanded}>
        <div className="space-y-2">
          {visibleLinks.map((link) => (
            <DossierLinkItem
              key={link.id}
              link={link}
              isRTL={isRTL}
              editable={editable}
              compact={compact}
              onRemove={handleRemoveLink}
              t={t}
            />
          ))}
        </div>

        {/* Show More/Less */}
        {hasMore && (
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="w-full mt-2 text-muted-foreground">
              {isExpanded ? (
                <>
                  <ChevronUp className={cn('size-4', isRTL ? 'ms-2' : 'me-2')} />
                  {t('widget.show_less', 'Show less')}
                </>
              ) : (
                <>
                  <ChevronDown className={cn('size-4', isRTL ? 'ms-2' : 'me-2')} />
                  {t('widget.show_more', 'Show {{count}} more', {
                    count: links.length - maxVisible,
                  })}
                </>
              )}
            </Button>
          </CollapsibleTrigger>
        )}
      </Collapsible>

      {/* Add Dossier Section */}
      {isAddingDossier && (
        <div className="pt-3 border-t space-y-3">
          <DossierSelector
            onChange={handleAddDossier}
            required={false}
            multiple
            disabled={createLinks.isPending}
            label={t('widget.select_dossier', 'Select dossier to link')}
          />
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAddingDossier(false)}
              disabled={createLinks.isPending}
              className="min-h-11"
            >
              {t('actions.cancel', 'Cancel')}
            </Button>
          </div>
        </div>
      )}

      {/* Add Button (when not adding) */}
      {editable && !isAddingDossier && links.length > 0 && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsAddingDossier(true)}
          className="w-full min-h-11"
        >
          <Plus className={cn('size-4', isRTL ? 'ms-2' : 'me-2')} />
          {t('widget.add_dossier', 'Add Dossier')}
        </Button>
      )}
    </div>
  )

  // Remove confirmation dialog
  const removeDialog = (
    <AlertDialog open={!!linkToRemove} onOpenChange={(open) => !open && setLinkToRemove(null)}>
      <AlertDialogContent dir={isRTL ? 'rtl' : 'ltr'}>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {t('widget.confirm_remove_title', 'Remove Dossier Link')}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {t(
              'widget.confirm_remove_description',
              'Are you sure you want to remove this dossier link? This action cannot be undone.',
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteLink.isPending}>
            {t('actions.cancel', 'Cancel')}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={confirmRemoveLink}
            disabled={deleteLink.isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {deleteLink.isPending ? (
              <>
                <Loader2 className={cn('size-4 animate-spin', isRTL ? 'ms-2' : 'me-2')} />
                {t('actions.removing', 'Removing...')}
              </>
            ) : (
              t('actions.remove', 'Remove')
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )

  // Return with or without card wrapper
  if (!showCard) {
    return (
      <div className={className}>
        {mainContent}
        {removeDialog}
      </div>
    )
  }

  return (
    <>
      <Card className={className}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-base">
              <Link2 className="size-4" />
              {title || t('widget.title', 'Linked Dossiers')}
              {links.length > 0 && (
                <Badge variant="secondary" className="ms-2">
                  {links.length}
                </Badge>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>{mainContent}</CardContent>
      </Card>
      {removeDialog}
    </>
  )
}

export default DossierLinksWidget
