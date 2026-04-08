/**
 * DossierShell
 * Layout container for dossier detail pages.
 *
 * Renders: sticky header with breadcrumbs + actions + presence indicators,
 * DossierTabNav (URL-driven tabs), RelationshipSidebar slot (desktop),
 * mobile "Relationships" trigger, and child content via children prop.
 *
 * Mirrors WorkspaceShell pattern. Mobile-first, RTL-compatible, logical properties only.
 */

import type { ReactElement, ReactNode } from 'react'
import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from '@tanstack/react-router'
import { useDirection } from '@/hooks/useDirection'
import { useDossier } from '@/domains/dossiers/hooks/useDossier'
import type { DossierType } from '@/services/dossier-api'
import { useDossierPresence } from '@/hooks/useDossierPresence'
import { useAddToDossierActions } from '@/hooks/useAddToDossierActions'
import { useAuth } from '@/contexts/auth.context'
import { DossierTabNav, type DossierTabConfig } from '@/components/dossier/DossierTabNav'
import { RelationshipSidebar } from '@/components/dossier/RelationshipSidebar'
import {
  AddToDossierMenu,
  type AddToDossierActionType,
  type DossierContext,
} from '@/components/dossier/AddToDossierMenu'
import { AddToDossierDialogs } from '@/components/dossier/AddToDossierDialogs'
import { ExportDossierDialog } from '@/components/dossier/ExportDossierDialog'
import { ActiveViewers, ActiveViewersCompact } from '@/components/collaboration'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import {
  ChevronRight,
  FileDown,
  Home,
  Link2,
  Wifi,
  WifiOff,
} from 'lucide-react'

// ============================================================================
// Constants
// ============================================================================

const SIDEBAR_STORAGE_KEY = 'dossier-sidebar-open'

function getSidebarDefault(): boolean {
  try {
    const stored = localStorage.getItem(SIDEBAR_STORAGE_KEY)
    if (stored !== null) {
      return stored === 'true'
    }
  } catch {
    // localStorage unavailable
  }
  return true
}

// ============================================================================
// Props
// ============================================================================

interface DossierShellProps {
  dossierId: string
  dossierType: string
  tabConfig?: DossierTabConfig[]
  children: ReactNode
}

// ============================================================================
// Component
// ============================================================================

