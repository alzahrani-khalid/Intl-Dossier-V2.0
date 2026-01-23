/**
 * Realtime Manager
 *
 * Manages Supabase Realtime connections with automatic reconnection,
 * offline message queueing, and presence tracking. Provides a robust
 * wrapper around Supabase Realtime channels with health monitoring
 * and error recovery.
 */

import type { RealtimeChannel, RealtimePresenceState } from '@supabase/supabase-js'
import { supabase } from './supabase'

// ============================================================================
// Configuration Interfaces
// ============================================================================

/**
 * Configuration for subscribing to a realtime channel
 *
 * @property channel - Unique channel name for the subscription
 * @property onPresenceSync - Callback when presence state is synchronized
 * @property onPresenceJoin - Callback when a user joins the channel
 * @property onPresenceLeave - Callback when a user leaves the channel
 * @property onBroadcast - Callback for broadcast messages (any event type)
 * @property onDatabaseChange - Callback for postgres_changes events
 */
export interface RealtimeConfig {
  channel: string
  onPresenceSync?: (state: RealtimePresenceState) => void
  onPresenceJoin?: (state: RealtimePresenceState) => void
  onPresenceLeave?: (state: RealtimePresenceState) => void
  onBroadcast?: (event: string, payload: any) => void
  onDatabaseChange?: (payload: any) => void
}

/**
 * User presence data for collaborative features
 *
 * @property id - Unique user identifier
 * @property email - User email address
 * @property name - Optional display name
 * @property avatar - Optional avatar URL
 * @property color - Optional color for UI indicators (cursors, highlights)
 * @property cursor - Optional cursor position for collaborative editing
 * @property selection - Optional text selection for collaborative editing
 * @property status - User activity status
 * @property lastSeen - Last activity timestamp
 */
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

// ============================================================================
// Realtime Manager Class
// ============================================================================

/**
 * Manages all realtime subscriptions with automatic reconnection and offline support
 *
 * Features:
 * - Automatic reconnection with exponential backoff
 * - Offline message queueing
 * - Connection health monitoring (heartbeat every 30s)
 * - Presence tracking and updates
 * - Message deduplication
 * - Network state awareness
 */
class RealtimeManager {
  private channels: Map<string, RealtimeChannel> = new Map()
  private reconnectTimeouts: Map<string, NodeJS.Timeout> = new Map()
  private messageQueue: Map<string, Array<{ event: string; payload: any }>> = new Map()
  private isOnline: boolean = navigator.onLine
  private reconnectAttempts: Map<string, number> = new Map()
  private maxReconnectAttempts = 5
  private baseReconnectDelay = 1000

  /**
   * Initializes the realtime manager and sets up network monitoring
   */
  constructor() {
    // Monitor online/offline status
    window.addEventListener('online', this.handleOnline)
    window.addEventListener('offline', this.handleOffline)

    // Setup heartbeat for connection monitoring
    this.startHeartbeat()
  }

  /**
   * Handles browser online event - reconnects all channels
   * @private
   */
  private handleOnline = () => {
    this.isOnline = true
    this.reconnectAllChannels()
  }

  /**
   * Handles browser offline event - marks connection as offline
   * @private
   */
  private handleOffline = () => {
    this.isOnline = false
  }

  /**
   * Starts heartbeat monitoring to check channel health every 30 seconds
   * Automatically attempts reconnection for errored or closed channels
   * @private
   */
  private startHeartbeat() {
    setInterval(() => {
      this.channels.forEach((channel, name) => {
        // Check channel health
        const state = channel.state
        if (state === 'errored' || state === 'closed') {
          this.reconnectChannel(name)
        }
      })
    }, 30000) // Check every 30 seconds
  }

