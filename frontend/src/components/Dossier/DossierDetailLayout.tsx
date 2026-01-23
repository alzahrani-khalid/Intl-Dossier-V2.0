/**
 * DossierDetailLayout - Shared layout wrapper for all type-specific dossier detail pages
 * Provides consistent header, breadcrumbs, and sidebar while allowing type-specific main content
 * Feature: 028-type-specific-dossier-pages
 *
 * Updated for Feature 035: Includes AddToDossierMenu as the standard "Add to Dossier" action
 * with context inheritance support.
 *
 * Updated: Added MiniRelationshipGraph sidebar widget showing immediate connections.
 *
 * Updated: Added real-time collaboration indicators (active viewers, editing locks)
 * Feature: realtime-collaboration-indicators
 */

import { ReactNode, useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from '@tanstack/react-router'
import type { Dossier } from '@/lib/dossier-type-guards'
import {
  ChevronRight,
  FileDown,
  Home,
  LayoutGrid,
  PanelRightClose,
  PanelRightOpen,
  Wifi,
  WifiOff,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import {
  AddToDossierMenu,
  type AddToDossierActionType,
  type DossierContext,
} from './AddToDossierMenu'
import { AddToDossierDialogs } from './AddToDossierDialogs'
import { ExportDossierDialog } from './ExportDossierDialog'
import { MiniRelationshipGraph } from './MiniRelationshipGraph'
import { DossierRecommendationsPanel } from '@/components/dossier-recommendations'
import { useAddToDossierActions } from '@/hooks/useAddToDossierActions'
import { useDossierPresence } from '@/hooks/useDossierPresence'
import { useAuth } from '@/contexts/auth.context'
import { ActiveViewers, ActiveViewersCompact } from '@/components/collaboration'

interface DossierDetailLayoutProps {
  /**
   * The dossier entity being displayed
   */
  dossier: Dossier

  /**
   * Type-specific content (sections, visualizations, etc.)
   */
  children: ReactNode

  /**
   * Custom grid layout classes for type-specific layouts
   * Example: "grid-cols-1 lg:grid-cols-[2fr_1fr]" for Country
   */
  gridClassName?: string

  /**
   * Optional custom header actions (edit, delete, etc.)
   * The AddToDossierMenu is automatically included; use this for additional actions
   */
  headerActions?: ReactNode

  /**
   * Hide the "Add to Dossier" menu
   * @default false
   */
  hideAddMenu?: boolean

  /**
   * Hide the mini relationship graph sidebar widget
   * @default false
   */
  hideRelationshipWidget?: boolean

  /**
   * Hide the AI recommendations panel
   * @default false
   */
  hideRecommendationsPanel?: boolean

  /**
   * Hide the active viewers indicator
   * @default false
   */
  hideActiveViewers?: boolean

  /**
   * Callback when an action is triggered from the AddToDossierMenu
   */
  onAddAction?: (actionType: AddToDossierActionType, context: DossierContext) => void

  /**
   * Current section being edited (for presence tracking)
   */
  editingSection?: string
}

/**
 * DossierDetailLayout component
 * Provides shared chrome (header, breadcrumbs, sidebar) for all dossier types
 * Includes "Add to Dossier" menu for standardized context-aware actions
 */
export function DossierDetailLayout({
  dossier,
  children,
  gridClassName = 'grid-cols-1',
  headerActions,
  hideAddMenu = false,
  hideRelationshipWidget = false,
  hideRecommendationsPanel = false,
  hideActiveViewers = false,
  onAddAction,
  editingSection,
}: DossierDetailLayoutProps) {
  const { t, i18n } = useTranslation('dossier')
  const isRTL = i18n.language === 'ar'

  // Get current user
  const { user } = useAuth()

  // Sidebar toggle state (for relationship widget visibility on smaller screens)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)

  // Export dialog state
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false)

  // Real-time presence tracking
  const { viewers, isConnected, viewerCount } = useDossierPresence(dossier.id, {
    editingSection,
    idleTimeout: 30000, // 30 seconds idle timeout
  })

  // Add to Dossier actions hook
  const { dialogStates, closeDialog, handleAction, getDossierContext } = useAddToDossierActions({
    dossier,
  })

  // Handle action from menu
  const onMenuAction = useCallback(
    (actionType: AddToDossierActionType, context: DossierContext) => {
      handleAction(actionType, context)
      onAddAction?.(actionType, context)
    },
    [handleAction, onAddAction],
  )

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
      {/* Breadcrumbs */}
      <nav
        className="flex items-center gap-2 text-sm sm:text-base mb-4 sm:mb-6"
        aria-label="Breadcrumb"
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <Link
          to="/dossiers"
          className="flex items-center gap-1 sm:gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <Home className="h-4 w-4" />
          <span>{t('hub.title')}</span>
        </Link>
        <ChevronRight className={`h-4 w-4 text-muted-foreground ${isRTL ? 'rotate-180' : ''}`} />
        <span className="text-foreground font-medium">
          {isRTL ? dossier.name_ar : dossier.name_en}
        </span>
      </nav>

      {/* Header */}
      <header
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6 mb-6 sm:mb-8 pb-4 sm:pb-6 border-b"
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 truncate">
            {isRTL ? dossier.name_ar : dossier.name_en}
          </h1>
          {(dossier.description_en || dossier.description_ar) && (
            <p className="text-muted-foreground text-sm sm:text-base line-clamp-2">
              {isRTL ? dossier.description_ar : dossier.description_en}
            </p>
          )}
        </div>

        {/* Header Actions - Active Viewers + Overview + AddToDossierMenu */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Active Viewers Indicator */}
          {!hideActiveViewers && viewerCount > 0 && (
            <>
              {/* Full avatar stack on larger screens */}
              <div className="hidden sm:block">
                <ActiveViewers
                  viewers={viewers}
                  currentUserId={user?.id}
                  maxVisible={4}
                  size="sm"
                  showStatus
                />
              </div>
              {/* Compact indicator on mobile */}
              <div className="sm:hidden">
                <ActiveViewersCompact viewers={viewers} currentUserId={user?.id} />
              </div>
            </>
          )}

          {/* Connection Status Indicator */}
          {!hideActiveViewers && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div
                    className={`flex items-center justify-center h-6 w-6 rounded-full ${
                      isConnected
                        ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                    }`}
                  >
                    {isConnected ? (
                      <Wifi className="h-3.5 w-3.5" />
                    ) : (
                      <WifiOff className="h-3.5 w-3.5" />
                    )}
                  </div>
                </TooltipTrigger>
                <TooltipContent side={isRTL ? 'right' : 'left'}>
                  {isConnected
                    ? t('collaboration.connected', { defaultValue: 'Real-time connected' })
                    : t('collaboration.disconnected', { defaultValue: 'Real-time disconnected' })}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          {/* Everything About button - opens comprehensive overview */}
          <Button variant="outline" size="sm" asChild className="min-h-10">
            <Link to={`/dossiers/${dossier.id}/overview` as any}>
              <LayoutGrid className="h-4 w-4 me-2" />
              <span className="hidden sm:inline">
                {t('action.everythingAbout', { defaultValue: 'Everything About' })}
              </span>
              <span className="sm:hidden">
                {t('action.overview', { defaultValue: 'Overview' })}
              </span>
            </Link>
          </Button>

          {/* Export Briefing Pack button */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="min-h-10"
                  onClick={() => setIsExportDialogOpen(true)}
                >
                  <FileDown className="h-4 w-4 sm:me-2" />
                  <span className="hidden sm:inline">
                    {t('action.export', { defaultValue: 'Export' })}
                  </span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side={isRTL ? 'right' : 'left'}>
                {t('action.exportTooltip', { defaultValue: 'Export briefing pack' })}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {!hideAddMenu && (
            <AddToDossierMenu
              dossier={dossier}
              onAction={onMenuAction}
              variant="button"
              showDescriptions
            />
          )}
          {headerActions}
        </div>
      </header>

      {/* Main Content with Optional Sidebar */}
      <div
        className="flex flex-col lg:flex-row gap-4 sm:gap-6 lg:gap-8"
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        {/* Main Content - Type-Specific Grid Layout */}
        <main className={`flex-1 min-w-0 grid ${gridClassName} gap-4 sm:gap-6 lg:gap-8`}>
          {children}
        </main>

        {/* Sidebar with Mini Relationship Graph (hidden on mobile, shown on lg+) */}
        {!hideRelationshipWidget && (
          <aside
            className={`
              hidden lg:block
              ${isSidebarOpen ? 'w-80 xl:w-96' : 'w-10'}
              shrink-0 transition-all duration-300 ease-in-out
            `}
          >
            {/* Sidebar Toggle Button */}
            <div className="flex justify-end mb-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                      aria-label={
                        isSidebarOpen
                          ? t('sidebar.collapse', 'Collapse sidebar')
                          : t('sidebar.expand', 'Expand sidebar')
                      }
                    >
                      {isSidebarOpen ? (
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
                  </TooltipTrigger>
                  <TooltipContent side={isRTL ? 'right' : 'left'}>
                    {isSidebarOpen
                      ? t('sidebar.collapse', 'Collapse sidebar')
                      : t('sidebar.expand', 'Expand sidebar')}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            {/* Sidebar Widgets */}
            {isSidebarOpen && (
              <div className="sticky top-4 space-y-4">
                {/* Mini Relationship Graph Widget */}
                <MiniRelationshipGraph
                  dossier={dossier}
                  defaultCollapsed={false}
                  maxHeight="220px"
                />

                {/* AI Recommendations Panel */}
                {!hideRecommendationsPanel && (
                  <DossierRecommendationsPanel
                    dossierId={dossier.id}
                    variant="sidebar"
                    maxRecommendations={5}
                    showRefresh
                    collapsible
                    defaultExpanded
                  />
                )}
              </div>
            )}
          </aside>
        )}
      </div>

      {/* Action Dialogs */}
      <AddToDossierDialogs
        dossier={dossier}
        dialogStates={dialogStates}
        onClose={closeDialog}
        dossierContext={getDossierContext()}
      />

      {/* Export Briefing Pack Dialog */}
      <ExportDossierDialog
        dossierId={dossier.id}
        dossierName={isRTL ? dossier.name_ar : dossier.name_en}
        dossierType={dossier.type}
        open={isExportDialogOpen}
        onClose={() => setIsExportDialogOpen(false)}
      />

      {/* Mobile FAB - shown on smaller screens */}
      <div className="sm:hidden">
        {!hideAddMenu && (
          <AddToDossierMenu dossier={dossier} onAction={onMenuAction} variant="fab" />
        )}
      </div>
    </div>
  )
}
