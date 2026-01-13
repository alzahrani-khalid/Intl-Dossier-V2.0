import { useRef, type ReactNode } from 'react'
import { Toaster } from 'react-hot-toast'
import { ProCollapsibleSidebarWrapper } from './ProCollapsibleSidebar'
import { CollapsingHeader, CollapsingHeaderSpacer } from './CollapsingHeader'
import { useIsMobile } from '@/hooks/use-mobile'
import { ContextAwareFAB } from '@/components/ui/context-aware-fab'
import { useContextAwareFAB } from '@/hooks/useContextAwareFAB'

interface MainLayoutProps {
  children: ReactNode
  /** Whether to use the collapsing header (default: true on mobile) */
  useCollapsingHeader?: boolean
  /** Whether to show the context-aware FAB (default: true on mobile) */
  showFAB?: boolean
}

export function MainLayout({ children, useCollapsingHeader, showFAB }: MainLayoutProps) {
  const isMobile = useIsMobile()
  const mainRef = useRef<HTMLElement>(null)

  // Enable collapsing header by default on mobile, or use explicit prop
  const showCollapsingHeader = useCollapsingHeader ?? isMobile

  // Context-aware FAB configuration
  const { contextActions, speedDialActions, defaultAction, shouldShowFAB } = useContextAwareFAB()

  // Show FAB on mobile by default, or use explicit prop
  const displayFAB = (showFAB ?? isMobile) && shouldShowFAB

  return (
    <>
      <div className="flex h-screen overflow-hidden bg-background">
        <ProCollapsibleSidebarWrapper>
          {/* Collapsing header for mobile - reclaims screen space on scroll */}
          {showCollapsingHeader && (
            <CollapsingHeader containerRef={mainRef} enabled={showCollapsingHeader} />
          )}

          {/* Main content area */}
          <main
            ref={mainRef}
            className="flex-1 overflow-y-auto px-4 pb-4 md:px-6 md:pb-6 lg:px-8 lg:pb-8"
            style={{
              // Dynamic padding top: accounts for collapsing header on mobile
              paddingTop: showCollapsingHeader ? 0 : undefined,
            }}
          >
            {/* Header spacer when collapsing header is active */}
            {showCollapsingHeader && <CollapsingHeaderSpacer />}

            {/* Content padding when no collapsing header (desktop) */}
            {!showCollapsingHeader && <div className="h-6 md:h-6 lg:h-8" />}

            {children}
          </main>
        </ProCollapsibleSidebarWrapper>

        {/* Context-aware floating action button for mobile */}
        {displayFAB && (
          <ContextAwareFAB
            contextActions={contextActions}
            speedDialActions={speedDialActions}
            defaultAction={defaultAction}
            hideOnScroll
          />
        )}
      </div>
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
