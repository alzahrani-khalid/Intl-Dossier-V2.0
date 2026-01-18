/**
 * DossierErrorBoundary Component
 * Feature: 035-dossier-context (Smart Dossier Context Inheritance)
 * Task: T044
 *
 * Specialized error boundary for dossier context components.
 * Provides contextual error messages and recovery options.
 * Mobile-first, RTL support.
 */

import { Component, ErrorInfo, ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

// ============================================================================
// Types
// ============================================================================

interface DossierErrorBoundaryProps {
  /**
   * Child components to render.
   */
  children: ReactNode
  /**
   * Custom fallback component (optional).
   */
  fallback?: ReactNode
  /**
   * Callback when error occurs.
   */
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  /**
   * Type of dossier component for contextual messages.
   */
  componentType?: 'timeline' | 'selector' | 'badge' | 'context' | 'general'
  /**
   * Additional CSS classes for the fallback.
   */
  className?: string
}

interface DossierErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

// ============================================================================
// Error Fallback Component
// ============================================================================

interface ErrorFallbackProps {
  error: Error | null
  errorInfo: ErrorInfo | null
  resetError: () => void
  componentType: DossierErrorBoundaryProps['componentType']
  className?: string
}

function ErrorFallback({
  error,
  resetError,
  componentType = 'general',
  className,
}: ErrorFallbackProps) {
  const { t, i18n } = useTranslation('dossier-context')
  const isRTL = i18n.language === 'ar'

  // Get component-specific error message
  const getErrorTitle = () => {
    switch (componentType) {
      case 'timeline':
        return t('error.timeline_title', 'Activity Timeline Error')
      case 'selector':
        return t('error.selector_title', 'Dossier Selector Error')
      case 'badge':
        return t('error.badge_title', 'Dossier Badge Error')
      case 'context':
        return t('error.context_title', 'Dossier Context Error')
      default:
        return t('error.general_title', 'Something went wrong')
    }
  }

  const getErrorDescription = () => {
    switch (componentType) {
      case 'timeline':
        return t(
          'error.timeline_description',
          'Unable to load the activity timeline. Please try refreshing.',
        )
      case 'selector':
        return t(
          'error.selector_description',
          'Unable to load the dossier selector. Please try again.',
        )
      case 'badge':
        return t('error.badge_description', 'Unable to display dossier information.')
      case 'context':
        return t(
          'error.context_description',
          'Unable to resolve dossier context. Please select a dossier manually.',
        )
      default:
        return t(
          'error.general_description',
          'An unexpected error occurred. Please try refreshing the page.',
        )
    }
  }

  return (
    <div className={cn('w-full', className)} dir={isRTL ? 'rtl' : 'ltr'}>
      <Alert variant="destructive">
        <AlertTriangle className="size-4" />
        <AlertTitle>{getErrorTitle()}</AlertTitle>
        <AlertDescription className="mt-2 space-y-3">
          <p>{getErrorDescription()}</p>

          {/* Show technical error in development */}
          {process.env.NODE_ENV === 'development' && error && (
            <details className="mt-2 text-xs">
              <summary className="cursor-pointer hover:underline">
                {t('error.technical_details', 'Technical details')}
              </summary>
              <pre className="mt-2 max-h-32 overflow-auto rounded bg-destructive/10 p-2 text-[10px]">
                {error.message}
                {error.stack && `\n\n${error.stack}`}
              </pre>
            </details>
          )}

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={resetError} className="min-h-9 gap-2">
              <RefreshCw className="size-3" />
              {t('error.try_again', 'Try Again')}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.location.reload()}
              className="min-h-9 gap-2"
            >
              <Home className="size-3" />
              {t('error.refresh_page', 'Refresh Page')}
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  )
}

// ============================================================================
// Error Boundary Class Component
// ============================================================================

export class DossierErrorBoundary extends Component<
  DossierErrorBoundaryProps,
  DossierErrorBoundaryState
> {
  constructor(props: DossierErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    }
  }

  static getDerivedStateFromError(error: Error): Partial<DossierErrorBoundaryState> {
    return {
      hasError: true,
      error,
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    })

    // Log error in development
    if (process.env.NODE_ENV === 'development') {
      console.error('[DossierErrorBoundary] Caught error:', error, errorInfo)
    }

    // Call custom error handler
    this.props.onError?.(error, errorInfo)

    // In production, log to error tracking service
    if (process.env.NODE_ENV === 'production') {
      this.logErrorToService(error, errorInfo)
    }
  }

  logErrorToService = (error: Error, errorInfo: ErrorInfo) => {
    // Log to console (in production, send to error tracking service)
    console.error('[DossierErrorBoundary] Error logged:', {
      component: this.props.componentType,
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      url: window.location.href,
    })
  }

  resetErrorBoundary = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    })
  }

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Use default error fallback
      return (
        <ErrorFallback
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          resetError={this.resetErrorBoundary}
          componentType={this.props.componentType}
          className={this.props.className}
        />
      )
    }

    return this.props.children
  }
}

// ============================================================================
// HOC for wrapping components
// ============================================================================

/**
 * Higher-order component to wrap a component with DossierErrorBoundary.
 */
export function withDossierErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  options?: Omit<DossierErrorBoundaryProps, 'children'>,
) {
  const WrappedComponent = (props: P) => (
    <DossierErrorBoundary {...options}>
      <Component {...props} />
    </DossierErrorBoundary>
  )

  WrappedComponent.displayName = `withDossierErrorBoundary(${Component.displayName || Component.name})`

  return WrappedComponent
}

export default DossierErrorBoundary
