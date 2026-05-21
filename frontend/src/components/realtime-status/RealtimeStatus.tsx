import { useTranslation } from 'react-i18next'
import { useRealtimeStore } from '@/services/realtime'
import { useAuth } from '@/contexts/auth.context'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { Wifi, WifiOff, RefreshCw, AlertCircle } from 'lucide-react'

export function RealtimeStatus() {
  const { t } = useTranslation()
  const auth = useAuth()
  const { connectionStatus, isInitialized, reconnect } = useRealtimeStore()

  // Don't show on login page or when not authenticated
  if (!(auth as any)?.isAuthenticated) {
    return null
  }

  // Don't show when realtime hasn't been initialized yet (no subscriptions created)
  if (!isInitialized) {
    return null
  }

  const getStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected':
        return <Wifi className="size-4 text-success" />
      case 'disconnected':
        return <WifiOff className="size-4 text-muted-foreground" />
      case 'reconnecting':
        return <RefreshCw className="size-4 animate-spin text-warning" />
      case 'error':
        return <AlertCircle className="size-4 text-danger" />
      default:
        return <WifiOff className="size-4 text-muted-foreground" />
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
    <div className="fixed bottom-4 start-4 z-50 flex items-center gap-2 rounded-lg border border-line bg-surface p-3 shadow-lg">
      <Badge variant={getStatusVariant()} className="gap-1">
        {getStatusIcon()}
        <span>{getStatusText()}</span>
      </Badge>

      {connectionStatus === 'error' && (
        <Button size="sm" variant="outline" onClick={reconnect} className="h-6 px-2 text-xs">
          <RefreshCw className="me-1 size-3" />
          Retry
        </Button>
      )}
    </div>
  )
}
