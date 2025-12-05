import React from 'react'
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js'
import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { supabase } from '../lib/supabase'

// Types for realtime subscriptions
export interface RealtimeSubscription {
  id: string
  channel: RealtimeChannel
  table: string
  event: 'INSERT' | 'UPDATE' | 'DELETE' | '*'
  callback: (payload: RealtimePostgresChangesPayload<any>) => void
  status: 'subscribed' | 'unsubscribed' | 'error'
}

export interface RealtimeState {
  isConnected: boolean
  isConnecting: boolean
  subscriptions: Map<string, RealtimeSubscription>
  connectionStatus: 'connected' | 'disconnected' | 'reconnecting' | 'error'
  lastError: string | null
}

export interface RealtimeActions {
  subscribe: (config: {
    table: string
    event: 'INSERT' | 'UPDATE' | 'DELETE' | '*'
    callback: (payload: RealtimePostgresChangesPayload<any>) => void
    filter?: string
  }) => string
  unsubscribe: (subscriptionId: string) => void
  unsubscribeAll: () => void
  reconnect: () => Promise<void>
  setConnectionStatus: (status: RealtimeState['connectionStatus']) => void
  setError: (error: string | null) => void
}

type RealtimeConnectionState = 'connecting' | 'open' | 'closing' | 'closed'

