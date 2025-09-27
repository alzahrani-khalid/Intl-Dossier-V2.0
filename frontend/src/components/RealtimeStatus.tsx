import { useTranslation } from 'react-i18next'
import { useRealtimeStore } from '../services/realtime'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Wifi, WifiOff, RefreshCw, AlertCircle } from 'lucide-react'

export function RealtimeStatus() {
  const { t } = useTranslation()
  const { connectionStatus, isConnected, reconnect, lastError } = useRealtimeStore()

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
        return t('realtime.connected')
      case 'disconnected':
        return t('realtime.disconnected')
      case 'reconnecting':
        return t('realtime.reconnecting')
      case 'error':
        return t('realtime.connectionLost')
      default:
        return t('realtime.disconnected')
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

  if (isConnected && !lastError) {
    return (
      <Badge variant={getStatusVariant()} className="gap-1">
        {getStatusIcon()}
        <span className="hidden sm:inline">{getStatusText()}</span>
      </Badge>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <Badge variant={getStatusVariant()} className="gap-1">
        {getStatusIcon()}
        <span className="hidden sm:inline">{getStatusText()}</span>
      </Badge>
      
      {connectionStatus === 'error' && (
        <Button
          size="sm"
          variant="outline"
          onClick={reconnect}
          className="h-6 px-2 text-xs"
        >
          <RefreshCw className="h-3 w-3 mr-1" />
          Retry
        </Button>
      )}
    </div>
  )
}

export default RealtimeStatus

