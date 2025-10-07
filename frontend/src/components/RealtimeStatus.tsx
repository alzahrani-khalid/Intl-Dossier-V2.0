import { useTranslation } from 'react-i18next'
import { useRealtimeStore } from '../services/realtime'
import { useAuth } from '../contexts/auth.context'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Wifi, WifiOff, RefreshCw, AlertCircle } from 'lucide-react'

export function RealtimeStatus() {
  const { t } = useTranslation()
  const auth = useAuth()
  const { connectionStatus, isConnected, reconnect, lastError } = useRealtimeStore()

  // Don't show on login page or when not authenticated
  if (!auth?.session) {
    return null
  }

  const getStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected':
        return <Wifi className="h-4 w-4 text-green-500" />
      case 'disconnected':
        return <WifiOff className="h-4 w-4 text-gray-500" />
      case 'reconnecting':
        return <RefreshCw className="h-4 w-4 text-yellow-500 animate-spin" />
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return <WifiOff className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'connected':
        return t('realtime.connected', 'Connected')
      case 'disconnected':
        return t('realtime.disconnected', 'Disconnected')
      case 'reconnecting':
        return t('realtime.reconnecting', 'Reconnecting...')
      case 'error':
        return t('realtime.connectionLost', 'Connection Lost')
      default:
        return t('realtime.disconnected', 'Disconnected')
    }
  }

  const getStatusVariant = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'default'
      case 'disconnected':
        return 'secondary'
      case 'reconnecting':
        return 'outline'
      case 'error':
        return 'destructive'
      default:
        return 'secondary'
    }
  }

  // Only show if not connected or there's an error
  if (connectionStatus === 'connected') {
    return null
  }

  return (
    <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 bg-white dark:bg-gray-800 shadow-lg rounded-lg p-3 border border-gray-200 dark:border-gray-700">
      <Badge variant={getStatusVariant()} className="gap-1">
        {getStatusIcon()}
        <span>{getStatusText()}</span>
      </Badge>

      {connectionStatus === 'error' && (
        <Button
          size="sm"
          variant="outline"
          onClick={reconnect}
          className="h-6 px-2 text-xs"
        >
          <RefreshCw className="h-3 w-3 me-1" />
          Retry
        </Button>
      )}
    </div>
  )
}

export default RealtimeStatus

