/**
 * RelationshipSidebar
 * Tier-grouped linked dossiers sidebar for dossier detail pages.
 *
 * Desktop (lg+): Expandable/collapsible sidebar with tier sections.
 * Mobile (< lg): Hidden; triggered via BottomSheet from DossierShell header.
 *
 * Features:
 * - Tier-grouped dossier links (Strategic, Operational, Informational)
 * - Collapse to icon strip with tooltips
 * - Quick-add popover with DossierSelector
 * - Remove relationship with confirmation dialog
 * - localStorage-persisted open/closed state (managed by parent)
 *
 * RTL-compatible, logical properties only.
 */

import { type ReactElement, lazy, Suspense, useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from '@tanstack/react-router'
import { useDirection } from '@/hooks/useDirection'
import { useRelationshipsForDossier } from '@/domains/relationships/hooks/useRelationships'
import { useDeleteRelationship } from '@/domains/relationships/hooks/useRelationships'
import { DossierSelector, type SelectedDossier } from '@/components/dossier/DossierSelector'
import { useCreateRelationship } from '@/domains/relationships/hooks/useRelationships'
import { useDossier } from '@/domains/dossiers/hooks/useDossier'
import { MiniRelationshipGraph } from './MiniRelationshipGraph'
import type { Dossier } from '@/lib/dossier-type-guards'
import {
  BottomSheet,
  BottomSheetContent,
  BottomSheetHeader,
  BottomSheetTitle,
  BottomSheetDescription,
} from '@/components/ui/bottom-sheet'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import {
  AdaptiveDialog,
  AdaptiveDialogBody,
} from '@/components/ui/adaptive-dialog'
import { getDossierDetailPath } from '@/lib/dossier-routes'
import { cn } from '@/lib/utils'
import {
  ChevronDown,
  Expand,
  Flag,
  Building2,
  Globe,
  Handshake,
  MessageSquare,
  Users,
  User,
  Vote,
  Link2,
  PanelRightClose,
  PanelRightOpen,
  Plus,
  Trash2,
  X,
} from 'lucide-react'

// Lazy-load FullScreenGraphModal to maintain 200KB bundle budget
const FullScreenGraphModal = lazy(() => import('../graph/FullScreenGraphModal'))

// ============================================================================
// Constants
// ============================================================================

const DOSSIER_TYPE_ICONS: Record<string, typeof Flag> = {
  country: Flag,
  organization: Building2,
  forum: Globe,
  engagement: Handshake,
  topic: MessageSquare,
  working_group: Users,
  person: User,
  elected_official: Vote,
}

/** Classify relationship types into tiers for grouping */
const TIER_CLASSIFICATION: Record<string, string> = {
  bilateral_relation: 'strategic',
  partnership: 'strategic',
  cooperates_with: 'strategic',
  member_of: 'operational',
  participates_in: 'operational',
  parent_of: 'operational',
  subsidiary_of: 'operational',
  hosted_by: 'operational',
  sponsored_by: 'operational',
  involves: 'operational',
  participant_in: 'operational',
  observer_of: 'operational',
  membership: 'operational',
  parent_child: 'operational',
  participation: 'operational',
  affiliation: 'operational',
  dependency: 'operational',
  collaboration: 'operational',
  represents: 'informational',
  related_to: 'informational',
  discusses: 'informational',
  affiliate_of: 'informational',
  successor_of: 'informational',
  predecessor_of: 'informational',
}

const TIER_ORDER = ['strategic', 'operational', 'informational'] as const
const TIER_LABELS: Record<string, string> = {
  strategic: 'Strategic',
  operational: 'Operational',
  informational: 'Informational',
}

// ============================================================================
// Types
// ============================================================================

interface LinkedDossier {
  id: string
  type: string
  name_en: string
  name_ar: string | null
  relationshipId: string
  relationshipType: string
  tier: string
}

// ============================================================================
// Props
// ============================================================================

interface RelationshipSidebarProps {
  dossierId: string
  open: boolean
  onToggle: () => void
  className?: string
  mobileOpen?: boolean
  onMobileClose?: () => void
}

// ============================================================================
// Component
// ============================================================================

export function RelationshipSidebar({
  dossierId,
  open,
  onToggle,
  className,
  mobileOpen = false,
  onMobileClose,
}: RelationshipSidebarProps): ReactElement {
  const { t } = useTranslation('dossier-shell')
  const { isRTL } = useDirection()

  // Data fetching
  const { data: relationshipsData, isLoading } = useRelationshipsForDossier(dossierId)
  const { data: dossier } = useDossier(dossierId)
  const createRelationship = useCreateRelationship()
  const deleteRelationship = useDeleteRelationship()

  // Quick-add popover state
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false)

  // Full-screen graph modal state
  const [graphModalOpen, setGraphModalOpen] = useState(false)

  // Remove confirmation state
  const [removeTarget, setRemoveTarget] = useState<LinkedDossier | null>(null)

  // Collapsible tier state
  const [collapsedTiers, setCollapsedTiers] = useState<Record<string, boolean>>({})

  // Parse relationships into linked dossiers grouped by tier
  const linkedDossiers = useMemo((): LinkedDossier[] => {
    if (relationshipsData == null) return []
    const rawData = relationshipsData as { data?: Record<string, unknown>[] }
    const relationships = rawData.data ?? []
    if (!Array.isArray(relationships)) return []

    return relationships.map((rel) => {
      const isSource = (rel.source_dossier_id as string) === dossierId
      const linked = isSource ? rel.target_dossier : rel.source_dossier
      const linkedObj = (linked ?? {}) as Record<string, unknown>
      const relType = (rel.relationship_type as string) ?? 'related_to'

      return {
        id: (linkedObj.id as string) ?? '',
        type: (linkedObj.type as string) ?? 'country',
        name_en: (linkedObj.name_en as string) ?? '',
        name_ar: (linkedObj.name_ar as string | null) ?? null,
        relationshipId: (rel.id as string) ?? '',
        relationshipType: relType,
        tier: TIER_CLASSIFICATION[relType] ?? 'informational',
      }
    })
  }, [relationshipsData, dossierId])

  // Group by tier
  const tierGroups = useMemo(() => {
    const groups: Record<string, LinkedDossier[]> = {}
    for (const tier of TIER_ORDER) {
      const items = linkedDossiers.filter((d) => d.tier === tier)
      if (items.length > 0) {
        groups[tier] = items
      }
    }
    return groups
  }, [linkedDossiers])

  // Icon strip data for collapsed state
  const iconStripData = useMemo(() => {
    const typeCounts: Record<string, number> = {}
    for (const d of linkedDossiers) {
      typeCounts[d.type] = (typeCounts[d.type] ?? 0) + 1
    }
    return Object.entries(typeCounts).map(([type, count]) => ({ type, count }))
  }, [linkedDossiers])

  const toggleTier = useCallback((tier: string): void => {
    setCollapsedTiers((prev) => ({ ...prev, [tier]: !(prev[tier] ?? false) }))
  }, [])

  const handleQuickAdd = useCallback(
    (_ids: string[], dossiers: SelectedDossier[]): void => {
      const selected = dossiers[0]
      if (selected == null) return
      createRelationship.mutate({
        source_dossier_id: dossierId,
        target_dossier_id: selected.id,
        relationship_type: 'related_to',
      })
      setIsQuickAddOpen(false)
    },
    [dossierId, createRelationship],
  )

  const handleRemoveConfirm = useCallback((): void => {
    if (removeTarget === null) return
    deleteRelationship.mutate(removeTarget.relationshipId)
    setRemoveTarget(null)
  }, [removeTarget, deleteRelationship])

  // ============================================================================
  // Sidebar content (shared between desktop & mobile)
  // ============================================================================

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-3 border-b">
        <span className="text-sm font-semibold">{t('header.relationships')}</span>
        <Popover open={isQuickAddOpen} onOpenChange={setIsQuickAddOpen}>
          <PopoverTrigger asChild>
            <Button
              size="sm"
              className="min-h-11 gap-1 bg-primary text-primary-foreground"
            >
              <Plus className="h-4 w-4" />
              <span className="text-xs">{t('sidebar.linkDossier')}</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-3" align="end">
            <DossierSelector
              onChange={handleQuickAdd}
              multiple={false}
              required={false}
              label={t('sidebar.linkDossier')}
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Mini relationship graph -- desktop only (not shown in mobile sheet) */}
      {open && dossier != null && (
        <div className="px-2 pb-2 border-b">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 px-1">
            {t('sidebar.relationshipMap')}
          </h3>
          {/* useDossier returns DossierWithExtension; MiniRelationshipGraph expects Dossier
              from dossier-type-guards. Both share the same structural shape. */}
          <MiniRelationshipGraph
            dossier={dossier as unknown as Dossier}
            maxHeight="160px"
            className="rounded-md border"
            key={String(open)}
          />
          <Button
            variant="ghost"
            size="sm"
            className="w-full mt-2 min-h-11"
            onClick={() => setGraphModalOpen(true)}
          >
            <Expand className="me-2 h-4 w-4" />
            {t('sidebar.expandGraph')}
          </Button>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-2 py-2">
        {isLoading ? (
          <div className="space-y-3 px-1">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </div>
        ) : linkedDossiers.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
            <Link2 className="h-10 w-10 text-muted-foreground/40 mb-3" />
            <p className="text-sm font-medium text-muted-foreground">
              {t('sidebar.emptyTitle')}
            </p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              {t('sidebar.emptyBody')}
            </p>
            <Button
              size="sm"
              className="mt-4 min-h-11 gap-1 bg-primary text-primary-foreground"
              onClick={() => setIsQuickAddOpen(true)}
            >
              <Plus className="h-4 w-4" />
              {t('sidebar.linkDossier')}
            </Button>
          </div>
        ) : (
          /* Tier sections */
          <div className="space-y-1">
            {TIER_ORDER.map((tier) => {
              const items = tierGroups[tier]
              if (items === undefined || items.length === 0) return null
              const isCollapsed = collapsedTiers[tier] ?? false

              return (
                <div key={tier}>
                  {/* Tier header */}
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 px-2 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground rounded-md transition-colors min-h-11"
                    onClick={() => toggleTier(tier)}
                    aria-expanded={!isCollapsed}
                    aria-controls={`tier-${tier}`}
                  >
                    <ChevronDown
                      className={cn(
                        'h-3.5 w-3.5 transition-transform duration-[150ms]',
                        isCollapsed && '-rotate-90',
                      )}
                    />
                    <span>{TIER_LABELS[tier]}</span>
                    <span className="bg-primary/10 text-primary text-xs rounded-full px-2">
                      {items.length}
                    </span>
                  </button>

                  {/* Tier items */}
                  {!isCollapsed && (
                    <div
                      id={`tier-${tier}`}
                      role="region"
                      aria-labelledby={`tier-header-${tier}`}
                      className="space-y-0.5 ps-4"
                    >
                      {items.map((item) => {
                        const Icon = DOSSIER_TYPE_ICONS[item.type] ?? Globe
                        const displayName = isRTL
                          ? (item.name_ar ?? item.name_en)
                          : item.name_en

                        return (
                          <div
                            key={item.relationshipId}
                            className="group flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted/50 transition-colors"
                          >
                            <Link
                              to={getDossierDetailPath(item.id, item.type) + '/overview'}
                              className="flex flex-1 items-center gap-2 min-w-0 min-h-11"
                            >
                              <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                              <div className="min-w-0 flex-1">
                                <span className="text-sm truncate block">
                                  {displayName}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {item.relationshipType.replace(/_/g, ' ')}
                                </span>
                              </div>
                            </Link>
                            <button
                              type="button"
                              className="opacity-0 group-hover:opacity-100 p-1 rounded-md hover:bg-destructive/10 hover:text-destructive transition-opacity min-h-11 min-w-11 flex items-center justify-center"
                              onClick={() => setRemoveTarget(item)}
                              aria-label={`Remove ${displayName}`}
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )

  // ============================================================================
  // Collapsed icon strip
  // ============================================================================

  const collapsedContent = (
    <div className="flex flex-col items-center gap-2 py-3">
      <TooltipProvider>
        {iconStripData.map(({ type, count }) => {
          const Icon = DOSSIER_TYPE_ICONS[type] ?? Globe
          return (
            <Tooltip key={type}>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className="relative p-2 rounded-md hover:bg-muted transition-colors min-h-11 min-w-11 flex items-center justify-center"
                  onClick={onToggle}
                >
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  {count > 1 && (
                    <span className="absolute -top-0.5 -end-0.5 bg-primary text-primary-foreground text-[10px] rounded-full h-4 w-4 flex items-center justify-center">
                      {count}
                    </span>
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent side={isRTL ? 'right' : 'left'}>
                {type.replace(/_/g, ' ')} ({count})
              </TooltipContent>
            </Tooltip>
          )
        })}
      </TooltipProvider>
    </div>
  )

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={cn(
          'flex-col border-s bg-sidebar transition-[width] duration-[250ms] ease-in-out overflow-hidden',
          open ? 'w-[280px]' : 'w-12 bg-muted',
          className,
        )}
        aria-expanded={open}
      >
        {/* Toggle button */}
        <div className="flex justify-center py-2 border-b">
          <Button
            variant="ghost"
            size="icon"
            className="min-h-11 min-w-11"
            onClick={onToggle}
            aria-label={open ? t('sidebar.collapse') : t('sidebar.expand')}
          >
            {open ? (
              isRTL ? (
                <PanelRightOpen className="h-4 w-4" />
              ) : (
                <PanelRightClose className="h-4 w-4" />
              )
            ) : isRTL ? (
              <PanelRightClose className="h-4 w-4" />
            ) : (
              <PanelRightOpen className="h-4 w-4" />
            )}
          </Button>
        </div>

        {open ? sidebarContent : collapsedContent}
      </aside>

      {/* Mobile bottom sheet */}
      <BottomSheet
        open={mobileOpen}
        onOpenChange={(val) => {
          if (!val && onMobileClose != null) {
            onMobileClose()
          }
        }}
        snapPreset="large"
      >
        <BottomSheetContent showHandle>
          <BottomSheetHeader>
            <BottomSheetTitle>{t('header.relationships')}</BottomSheetTitle>
            <BottomSheetDescription>{t('sidebar.emptyBody')}</BottomSheetDescription>
          </BottomSheetHeader>
          {sidebarContent}
        </BottomSheetContent>
      </BottomSheet>

      {/* Remove confirmation dialog */}
      <AdaptiveDialog
        open={removeTarget !== null}
        onOpenChange={(val) => {
          if (!val) setRemoveTarget(null)
        }}
        title={t('sidebar.removeConfirmTitle', {
          name: isRTL
            ? (removeTarget?.name_ar ?? removeTarget?.name_en ?? '')
            : (removeTarget?.name_en ?? ''),
        })}
      >
        <AdaptiveDialogBody>
          <p className="text-sm text-muted-foreground mb-4">
            {t('sidebar.removeConfirmBody')}
          </p>
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              className="min-h-11"
              onClick={() => setRemoveTarget(null)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              className="min-h-11 gap-1"
              onClick={handleRemoveConfirm}
            >
              <Trash2 className="h-4 w-4" />
              Remove
            </Button>
          </div>
        </AdaptiveDialogBody>
      </AdaptiveDialog>

      {/* Full-screen graph modal -- lazy-loaded */}
      {graphModalOpen && (
        <Suspense fallback={null}>
          <FullScreenGraphModal
            open={graphModalOpen}
            onOpenChange={setGraphModalOpen}
            dossierId={dossierId}
            dossierType={dossier?.type ?? 'country'}
          />
        </Suspense>
      )}
    </>
  )
}
