/**
 * ErrorBoundary Component
 *
 * Task: T095 [Polish]
 * Graceful error handling for React components with fallback UI
 * Mobile-first, RTL support, WCAG AA compliant
 * Integrated with Sentry for error tracking
 */

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { captureException, addBreadcrumb, setContext } from '@/lib/sentry'

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  showDetails?: boolean
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

/**
 * Class-based ErrorBoundary component
 * (React Error Boundaries must be class components)
 */
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to console in development
    if (import.meta.env.DEV) {
      console.error('[ErrorBoundary] Caught error:', error)
      console.error('[ErrorBoundary] Error info:', errorInfo)
    }

    // Call optional error handler
    this.props.onError?.(error, errorInfo)

    // Update state with error info
    this.setState({
      errorInfo,
    })

    // Send to Sentry error tracking
    addBreadcrumb('Error boundary triggered', 'error', 'error', {
      url: window.location.href,
    })

    setContext('errorBoundary', {
      componentStack: errorInfo.componentStack,
    })

    captureException(error, {
      tags: {
        errorBoundary: 'true',
      },
      extra: {
        componentStack: errorInfo.componentStack,
        url: window.location.href,
      },
    })
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    })
  }

  handleGoHome = () => {
    window.location.href = '/'
  }

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Default fallback UI
      return (
        <ErrorFallback
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          onReset={this.handleReset}
          onGoHome={this.handleGoHome}
          showDetails={this.props.showDetails ?? import.meta.env.DEV}
        />
      )
    }

    return this.props.children
  }
}

/**
 * ErrorFallback Component (functional component for i18n)
 */
interface ErrorFallbackProps {
  error: Error | null
  errorInfo: ErrorInfo | null
  onReset: () => void
  onGoHome: () => void
  showDetails?: boolean
}

function ErrorFallback({
  error,
  errorInfo,
  onReset,
  onGoHome,
  showDetails = false,
}: ErrorFallbackProps) {
  const { t, i18n } = useTranslation()
  const isRTL = i18n.language === 'ar'

  return (
    <div
      className="flex min-h-screen items-center justify-center bg-muted/30 p-4 sm:p-6 lg:p-8"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <div className="w-full max-w-2xl">
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="size-5" />
          <AlertTitle className="mb-2 text-start text-lg sm:text-xl">
            {t('error.boundary.title', 'Something went wrong')}
          </AlertTitle>
          <AlertDescription className="text-start">
            {t(
              'error.boundary.description',
              'An unexpected error occurred. Please try refreshing the page or return to the home page.',
            )}
          </AlertDescription>
        </Alert>

        {/* Error message */}
        {error && (
          <div className="mb-6 rounded-lg border bg-card p-4 sm:p-6">
            <p className="break-all text-start font-mono text-sm text-destructive sm:text-base">
              {error.message || t('error.boundary.unknownError', 'Unknown error')}
            </p>
          </div>
        )}

        {/* Error details (development only) */}
        {showDetails && errorInfo && (
          <details className="mb-6 rounded-lg border bg-card p-4 sm:p-6">
            <summary className="mb-2 cursor-pointer text-start text-sm font-medium sm:text-base">
              {t('error.boundary.technicalDetails', 'Technical Details')}
            </summary>
            <pre className="mt-2 overflow-auto rounded bg-muted p-4 text-start text-xs sm:text-sm">
              {errorInfo.componentStack}
            </pre>
          </details>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
          <Button onClick={onReset} className=" w-full sm: sm:w-auto" variant="default">
            <RefreshCw className={`size-4 ${isRTL ? 'ms-2' : 'me-2'}`} />
            {t('error.boundary.tryAgain', 'Try Again')}
          </Button>
          <Button onClick={onGoHome} className=" w-full sm: sm:w-auto" variant="outline">
            <Home className={`size-4 ${isRTL ? 'ms-2' : 'me-2'}`} />
            {t('error.boundary.goHome', 'Go to Home')}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default ErrorBoundary
