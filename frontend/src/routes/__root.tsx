import { createRootRoute, Outlet, Link, useRouter } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { Home, ArrowLeft, Search } from 'lucide-react'
import ErrorBoundary from '@/components/app-error-boundary/ErrorBoundary'
import { WorkCreationProvider } from '@/components/work-creation'
import { KeyboardShortcutProvider, CommandPalette } from '@/components/keyboard-shortcuts'
import { TourProvider, TourOverlay } from '@/components/guided-tours'
import { DossierContextProvider } from '@/contexts/dossier-context'
import { Button } from '@/components/ui/button'

function NotFoundPage() {
  const { t } = useTranslation()
  const router = useRouter()

  return (
    <div className="flex min-h-screen items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="text-center space-y-6 max-w-md">
        <div className="text-6xl sm:text-8xl font-bold text-muted-foreground/30">404</div>
        <h1 className="text-xl sm:text-2xl font-semibold text-foreground">
          {t('errors.pageNotFound', 'Page not found')}
        </h1>
        <p className="text-muted-foreground text-sm sm:text-base">
          {t(
            'errors.pageNotFoundDescription',
            'The page you are looking for does not exist or has been moved.',
          )}
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button variant="outline" size="default" onClick={() => router.history.back()}>
            <ArrowLeft className="h-4 w-4 me-2" />
            {t('common.goBack', 'Go back')}
          </Button>
          <Button asChild>
            <Link to="/dashboard">
              <Home className="h-4 w-4 me-2" />
              {t('common.dashboard', 'Dashboard')}
            </Link>
          </Button>
          <Button variant="ghost" asChild>
            <Link to="/search">
              <Search className="h-4 w-4 me-2" />
              {t('common.search', 'Search')}
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}

export const Route = createRootRoute({
  component: () => (
    <ErrorBoundary>
      <KeyboardShortcutProvider>
        <TourProvider>
          <DossierContextProvider>
            <WorkCreationProvider>
              <Outlet />
            </WorkCreationProvider>
          </DossierContextProvider>
          <CommandPalette />
          <TourOverlay />
        </TourProvider>
      </KeyboardShortcutProvider>
    </ErrorBoundary>
  ),
  notFoundComponent: NotFoundPage,
})