  /**
   * Subscribes to a realtime channel with the provided configuration
   *
   * @param config - Channel configuration including name and event handlers
   * @returns The subscribed RealtimeChannel instance
   *
   * Features:
   * - Returns existing channel if already subscribed
   * - Sets up presence, broadcast, and database change handlers
   * - Implements message deduplication for broadcasts
   * - Automatic reconnection on errors with exponential backoff
   * - Flushes queued messages on successful connection
   */
  subscribe(config: RealtimeConfig): RealtimeChannel {
    const existingChannel = this.channels.get(config.channel)
    if (existingChannel) {
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
          presenceState[presence.presence_ref]?.push(presence)
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
          presenceState[presence.presence_ref]?.push(presence)
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
      channel.on('postgres_changes', { event: '*', schema: 'public' }, (payload) => {
        config.onDatabaseChange!(payload)
      })
    }

    // Subscribe with error handling
    channel.subscribe((status, _err) => {
      if (status === 'SUBSCRIBED') {
        this.reconnectAttempts.set(config.channel, 0)
        this.flushMessageQueue(config.channel, channel)
      } else if (status === 'CHANNEL_ERROR') {
        this.handleChannelError(config.channel, config)
      } else if (status === 'TIMED_OUT') {
        this.handleChannelError(config.channel, config)
      }
    })

    this.channels.set(config.channel, channel)
    return channel
  }

  /**
   * Handles channel errors with exponential backoff reconnection strategy
   *
   * @param channelName - Name of the channel that encountered an error
   * @param config - Original channel configuration for resubscription
   * @private
   *
   * Implements exponential backoff: delay = baseDelay * 2^attempts
   * Maximum 5 reconnection attempts before giving up
   */
  private handleChannelError(channelName: string, config: RealtimeConfig) {
    const attempts = this.reconnectAttempts.get(channelName) || 0
    if (attempts < this.maxReconnectAttempts) {
      const delay = this.baseReconnectDelay * Math.pow(2, attempts) // Exponential backoff

      const timeout = setTimeout(() => {
        this.reconnectAttempts.set(channelName, attempts + 1)
        this.unsubscribe(channelName)
        this.subscribe(config)
      }, delay)

      this.reconnectTimeouts.set(channelName, timeout)
    }
  }

  /**
   * Attempts to reconnect a specific channel if not already joined
   *
   * @param channelName - Name of the channel to reconnect
   * @private
   */
  private reconnectChannel(channelName: string) {
    const channel = this.channels.get(channelName)
    if (channel && channel.state !== 'joined') {
      channel.subscribe()
    }
  }

  /**
   * Attempts to reconnect all channels that are not currently joined
   * Called when the browser comes back online
   * @private
   */
  private reconnectAllChannels() {
    this.channels.forEach((channel, _name) => {
      if (channel.state !== 'joined') {
        this.reconnectChannel(_name)
      }
    })
  }

