import { type ReactNode } from 'react'
import { Toaster } from 'react-hot-toast'

import { cn } from '@/lib/utils'
import { useResponsive } from '@/hooks/useResponsive'
import { useDirection } from '@/hooks/useDirection'
import { useContextAwareFAB } from '@/hooks/useContextAwareFAB'
import { useEntityHistoryStore } from '@/store/entityHistoryStore'
import { useDossierContextSafe } from '@/contexts/dossier-context'

import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { ContextAwareFAB } from '@/components/ui/context-aware-fab'
import { EntityBreadcrumbTrail } from './EntityBreadcrumbTrail'
import { DossierContextIndicator } from '@/components/dossier/DossierContextIndicator'
import { AppSidebar } from './AppSidebar'
import { SiteHeader } from './SiteHeader'
import { MobileBottomTabBar } from './MobileBottomTabBar'

interface MainLayoutProps {
  children: ReactNode
  showFAB?: boolean
  showBreadcrumbTrail?: boolean
  showDossierContext?: boolean
}

function getStoredSidebarOpen(): boolean {
  try {
    const stored = localStorage.getItem('sidebar_state')
    if (stored === 'false') return false
    return true
  } catch {
    return true
  }
}

export function MainLayout({
  children,
  showFAB,
  showBreadcrumbTrail = true,
  showDossierContext = true,
}: MainLayoutProps): React.ReactElement {
  const { isMobile } = useResponsive()
  const { direction } = useDirection()

  const { contextActions, speedDialActions, defaultAction, shouldShowFAB } = useContextAwareFAB()
  const displayFAB = (showFAB ?? isMobile) && shouldShowFAB

  const { history } = useEntityHistoryStore()
  const displayBreadcrumbTrail = showBreadcrumbTrail && history.length > 0

  const dossierContext = useDossierContextSafe()
  const hasDossierContext = Boolean(
    dossierContext?.activeDossier ||
    (dossierContext?.state?.selectedDossiers && dossierContext.state.selectedDossiers.length > 0),
  )
  const displayDossierContext = showDossierContext && hasDossierContext

  return (
    <>
      <SidebarProvider
        dir={direction}
        defaultOpen={getStoredSidebarOpen()}
        style={
          {
            '--sidebar-width': '16rem',
            '--header-height': '3.5rem',
            '--content-margin': '0.375rem',
          } as React.CSSProperties
        }
      >
        <AppSidebar />
        <SidebarInset>
          <SiteHeader />
          <div
            className={cn('bg-muted/40 flex flex-1 flex-col overflow-y-auto', isMobile && 'pb-16')}
          >
            {displayBreadcrumbTrail && (
              <EntityBreadcrumbTrail
                maxDisplay={isMobile ? 3 : 5}
                compact={isMobile}
                className="sticky top-[var(--header-height)] z-30"
              />
            )}

            {displayDossierContext && (
              <DossierContextIndicator
                size={isMobile ? 'sm' : 'default'}
                className="mx-4 mt-2 sm:mx-6 sm:mt-3"
              />
            )}

            <div className="@container/main flex-1 p-4 sm:p-6 lg:p-8 xl:mx-auto xl:w-full xl:max-w-[1600px]">
              {children}
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>

      <MobileBottomTabBar />

      {displayFAB && (
        <ContextAwareFAB
          contextActions={contextActions}
          speedDialActions={speedDialActions}
          defaultAction={defaultAction}
          hideOnScroll
          className={
            isMobile
              ? 'bottom-[calc(3.5rem+max(0.75rem,env(safe-area-inset-bottom))+4rem)]'
              : undefined
          }
        />
      )}

      <Toaster
        position="top-center"
        toastOptions={{
          duration: 4000,
          style: {
            background: 'var(--toast-bg)',
            color: 'var(--toast-color)',
          },
        }}
      />
    </>
  )
}
