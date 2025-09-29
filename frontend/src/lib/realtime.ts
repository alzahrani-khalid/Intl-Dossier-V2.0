import type { RealtimeChannel, RealtimePresenceState } from '@supabase/supabase-js'
import { supabase } from './supabase'

export interface RealtimeConfig {
  channel: string
  onPresenceSync?: (state: RealtimePresenceState) => void
  onPresenceJoin?: (state: RealtimePresenceState) => void
  onPresenceLeave?: (state: RealtimePresenceState) => void
  onBroadcast?: (event: string, payload: any) => void
  onDatabaseChange?: (payload: any) => void
}

export interface PresenceUser {
  id: string
  email: string
  name?: string
  avatar?: string
  color?: string
  cursor?: { x: number; y: number }
  selection?: string
  status?: 'online' | 'idle' | 'typing' | 'away'
  lastSeen?: Date
}

class RealtimeManager {
  private channels: Map<string, RealtimeChannel> = new Map()
  private reconnectTimeouts: Map<string, NodeJS.Timeout> = new Map()
  private messageQueue: Map<string, Array<{ event: string; payload: any }>> = new Map()
  private isOnline: boolean = navigator.onLine
  private reconnectAttempts: Map<string, number> = new Map()
  private maxReconnectAttempts = 5
  private baseReconnectDelay = 1000

  constructor() {
    // Monitor online/offline status
    window.addEventListener('online', this.handleOnline)
    window.addEventListener('offline', this.handleOffline)

    // Setup heartbeat for connection monitoring
    this.startHeartbeat()
  }

  private handleOnline = () => {
    this.isOnline = true
    console.log('Network restored, reconnecting channels...')
    this.reconnectAllChannels()
  }

  private handleOffline = () => {
    this.isOnline = false
    console.log('Network lost, queueing messages...')
  }

  private startHeartbeat() {
    setInterval(() => {
      this.channels.forEach((channel, name) => {
        // Check channel health
        const state = channel.state
        if (state === 'errored' || state === 'closed') {
          console.log(`Channel ${name} unhealthy, attempting reconnect...`)
          this.reconnectChannel(name)
        }
      })
    }, 30000) // Check every 30 seconds
  }

