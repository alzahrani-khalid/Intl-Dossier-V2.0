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
import { ThemeProvider } from './components/theme-provider/theme-provider'
import { LanguageProvider } from './components/language-provider/language-provider'
import { ThemeErrorBoundary } from './components/theme-error-boundary/ThemeErrorBoundary'
import { DesignProvider } from './design-system/DesignProvider'
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
            fallbackTheme="canvas"
            fallbackColorMode="light"
            fallbackLanguage="en"
          >
            <ThemeProvider initialTheme="canvas" initialColorMode="light">
              <DesignProvider
                initialDirection="chancery"
                initialMode="light"
                initialHue={22}
                initialDensity="comfortable"
              >
                <LanguageProvider initialLanguage="en">
                  <LazyMotion features={domAnimation}>
                    <RTLWrapper>
                      <AppRouter />
                      <OfflineIndicator />
                      <RealtimeStatus />
                      <Toaster position="top-right" />
                      <SonnerToaster position="top-right" richColors closeButton />
                    </RTLWrapper>
                  </LazyMotion>
                </LanguageProvider>
              </DesignProvider>
            </ThemeProvider>
          </ThemeErrorBoundary>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  )
}

export default App
