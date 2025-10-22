import { useTranslation } from 'react-i18next'
import { useOfflineQueue } from '../services/offline-queue'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Wifi, WifiOff, RefreshCw, Clock } from 'lucide-react'
import { useState } from 'react'

export function OfflineIndicator() {
  const { t } = useTranslation()
  const { isOnline, actions, processQueue, retryFailed, clearCompleted } = useOfflineQueue()
  const [showDetails, setShowDetails] = useState(false)

  const pendingActions = actions.filter(action => action.status === 'pending')
  const failedActions = actions.filter(action => action.status === 'failed')
  const completedActions = actions.filter(action => action.status === 'completed')

  if (isOnline && actions.length === 0) {
    return null
  }

  return (
    <div className="fixed bottom-4 end-4 z-50">
      <div className="max-w-sm rounded-lg border border-gray-200 bg-white p-4 shadow-lg dark:border-gray-700 dark:bg-gray-800">
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isOnline ? (
              <Wifi className="size-4 text-green-500" />
            ) : (
              <WifiOff className="size-4 text-red-500" />
            )}
            <span className="text-sm font-medium">
              {isOnline ? t('realtime.connected') : t('offline.title')}
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDetails(!showDetails)}
          >
            {showDetails ? 'Hide' : 'Details'}
          </Button>
        </div>

        {!isOnline && (
          <p className="mb-3 text-xs text-gray-600 dark:text-gray-400">
            {t('offline.description')}
          </p>
        )}

        {actions.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs">
              <Badge variant="outline" className="text-xs">
                <Clock className="me-1 size-3" />
                {pendingActions.length} {t('offline.queuedActions')}
              </Badge>
              {failedActions.length > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {failedActions.length} Failed
                </Badge>
              )}
            </div>

            {showDetails && (
              <div className="space-y-2 text-xs">
                {pendingActions.length > 0 && (
                  <div>
                    <div className="mb-1 font-medium text-gray-700 dark:text-gray-300">
                      Pending Actions:
                    </div>
                    <div className="space-y-1">
                      {pendingActions.slice(0, 3).map((action) => (
                        <div key={action.id} className="flex items-center justify-between">
                          <span className="truncate">{action.method} {action.url}</span>
                          <Badge variant="outline" className="text-xs">
                            {action.priority}
                          </Badge>
                        </div>
                      ))}
                      {pendingActions.length > 3 && (
                        <div className="text-gray-500">
                          +{pendingActions.length - 3} more
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {failedActions.length > 0 && (
                  <div>
                    <div className="mb-1 font-medium text-red-600 dark:text-red-400">
                      Failed Actions:
                    </div>
                    <div className="space-y-1">
                      {failedActions.slice(0, 2).map((action) => (
                        <div key={action.id} className="text-red-600 dark:text-red-400">
                          {action.method} {action.url}
                          {action.error && (
                            <div className="truncate text-xs text-gray-500">
                              {action.error}
                            </div>
                          )}
                        </div>
                      ))}
                      {failedActions.length > 2 && (
                        <div className="text-gray-500">
                          +{failedActions.length - 2} more
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {completedActions.length > 0 && (
                  <div className="text-xs text-green-600 dark:text-green-400">
                    {completedActions.length} actions completed
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-2">
              {isOnline && pendingActions.length > 0 && (
                <Button
                  size="sm"
                  onClick={processQueue}
                  className="text-xs"
                >
                  <RefreshCw className="me-1 size-3" />
                  {t('offline.retrySync')}
                </Button>
              )}
              
              {failedActions.length > 0 && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={retryFailed}
                  className="text-xs"
                >
                  Retry Failed
                </Button>
              )}
              
              {completedActions.length > 0 && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={clearCompleted}
                  className="text-xs"
                >
                  Clear
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

