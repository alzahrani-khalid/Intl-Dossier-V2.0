import { createRootRoute, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import ErrorBoundary from '@/components/ErrorBoundary'
import { WorkCreationProvider } from '@/components/work-creation'

export const Route = createRootRoute({
  component: () => (
    <ErrorBoundary>
      <WorkCreationProvider>
        <Outlet />
      </WorkCreationProvider>
      <TanStackRouterDevtools position="bottom-right" />
    </ErrorBoundary>
  ),
})