// Zustand store for realtime state
export const useRealtimeStore = create<RealtimeState & RealtimeActions>()(
  subscribeWithSelector((set, get) => ({
    isConnected: false,
    isConnecting: false,
    subscriptions: new Map(),
    connectionStatus: 'disconnected',
    lastError: null,

    subscribe: ({ table, event, callback, filter }) => {
      const subscriptionId = crypto.randomUUID()
      const { subscriptions } = get()

      try {
        const channel = supabase.channel(`${table}-${event}-${subscriptionId}`).on(
          'postgres_changes' as any,
          {
            event,
            schema: 'public',
            table,
            filter,
          } as any,
          (payload: any) => {
            callback(payload)
          },
        )

        // Subscribe to the channel
        channel.subscribe((status) => {
          const subscription = subscriptions.get(subscriptionId)
          if (subscription) {
            subscription.status = status === 'SUBSCRIBED' ? 'subscribed' : 'error'
            set({ subscriptions: new Map(subscriptions) })
          }
        })

        const subscription: RealtimeSubscription = {
          id: subscriptionId,
          channel,
          table,
          event,
          callback,
          status: 'subscribed',
        }

        subscriptions.set(subscriptionId, subscription)
        set({ subscriptions: new Map(subscriptions) })

        return subscriptionId
      } catch (error) {
        console.error('Failed to create subscription:', error)
        set({ lastError: error instanceof Error ? error.message : 'Unknown error' })
        throw error
      }
    },

    unsubscribe: (subscriptionId) => {
      const { subscriptions } = get()
      const subscription = subscriptions.get(subscriptionId)

      if (subscription) {
        subscription.channel.unsubscribe()
        subscriptions.delete(subscriptionId)
        set({ subscriptions: new Map(subscriptions) })
      }
    },

    unsubscribeAll: () => {
      const { subscriptions } = get()

      subscriptions.forEach((subscription) => {
        subscription.channel.unsubscribe()
      })

      subscriptions.clear()
      set({ subscriptions: new Map(subscriptions) })
    },

    reconnect: async () => {
      const { isConnecting } = get()
      if (isConnecting) return

      set({ isConnecting: true, connectionStatus: 'reconnecting' })

      try {
        // Reconnect to Supabase
        await supabase.realtime.connect()

        // Resubscribe to all existing subscriptions
        const { subscriptions } = get()
        const newSubscriptions = new Map()

        for (const [id, subscription] of subscriptions) {
          try {
            const newChannel = supabase
              .channel(`${subscription.table}-${subscription.event}-${id}`)
              .on(
                'postgres_changes' as any,
                {
                  event: subscription.event,
                  schema: 'public',
                  table: subscription.table,
                },
                subscription.callback,
              )

            newChannel.subscribe((status) => {
              subscription.status = status === 'SUBSCRIBED' ? 'subscribed' : 'error'
              newSubscriptions.set(id, subscription)
              set({ subscriptions: new Map(newSubscriptions) })
            })

            subscription.channel = newChannel
            newSubscriptions.set(id, subscription)
          } catch (error) {
            console.error(`Failed to resubscribe to ${subscription.table}:`, error)
            subscription.status = 'error'
            newSubscriptions.set(id, subscription)
          }
        }

        set({
          isConnected: true,
          isConnecting: false,
          connectionStatus: 'connected',
          lastError: null,
          subscriptions: newSubscriptions,
        })
      } catch (error) {
        console.error('Failed to reconnect:', error)
        set({
          isConnected: false,
          isConnecting: false,
          connectionStatus: 'error',
          lastError: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    },

    setConnectionStatus: (status) => {
      set({
        connectionStatus: status,
        isConnected: status === 'connected',
        isConnecting: status === 'reconnecting',
      })
    },

    setError: (error) => {
      set({ lastError: error })
    },
  })),
)

// Connection status monitoring
const connectionStateToStatus = (
  state: RealtimeConnectionState,
): RealtimeState['connectionStatus'] => {
  switch (state) {
    case 'open':
      return 'connected'
    case 'connecting':
      return 'reconnecting'
    case 'closing':
    case 'closed':
    default:
      return 'disconnected'
  }
}

let teardownConnectionMonitoring: (() => void) | null = null

const setupConnectionMonitoring = () => {
  const { setConnectionStatus, setError, reconnect } = useRealtimeStore.getState()

  teardownConnectionMonitoring?.()

  const updateFromRealtime = (state?: RealtimeConnectionState) => {
    const realtimeState = state ?? (supabase.realtime.connectionState() as RealtimeConnectionState)

    const status = connectionStateToStatus(realtimeState)
    setConnectionStatus(status)
    if (status === 'connected') {
      setError(null)
    }
  }

  updateFromRealtime()

  if (typeof supabase.realtime.onHeartbeat === 'function') {
    supabase.realtime.onHeartbeat((heartbeatStatus) => {
      if (heartbeatStatus === 'ok') {
        updateFromRealtime('open')
      } else if (heartbeatStatus === 'sent') {
        updateFromRealtime('connecting')
      } else if (
        heartbeatStatus === 'timeout' ||
        heartbeatStatus === 'error' ||
        heartbeatStatus === 'disconnected'
      ) {
        console.error('Realtime heartbeat issue:', heartbeatStatus)
        setConnectionStatus('error')
        setError(`Realtime heartbeat ${heartbeatStatus}`)
        setTimeout(() => {
          reconnect().catch((error) => {
            console.error('Failed to reconnect after heartbeat issue:', error)
            setError(error instanceof Error ? error.message : 'Unknown realtime error')
          })
        }, 5000)
      }
    })
  }

  const intervalId = setInterval(() => {
    updateFromRealtime()
  }, 3000)

  const handleBeforeUnload = () => {
    clearInterval(intervalId)
  }

  if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', handleBeforeUnload)
  }

  teardownConnectionMonitoring = () => {
    clearInterval(intervalId)
    if (typeof window !== 'undefined') {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }
}

// Initialize connection monitoring
setupConnectionMonitoring()

// Hook for easy subscription management
export function useRealtimeSubscription() {
  const { subscribe, unsubscribe, unsubscribeAll, isConnected, connectionStatus } =
    useRealtimeStore()

  return {
    subscribe,
    unsubscribe,
    unsubscribeAll,
    isConnected,
    connectionStatus,
  }
}

// Specific hooks for common subscriptions
export function useTableSubscription<T extends { [key: string]: any } = any>(
  table: string,
  event: 'INSERT' | 'UPDATE' | 'DELETE' | '*',
  callback: (payload: RealtimePostgresChangesPayload<T>) => void,
  filter?: string,
) {
  const { subscribe, unsubscribe } = useRealtimeStore()

  React.useEffect(() => {
    const subscriptionId = subscribe({
      table,
      event,
      callback,
      filter,
    })

    return () => {
      unsubscribe(subscriptionId)
    }
  }, [table, event, filter, subscribe, unsubscribe])
}

// Presence management for collaborative features
export function usePresence(channelName: string) {
  const [presence, setPresence] = React.useState<Map<string, any>>(new Map())
  const [isOnline, setIsOnline] = React.useState(false)

  React.useEffect(() => {
    const channel = supabase.channel(channelName, {
      config: {
        presence: {
          key: crypto.randomUUID(),
        },
      },
    })

    channel
      .on('presence', { event: 'sync' }, () => {
        const newPresence = channel.presenceState()
        setPresence(new Map(Object.entries(newPresence)))
      })
      .on('presence', { event: 'join' }, ({ key: _key, newPresences: _newPresences }) => {
        // User joined
      })
      .on('presence', { event: 'leave' }, ({ key: _key, leftPresences: _leftPresences }) => {
        // User left
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            user_id: crypto.randomUUID(),
            online_at: new Date().toISOString(),
          })
          setIsOnline(true)
        } else {
          setIsOnline(false)
        }
      })

    return () => {
      channel.unsubscribe()
    }
  }, [channelName])

  return {
    presence,
    isOnline,
    track: (data: any) => {
      const channel = supabase.channel(channelName)
      return channel.track(data)
    },
  }
}

// Export the Supabase client for direct use
export { supabase }

// Export utility functions
export const getConnectionStatus = () => useRealtimeStore.getState().connectionStatus
export const getSubscriptions = () => useRealtimeStore.getState().subscriptions
export const isRealtimeConnected = () => useRealtimeStore.getState().isConnected

export default useRealtimeStore
