import React, { Component, ErrorInfo, ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '../ui/button'
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react'

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
      errorInfo: null
    }
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo
    })

    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo)
    }

    // Call custom error handler
    this.props.onError?.(error, errorInfo)

    // Log error to external service in production
    if (process.env.NODE_ENV === 'production') {
      this.logErrorToService(error, errorInfo)
    }
  }

  componentDidUpdate(prevProps: Props) {
    const { resetKeys, resetOnPropsChange } = this.props
    const { hasError } = this.state

    if (hasError && resetOnPropsChange) {
      if (resetKeys && prevProps.resetKeys) {
        const hasResetKeyChanged = resetKeys.some((key, index) => 
          key !== prevProps.resetKeys?.[index]
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
      errorInfo: null
    })
  }

  logErrorToService = (error: Error, errorInfo: ErrorInfo) => {
    // In a real app, you would send this to an error reporting service
    // like Sentry, LogRocket, or Bugsnag
    console.error('Error logged to service:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return <ErrorFallback 
        error={this.state.error} 
        errorInfo={this.state.errorInfo}
        resetError={this.resetErrorBoundary}
      />
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
    // In a real app, you would open a bug report form or send to error service
    const errorReport = {
      message: error?.message,
      stack: error?.stack,
      componentStack: errorInfo?.componentStack,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent
    }
    
    console.log('Error report:', errorReport)
    alert('Error report generated. Check console for details.')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 text-center">
        <div className="flex justify-center mb-4">
          <AlertTriangle className="h-16 w-16 text-red-500" />
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          {t('errorBoundary.title')}
        </h1>
        
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          {t('errorBoundary.description')}
        </p>

        <div className="space-y-3">
          <Button onClick={resetError} className="w-full">
            <RefreshCw className="h-4 w-4 mr-2" />
            {t('errorBoundary.refreshPage')}
          </Button>
          
          <Button onClick={handleGoHome} variant="outline" className="w-full">
            <Home className="h-4 w-4 mr-2" />
            {t('errorBoundary.goHome')}
          </Button>
          
          <Button 
            onClick={handleReportError} 
            variant="ghost" 
            className="w-full"
          >
            <Bug className="h-4 w-4 mr-2" />
            {t('errorBoundary.reportError')}
          </Button>
        </div>

        {process.env.NODE_ENV === 'development' && (
          <div className="mt-6">
            <Button
              onClick={() => setShowDetails(!showDetails)}
              variant="outline"
              size="sm"
            >
              {showDetails ? 'Hide' : 'Show'} {t('errorBoundary.errorDetails')}
            </Button>
            
            {showDetails && (
              <div className="mt-4 p-4 bg-gray-100 dark:bg-gray-700 rounded text-left text-xs overflow-auto max-h-64">
                <div className="font-mono">
                  <div className="font-bold text-red-600 mb-2">Error:</div>
                  <div className="mb-4 text-red-500">{error?.message}</div>
                  
                  <div className="font-bold text-red-600 mb-2">Stack Trace:</div>
                  <pre className="whitespace-pre-wrap text-red-500 mb-4">
                    {error?.stack}
                  </pre>
                  
                  <div className="font-bold text-red-600 mb-2">Component Stack:</div>
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
  errorBoundaryProps?: Omit<Props, 'children'>
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