export function DossierShell({
  dossierId,
  dossierType,
  tabConfig,
  children,
}: DossierShellProps): ReactElement {
  const { t } = useTranslation('dossier-shell')
  const { direction, isRTL } = useDirection()
  const { user } = useAuth()

  // Dossier data — useDossier returns DossierWithExtension directly
  const { data: dossier, isLoading } = useDossier(dossierId)

  // Presence tracking
  const { viewers, isConnected, viewerCount } = useDossierPresence(dossierId, {
    idleTimeout: 30000,
  })

  // Sidebar state with localStorage persistence
  const [isSidebarOpen, setIsSidebarOpen] = useState(getSidebarDefault)
  const toggleSidebar = useCallback((): void => {
    setIsSidebarOpen((prev) => {
      const next = !prev
      try {
        localStorage.setItem(SIDEBAR_STORAGE_KEY, String(next))
      } catch {
        // localStorage unavailable
      }
      return next
    })
  }, [])

  // Export dialog state
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false)

  // Mobile relationship sheet state
  const [isMobileSheetOpen, setIsMobileSheetOpen] = useState(false)

  // Add to Dossier actions
  const { dialogStates, closeDialog, handleAction, getDossierContext } = useAddToDossierActions({
    dossier: dossier as Parameters<typeof useAddToDossierActions>[0]['dossier'],
  })

  const onMenuAction = useCallback(
    (actionType: AddToDossierActionType, context: DossierContext): void => {
      handleAction(actionType, context)
    },
    [handleAction],
  )

  // Display values
  const displayName = isRTL
    ? (dossier?.name_ar ?? dossier?.name_en ?? '')
    : (dossier?.name_en ?? '')

  return (
    <div dir={direction} className="flex min-h-screen flex-col bg-background">
      {/* Header bar -- sticky */}
      <header
        className={cn(
          'sticky top-0 z-20 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60',
          'px-4 sm:px-6 lg:px-8 py-3',
        )}
      >
        {/* Breadcrumbs */}
        <nav
          className="flex items-center gap-2 text-sm mb-2"
          aria-label="Breadcrumb"
        >
          <Link
            to="/dashboard"
            className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors min-h-11"
          >
            <Home className="h-4 w-4" />
          </Link>
          <ChevronRight className={cn('h-4 w-4 text-muted-foreground', isRTL && 'rotate-180')} />
          <Link
            to="/dossiers"
            className="text-muted-foreground hover:text-foreground transition-colors min-h-11 flex items-center"
          >
            {t('tabs.overview', { ns: 'dossiers', defaultValue: 'Dossier Hub' })}
          </Link>
          <ChevronRight className={cn('h-4 w-4 text-muted-foreground', isRTL && 'rotate-180')} />
          <span className="text-foreground font-medium truncate">
            {isLoading ? <Skeleton className="h-4 w-24 inline-block" /> : displayName}
          </span>
        </nav>

        {/* Title + Actions row */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          {/* Dossier title */}
          <div className="min-w-0 flex-1">
            {isLoading ? (
              <Skeleton className="h-8 w-64" />
            ) : (
              <h1 className="truncate text-xl sm:text-2xl font-semibold">{displayName}</h1>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Active Viewers */}
            {viewerCount > 0 && (
              <>
                <div className="hidden sm:block">
                  <ActiveViewers
                    viewers={viewers}
                    currentUserId={user?.id}
                    maxVisible={4}
                    size="sm"
                    showStatus
                  />
                </div>
                <div className="sm:hidden">
                  <ActiveViewersCompact viewers={viewers} currentUserId={user?.id} />
                </div>
              </>
            )}

            {/* Connection indicator */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div
                    className={cn(
                      'flex items-center justify-center h-6 w-6 rounded-full',
                      isConnected
                        ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
                    )}
                  >
                    {isConnected ? (
                      <Wifi className="h-3.5 w-3.5" />
                    ) : (
                      <WifiOff className="h-3.5 w-3.5" />
                    )}
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  {isConnected ? 'Real-time connected' : 'Real-time disconnected'}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* Export button */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="min-h-11 min-w-11"
                    onClick={() => setIsExportDialogOpen(true)}
                  >
                    <FileDown className="h-4 w-4 sm:me-2" />
                    <span className="hidden sm:inline">
                      {t('tabs.overview', { ns: 'dossier', defaultValue: 'Export' })}
                    </span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Export briefing pack</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* Add to Dossier menu */}
            {dossier != null && (
              <AddToDossierMenu
                dossier={dossier as Parameters<typeof AddToDossierMenu>[0]['dossier']}
                onAction={onMenuAction}
                variant="button"
                showDescriptions
              />
            )}

            {/* Mobile relationships trigger */}
            <Button
              variant="outline"
              size="sm"
              className="lg:hidden min-h-11 min-w-11"
              onClick={() => setIsMobileSheetOpen(true)}
            >
              <Link2 className="h-4 w-4 sm:me-2" />
              <span className="hidden sm:inline">{t('header.relationships')}</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Tab navigation */}
      <DossierTabNav
        dossierId={dossierId}
        dossierType={dossierType}
        extraTabs={tabConfig}
      />

      {/* Content area with sidebar */}
      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 min-w-0 px-4 sm:px-6 lg:px-8 py-4 sm:py-6 overflow-y-auto">
          {children}
        </main>

        {/* RelationshipSidebar -- desktop only */}
        <RelationshipSidebar
          dossierId={dossierId}
          open={isSidebarOpen}
          onToggle={toggleSidebar}
          className="hidden lg:flex"
          mobileOpen={isMobileSheetOpen}
          onMobileClose={() => setIsMobileSheetOpen(false)}
        />
      </div>

      {/* Action Dialogs */}
      {dossier != null && (
        <>
          <AddToDossierDialogs
            dossier={dossier as Parameters<typeof AddToDossierDialogs>[0]['dossier']}
            dialogStates={dialogStates}
            onClose={closeDialog}
            dossierContext={getDossierContext()}
          />
          <ExportDossierDialog
            dossierId={dossier.id}
            dossierName={displayName}
            dossierType={dossierType as DossierType}
            open={isExportDialogOpen}
            onClose={() => setIsExportDialogOpen(false)}
          />
        </>
      )}
    </div>
  )
}
