import React, { Component, ErrorInfo, ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '../ui/button'
import { AlertCircle, RefreshCw, Wifi, WifiOff } from 'lucide-react'
import { useOfflineQueue } from '../../services/offline-queue'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onRetry?: () => void
  showOfflineOption?: boolean
}

interface State {
  hasError: boolean
  error: Error | null
  isRetrying: boolean
}

export class ApiErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      isRetrying: false
    }
  }

  static getDerivedStateFromError(error: Error): State {
    // Only catch API-related errors
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      return {
        hasError: true,
        error,
        isRetrying: false
      }
    }
    
    // Re-throw non-API errors
    throw error
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('API Error caught by boundary:', error, errorInfo)
  }

  handleRetry = async () => {
    this.setState({ isRetrying: true })
    
    try {
      await this.props.onRetry?.()
      this.setState({
        hasError: false,
        error: null,
        isRetrying: false
      })
    } catch (error) {
      console.error('Retry failed:', error)
      this.setState({ isRetrying: false })
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return <ApiErrorFallback 
        error={this.state.error}
        isRetrying={this.state.isRetrying}
        onRetry={this.handleRetry}
        showOfflineOption={this.props.showOfflineOption}
      />
    }

    return this.props.children
  }
}

interface ApiErrorFallbackProps {
  error: Error | null
  isRetrying: boolean
  onRetry: () => void
  showOfflineOption?: boolean
}

function ApiErrorFallback({ error, isRetrying, onRetry, showOfflineOption = true }: ApiErrorFallbackProps) {
  const { t } = useTranslation()
  const { isOnline, addToQueue } = useOfflineQueue()

  const handleQueueForLater = () => {
    // This would queue the failed action for later retry
    // In a real implementation, you'd need to pass the failed action details
    console.log('Action queued for later retry')
  }

  const isNetworkError = error?.message.includes('fetch') || error?.message.includes('network')

  return (
    <div className="flex items-center justify-center p-8">
      <div className="text-center max-w-md">
        <div className="flex justify-center mb-4">
          {isNetworkError ? (
            <WifiOff className="h-12 w-12 text-orange-500" />
          ) : (
            <AlertCircle className="h-12 w-12 text-red-500" />
          )}
        </div>
        
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          {isNetworkError ? 'Connection Error' : 'API Error'}
        </h3>
        
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          {isNetworkError 
            ? 'Unable to connect to the server. Please check your internet connection.'
            : 'Something went wrong while processing your request.'
          }
        </p>

        <div className="space-y-2">
          <Button 
            onClick={onRetry} 
            disabled={isRetrying}
            className="w-full"
          >
            <RefreshCw className={`h-4 w-4 me-2 ${isRetrying ? 'animate-spin' : ''}`} />
            {isRetrying ? 'Retrying...' : 'Try Again'}
          </Button>
          
          {showOfflineOption && isNetworkError && (
            <Button 
              onClick={handleQueueForLater}
              variant="outline"
              className="w-full"
            >
              <Wifi className="h-4 w-4 me-2" />
              Queue for Later
            </Button>
          )}
        </div>

        {process.env.NODE_ENV === 'development' && error && (
          <details className="mt-4 text-start">
            <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
              Error Details
            </summary>
            <pre className="mt-2 p-2 bg-gray-100 dark:bg-gray-700 rounded text-xs overflow-auto">
              {error.message}
            </pre>
          </details>
        )}
      </div>
    </div>
  )
}

// Hook for handling API errors in functional components
export function useApiErrorHandler() {
  const { addToQueue } = useOfflineQueue()

  return (error: Error, action?: { method: string; url: string; data?: any }) => {
    if (error.message.includes('fetch') || error.message.includes('network')) {
      // Queue the action for later retry
      if (action) {
        addToQueue({
          type: 'api',
          method: action.method as any,
          url: action.url,
          data: action.data,
          priority: 'normal',
          maxRetries: 3
        })
      }
    }
    
    // Re-throw the error to be caught by error boundary
    throw error
  }
}

export default ApiErrorBoundary

