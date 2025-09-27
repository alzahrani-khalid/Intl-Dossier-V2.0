import { RouterProvider } from '@tanstack/react-router'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { queryClient } from './lib/queryClient'
import { router } from './router'
import { ErrorBoundary } from './components/error-boundary'
import { OfflineIndicator } from './components/OfflineIndicator'
import { RealtimeStatus } from './components/RealtimeStatus'
import { AuthProvider, useAuth } from './contexts/auth.context'
import { RTLWrapper } from './components/RTLWrapper'
import { ThemeProvider } from './components/theme-provider/theme-provider'
import { LanguageProvider } from './components/language-provider/language-provider'
import { ThemeErrorBoundary } from './components/theme-error-boundary'
import './i18n'

function AppRouter() {
  const auth = useAuth()
  return <RouterProvider router={router} context={{ auth }} />
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <ThemeErrorBoundary fallbackTheme="gastat" fallbackColorMode="light" fallbackLanguage="en">
            <ThemeProvider defaultTheme="gastat" defaultColorMode="system">
              <LanguageProvider defaultLanguage="en">
                <RTLWrapper>
                  <AppRouter />
                  <ReactQueryDevtools initialIsOpen={false} />
                  <OfflineIndicator />
                  <RealtimeStatus />
                </RTLWrapper>
              </LanguageProvider>
            </ThemeProvider>
          </ThemeErrorBoundary>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  )
}

export default App
