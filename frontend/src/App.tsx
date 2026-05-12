import { useMemo } from 'react'
import { RouterProvider } from '@tanstack/react-router'
import { LazyMotion, domAnimation } from 'framer-motion'
import { QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import { Toaster as SonnerToaster } from 'sonner'
import { queryClient } from './lib/query-client'
import { router } from './router'
import { ErrorBoundary } from './components/error-boundary'
import { OfflineIndicator } from './components/offline-indicator/OfflineIndicator'
import { RealtimeStatus } from './components/realtime-status/RealtimeStatus'
import { AuthProvider, useAuth } from './contexts/auth.context'
import { AuthListenerManager } from './components/auth/AuthListenerManager'
import { RTLWrapper } from './components/rtl-wrapper/RTLWrapper'
import { LanguageProvider } from './components/language-provider/language-provider'
import { ThemeErrorBoundary } from './components/theme-error-boundary/ThemeErrorBoundary'
import { DesignProvider } from './design-system/DesignProvider'
import { TweaksDisclosureProvider, TweaksDrawer } from '@/components/tweaks'
// SMOKE TEST (DO NOT MERGE): force a world-atlas dataset onto the
// signature-visuals/d3-geospatial sub-chunk, pushing it past its 55 KB gz
// ceiling. Phase 49 Plan 03 D-12 sub-vendor proof.
import { __smoke_subvendor_marker__ } from './components/kanban/_smoke-dnd-bloat'
console.warn('smoke', __smoke_subvendor_marker__)
import './i18n'

function AppRouter() {
  const auth = useAuth()
  const routerContext = useMemo(() => ({ auth }), [auth])
  return <RouterProvider router={router} context={routerContext} />
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <AuthListenerManager />
          <ThemeErrorBoundary
            fallbackDirection="bureau"
            fallbackColorMode="light"
            fallbackLanguage="en"
          >
            <DesignProvider
              initialDirection="bureau"
              initialMode="light"
              initialHue={32}
              initialDensity="comfortable"
            >
              <TweaksDisclosureProvider>
                <LanguageProvider initialLanguage="en">
                  <LazyMotion features={domAnimation}>
                    <RTLWrapper>
                      <AppRouter />
                      <OfflineIndicator />
                      <RealtimeStatus />
                      <Toaster position="top-right" />
                      <SonnerToaster position="top-right" richColors closeButton />
                      <TweaksDrawer />
                    </RTLWrapper>
                  </LazyMotion>
                </LanguageProvider>
              </TweaksDisclosureProvider>
            </DesignProvider>
          </ThemeErrorBoundary>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  )
}

export default App
