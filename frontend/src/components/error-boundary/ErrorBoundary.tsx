import React, { Component, ErrorInfo, ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '../ui/button'
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react'
import { captureException, addBreadcrumb, setContext, captureMessage } from '@/lib/sentry'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  resetOnPropsChange?: boolean
  resetKeys?: Array<string | number>
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    }
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    })

    // Log error to console in development
    if (import.meta.env.DEV) {
      console.error('ErrorBoundary caught an error:', error, errorInfo)
    }

    // Call custom error handler
    this.props.onError?.(error, errorInfo)

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

  componentDidUpdate(prevProps: Props) {
    const { resetKeys, resetOnPropsChange } = this.props
    const { hasError } = this.state

    if (hasError && resetOnPropsChange) {
      if (resetKeys && prevProps.resetKeys) {
        const hasResetKeyChanged = resetKeys.some(
          (key, index) => key !== prevProps.resetKeys?.[index],
        )
        if (hasResetKeyChanged) {
          this.resetErrorBoundary()
        }
      }
    }
  }

  resetErrorBoundary = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    })
  }

  logErrorToService = (error: Error, errorInfo: ErrorInfo) => {
    // This is now handled by Sentry in componentDidCatch
    // Keeping this method for backwards compatibility
    if (import.meta.env.DEV) {
      console.error('Error logged to service:', {
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
      })
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <ErrorFallback
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          resetError={this.resetErrorBoundary}
        />
      )
    }

    return this.props.children
  }
}

interface ErrorFallbackProps {
  error: Error | null
  errorInfo: ErrorInfo | null
  resetError: () => void
}

function ErrorFallback({ error, errorInfo, resetError }: ErrorFallbackProps) {
  const { t } = useTranslation()
  const [showDetails, setShowDetails] = React.useState(false)

  const handleGoHome = () => {
    window.location.href = '/'
  }

  const handleReportError = () => {
    // Send feedback event to Sentry
    const eventId = captureMessage('User reported error via UI', 'warning', {
      errorMessage: error?.message,
      errorStack: error?.stack,
      componentStack: errorInfo?.componentStack,
      url: window.location.href,
      userAgent: navigator.userAgent,
    })

    alert(t('errorBoundary.reportSubmitted') || `Error report submitted. Report ID: ${eventId}`)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4 dark:bg-gray-900">
      <div className="w-full max-w-md rounded-lg bg-white p-6 text-center shadow-lg dark:bg-gray-800">
        <div className="mb-4 flex justify-center">
          <AlertTriangle className="size-16 text-red-500" />
        </div>

        <h1 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">
          {t('errorBoundary.title')}
        </h1>

        <p className="mb-6 text-gray-600 dark:text-gray-400">{t('errorBoundary.description')}</p>

        <div className="space-y-3">
          <Button onClick={resetError} className="w-full">
            <RefreshCw className="me-2 size-4" />
            {t('errorBoundary.refreshPage')}
          </Button>

          <Button onClick={handleGoHome} variant="outline" className="w-full">
            <Home className="me-2 size-4" />
            {t('errorBoundary.goHome')}
          </Button>

          <Button onClick={handleReportError} variant="ghost" className="w-full">
            <Bug className="me-2 size-4" />
            {t('errorBoundary.reportError')}
          </Button>
        </div>

        {process.env.NODE_ENV === 'development' && (
          <div className="mt-6">
            <Button onClick={() => setShowDetails(!showDetails)} variant="outline" size="sm">
              {showDetails ? 'Hide' : 'Show'} {t('errorBoundary.errorDetails')}
            </Button>

            {showDetails && (
              <div className="mt-4 max-h-64 overflow-auto rounded bg-gray-100 p-4 text-start text-xs dark:bg-gray-700">
                <div className="font-mono">
                  <div className="mb-2 font-bold text-red-600">Error:</div>
                  <div className="mb-4 text-red-500">{error?.message}</div>

                  <div className="mb-2 font-bold text-red-600">Stack Trace:</div>
                  <pre className="mb-4 whitespace-pre-wrap text-red-500">{error?.stack}</pre>

                  <div className="mb-2 font-bold text-red-600">Component Stack:</div>
                  <pre className="whitespace-pre-wrap text-red-500">
                    {errorInfo?.componentStack}
                  </pre>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// Hook for functional components to trigger error boundary
export function useErrorHandler() {
  return (error: Error, errorInfo?: ErrorInfo) => {
    // This will be caught by the nearest ErrorBoundary
    throw error
  }
}

// Higher-order component for easier error boundary wrapping
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>,
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  )

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`

  return WrappedComponent
}

export default ErrorBoundary
