import { createRootRoute, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import ErrorBoundary from '@/components/ErrorBoundary'
import { WorkCreationProvider } from '@/components/work-creation'
import { KeyboardShortcutProvider, CommandPalette } from '@/components/KeyboardShortcuts'
import { TourProvider, TourOverlay } from '@/components/guided-tours'

export const Route = createRootRoute({
  component: () => (
    <ErrorBoundary>
      <KeyboardShortcutProvider>
        <TourProvider>
          <WorkCreationProvider>
            <Outlet />
          </WorkCreationProvider>
          <CommandPalette />
          <TourOverlay />
        </TourProvider>
      </KeyboardShortcutProvider>
      <TanStackRouterDevtools position="bottom-right" />
    </ErrorBoundary>
  ),
})