  subscribe(config: RealtimeConfig): RealtimeChannel {
    const existingChannel = this.channels.get(config.channel)
    if (existingChannel) {
      console.log(`Reusing existing channel: ${config.channel}`)
      return existingChannel
    }

    const channel = supabase.channel(config.channel, {
      config: {
        presence: {
          key: config.channel,
        },
      },
    })

    // Setup presence handlers
    if (config.onPresenceSync) {
      channel.on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState()
        config.onPresenceSync!(state)
      })
    }

    if (config.onPresenceJoin) {
      channel.on('presence', { event: 'join' }, ({ newPresences }) => {
        // Convert array to RealtimePresenceState format
        const presenceState: RealtimePresenceState = {}
        newPresences.forEach((presence: any) => {
          if (!presenceState[presence.presence_ref]) {
            presenceState[presence.presence_ref] = []
          }
          presenceState[presence.presence_ref].push(presence)
        })
        config.onPresenceJoin!(presenceState)
      })
    }

    if (config.onPresenceLeave) {
      channel.on('presence', { event: 'leave' }, ({ leftPresences }) => {
        // Convert array to RealtimePresenceState format
        const presenceState: RealtimePresenceState = {}
        leftPresences.forEach((presence: any) => {
          if (!presenceState[presence.presence_ref]) {
            presenceState[presence.presence_ref] = []
          }
          presenceState[presence.presence_ref].push(presence)
        })
        config.onPresenceLeave!(presenceState)
      })
    }

    // Setup broadcast handler with message deduplication
    if (config.onBroadcast) {
      const processedMessages = new Set<string>()
      channel.on('broadcast', { event: '*' }, ({ event, payload }) => {
        const messageId = `${event}-${JSON.stringify(payload)}-${Date.now()}`
        if (!processedMessages.has(messageId)) {
          processedMessages.add(messageId)
          config.onBroadcast!(event, payload)
          // Clean up old message IDs after 5 seconds
          setTimeout(() => processedMessages.delete(messageId), 5000)
        }
      })
    }

    // Setup database change handler
    if (config.onDatabaseChange) {
      channel.on(
        'postgres_changes',
        { event: '*', schema: 'public' },
        (payload) => {
          config.onDatabaseChange!(payload)
        }
      )
    }

    // Subscribe with error handling
    channel.subscribe((status, err) => {
      if (status === 'SUBSCRIBED') {
        console.log(`Successfully subscribed to channel: ${config.channel}`)
        this.reconnectAttempts.set(config.channel, 0)
        this.flushMessageQueue(config.channel, channel)
      } else if (status === 'CHANNEL_ERROR') {
        console.error(`Error subscribing to channel ${config.channel}:`, err)
        this.handleChannelError(config.channel, config)
      } else if (status === 'TIMED_OUT') {
        console.error(`Subscription timed out for channel: ${config.channel}`)
        this.handleChannelError(config.channel, config)
      }
    })

    this.channels.set(config.channel, channel)
    return channel
  }

  private handleChannelError(channelName: string, config: RealtimeConfig) {
    const attempts = this.reconnectAttempts.get(channelName) || 0
    if (attempts < this.maxReconnectAttempts) {
      const delay = this.baseReconnectDelay * Math.pow(2, attempts) // Exponential backoff
      console.log(`Reconnecting channel ${channelName} in ${delay}ms (attempt ${attempts + 1})`)

      const timeout = setTimeout(() => {
        this.reconnectAttempts.set(channelName, attempts + 1)
        this.unsubscribe(channelName)
        this.subscribe(config)
      }, delay)

      this.reconnectTimeouts.set(channelName, timeout)
    } else {
      console.error(`Max reconnection attempts reached for channel: ${channelName}`)
    }
  }

  private reconnectChannel(channelName: string) {
    const channel = this.channels.get(channelName)
    if (channel && channel.state !== 'joined') {
      channel.subscribe()
    }
  }

  private reconnectAllChannels() {
    this.channels.forEach((channel, name) => {
      if (channel.state !== 'joined') {
        console.log(`Reconnecting channel: ${name}`)
        this.reconnectChannel(name)
      }
    })
  }

  unsubscribe(channelName: string) {
    const channel = this.channels.get(channelName)
    if (channel) {
      channel.unsubscribe()
      this.channels.delete(channelName)

      // Clear reconnect timeout if exists
      const timeout = this.reconnectTimeouts.get(channelName)
      if (timeout) {
        clearTimeout(timeout)
        this.reconnectTimeouts.delete(channelName)
      }

      // Clear message queue
      this.messageQueue.delete(channelName)
      console.log(`Unsubscribed from channel: ${channelName}`)
    }
  }

  unsubscribeAll() {
    this.channels.forEach((_, name) => {
      this.unsubscribe(name)
    })
  }

  broadcast(channelName: string, event: string, payload: any) {
    if (!this.isOnline) {
      // Queue message when offline
      this.queueMessage(channelName, event, payload)
      return Promise.resolve()
    }

    const channel = this.channels.get(channelName)
    if (channel) {
      return channel.send({
        type: 'broadcast',
        event,
        payload,
      })
    }
    return Promise.reject(new Error(`Channel ${channelName} not found`))
  }

  private queueMessage(channelName: string, event: string, payload: any) {
    if (!this.messageQueue.has(channelName)) {
      this.messageQueue.set(channelName, [])
    }
    this.messageQueue.get(channelName)!.push({ event, payload })
    console.log(`Message queued for channel ${channelName}`)
  }

  private flushMessageQueue(channelName: string, channel: RealtimeChannel) {
    const queue = this.messageQueue.get(channelName)
    if (queue && queue.length > 0) {
      console.log(`Flushing ${queue.length} queued messages for channel ${channelName}`)
      queue.forEach(({ event, payload }) => {
        channel.send({
          type: 'broadcast',
          event,
          payload,
        })
      })
      this.messageQueue.set(channelName, [])
    }
  }

  async trackPresence(
    channelName: string,
    user: PresenceUser
  ): Promise<void> {
    const channel = this.channels.get(channelName)
    if (channel) {
      const presenceState = {
        ...user,
        lastSeen: new Date(),
      }
      await channel.track(presenceState)
    }
  }

  async updatePresence(
    channelName: string,
    updates: Partial<PresenceUser>
  ): Promise<void> {
    const channel = this.channels.get(channelName)
    if (channel) {
      const currentState = channel.presenceState()
      const userId = Object.keys(currentState)[0]
      if (userId && currentState[userId]) {
        const updatedState = {
          ...currentState[userId][0],
          ...updates,
          lastSeen: new Date(),
        }
        await channel.track(updatedState)
      }
    }
  }

  getPresenceState(channelName: string): RealtimePresenceState {
    const channel = this.channels.get(channelName)
    return channel ? channel.presenceState() : {}
  }

  getChannelState(channelName: string): string | undefined {
    const channel = this.channels.get(channelName)
    return channel?.state
  }

  isChannelSubscribed(channelName: string): boolean {
    const channel = this.channels.get(channelName)
    return channel?.state === 'joined'
  }

  destroy() {
    window.removeEventListener('online', this.handleOnline)
    window.removeEventListener('offline', this.handleOffline)
    this.unsubscribeAll()
  }
}

// Export singleton instance
export const realtimeManager = new RealtimeManager()

// Export convenience functions
export const subscribeToChannel = (config: RealtimeConfig) =>
  realtimeManager.subscribe(config)

export const unsubscribeFromChannel = (channelName: string) =>
  realtimeManager.unsubscribe(channelName)

export const broadcastMessage = (channelName: string, event: string, payload: any) =>
  realtimeManager.broadcast(channelName, event, payload)

export const trackUserPresence = (channelName: string, user: PresenceUser) =>
  realtimeManager.trackPresence(channelName, user)

export const updateUserPresence = (channelName: string, updates: Partial<PresenceUser>) =>
  realtimeManager.updatePresence(channelName, updates)