  /**
   * Unsubscribes from a specific channel and cleans up resources
   *
   * @param channelName - Name of the channel to unsubscribe from
   *
   * Cleanup includes:
   * - Unsubscribing from the Supabase channel
   * - Clearing reconnection timeouts
   * - Clearing message queues
   */
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
    }
  }

  /**
   * Unsubscribes from all active channels
   * Useful for cleanup when component unmounts or user logs out
   */
  unsubscribeAll() {
    this.channels.forEach((_, name) => {
      this.unsubscribe(name)
    })
  }

  /**
   * Broadcasts a message to all subscribers of a channel
   *
   * @param channelName - Name of the channel to broadcast to
   * @param event - Event name for the broadcast
   * @param payload - Message payload (any JSON-serializable data)
   * @returns Promise that resolves when message is sent
   *
   * When offline, messages are queued and sent when connection is restored
   */
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

  /**
   * Queues a message for later delivery when offline
   *
   * @param channelName - Channel to queue the message for
   * @param event - Event name
   * @param payload - Message payload
   * @private
   */
  private queueMessage(channelName: string, event: string, payload: any) {
    if (!this.messageQueue.has(channelName)) {
      this.messageQueue.set(channelName, [])
    }
    this.messageQueue.get(channelName)!.push({ event, payload })
  }

  /**
   * Flushes queued messages for a channel after reconnection
   *
   * @param channelName - Channel to flush messages for
   * @param channel - The RealtimeChannel instance to send messages through
   * @private
   */
  private flushMessageQueue(channelName: string, channel: RealtimeChannel) {
    const queue = this.messageQueue.get(channelName)
    if (queue && queue.length > 0) {
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

  /**
   * Tracks user presence on a channel
   *
   * @param channelName - Channel to track presence on
   * @param user - User presence data to track
   *
   * Automatically updates lastSeen timestamp
   */
  async trackPresence(channelName: string, user: PresenceUser): Promise<void> {
    const channel = this.channels.get(channelName)
    if (channel) {
      const presenceState = {
        ...user,
        lastSeen: new Date(),
      }
      await channel.track(presenceState)
    }
  }

  /**
   * Updates the current user's presence on a channel
   *
   * @param channelName - Channel to update presence on
   * @param updates - Partial presence data to merge with current state
   *
   * Automatically updates lastSeen timestamp
   * Merges updates with existing presence data
   */
  async updatePresence(channelName: string, updates: Partial<PresenceUser>): Promise<void> {
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

  /**
   * Gets the current presence state for a channel
   *
   * @param channelName - Channel to get presence for
   * @returns Map of presence data keyed by presence_ref, or empty object if channel not found
   */
  getPresenceState(channelName: string): RealtimePresenceState {
    const channel = this.channels.get(channelName)
    return channel ? channel.presenceState() : {}
  }

  /**
   * Gets the current connection state of a channel
   *
   * @param channelName - Channel to check state for
   * @returns Channel state ('joined', 'joining', 'leaving', 'closed', 'errored') or undefined if not found
   */
  getChannelState(channelName: string): string | undefined {
    const channel = this.channels.get(channelName)
    return channel?.state
  }

  /**
   * Checks if a channel is currently subscribed and active
   *
   * @param channelName - Channel to check
   * @returns true if channel is in 'joined' state, false otherwise
   */
  isChannelSubscribed(channelName: string): boolean {
    const channel = this.channels.get(channelName)
    return channel?.state === 'joined'
  }

  /**
   * Cleans up all resources and event listeners
   * Should be called when the manager is no longer needed (e.g., app shutdown)
   *
   * Cleanup includes:
   * - Removing network event listeners
   * - Unsubscribing from all channels
   */
  destroy() {
    window.removeEventListener('online', this.handleOnline)
    window.removeEventListener('offline', this.handleOffline)
    this.unsubscribeAll()
  }
}

// ============================================================================
// Singleton Instance & Convenience Functions
// ============================================================================

/**
 * Singleton instance of RealtimeManager
 * Use this for all realtime operations throughout the application
 */
export const realtimeManager = new RealtimeManager()

/**
 * Subscribes to a realtime channel
 * @param config - Channel configuration
 * @returns The subscribed RealtimeChannel instance
 */
export const subscribeToChannel = (config: RealtimeConfig) => realtimeManager.subscribe(config)

/**
 * Unsubscribes from a realtime channel
 * @param channelName - Name of the channel to unsubscribe from
 */
export const unsubscribeFromChannel = (channelName: string) =>
  realtimeManager.unsubscribe(channelName)

/**
 * Broadcasts a message to a channel
 * @param channelName - Channel to broadcast to
 * @param event - Event name
 * @param payload - Message payload
 * @returns Promise that resolves when message is sent
 */
export const broadcastMessage = (channelName: string, event: string, payload: any) =>
  realtimeManager.broadcast(channelName, event, payload)

/**
 * Tracks user presence on a channel
 * @param channelName - Channel to track presence on
 * @param user - User presence data
 * @returns Promise that resolves when presence is tracked
 */
export const trackUserPresence = (channelName: string, user: PresenceUser) =>
  realtimeManager.trackPresence(channelName, user)

/**
 * Updates user presence on a channel
 * @param channelName - Channel to update presence on
 * @param updates - Partial presence data to update
 * @returns Promise that resolves when presence is updated
 */
export const updateUserPresence = (channelName: string, updates: Partial<PresenceUser>) =>
  realtimeManager.updatePresence(channelName, updates)
