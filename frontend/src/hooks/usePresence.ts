import { useEffect, useState, useCallback, useRef } from 'react'
import type { RealtimePresenceState } from '@supabase/supabase-js'
import { useAuthStore } from '../store/authStore'
import {
  realtimeManager,
  trackUserPresence,
  updateUserPresence,
} from '../lib/realtime'
import type {
  PresenceUser,
  RealtimeConfig,
} from '../lib/realtime'

export interface UsePresenceOptions {
  channel: string
  autoTrack?: boolean
  color?: string
  throttleMs?: number
}

export interface UsePresenceReturn {
  users: PresenceUser[]
  isConnected: boolean
  updateCursor: (x: number, y: number) => void
  updateSelection: (selection: string) => void
  updateStatus: (status: PresenceUser['status']) => void
  trackActivity: () => void
  leave: () => void
}

// Generate random user color
const generateUserColor = () => {
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57',
    '#48C9B0', '#5DADE2', '#AF7AC5', '#F8B739', '#58D68D',
  ]
  return colors[Math.floor(Math.random() * colors.length)]
}

export function usePresence(options: UsePresenceOptions): UsePresenceReturn {
  const { channel, autoTrack = true, color, throttleMs = 100 } = options
  const { user } = useAuthStore()
  const [users, setUsers] = useState<PresenceUser[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const throttleTimerRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const lastActivityRef = useRef<Date>(new Date())
  const idleTimerRef = useRef<NodeJS.Timeout | undefined>(undefined)

  // Transform presence state to user array
  const transformPresenceState = useCallback((state: RealtimePresenceState): PresenceUser[] => {
    const usersList: PresenceUser[] = []
    Object.entries(state).forEach(([_, presences]) => {
      presences.forEach((presence: any) => {
        usersList.push({
          id: presence.id,
          email: presence.email,
          name: presence.name,
          avatar: presence.avatar,
          color: presence.color,
          cursor: presence.cursor,
          selection: presence.selection,
          status: presence.status || 'online',
          lastSeen: presence.lastSeen ? new Date(presence.lastSeen) : new Date(),
        })
      })
    })
    return usersList
  }, [])

  // Handle presence sync
  const handlePresenceSync = useCallback((state: RealtimePresenceState) => {
    const usersList = transformPresenceState(state)
    setUsers(usersList)
    setIsConnected(true)
  }, [transformPresenceState])

  // Handle presence join
  const handlePresenceJoin = useCallback((state: RealtimePresenceState) => {
    const newUsers = transformPresenceState(state)
    setUsers((prev) => {
      const existingIds = new Set(prev.map((u) => u.id))
      const uniqueNewUsers = newUsers.filter((u) => !existingIds.has(u.id))
      return [...prev, ...uniqueNewUsers]
    })
  }, [transformPresenceState])

  // Handle presence leave
  const handlePresenceLeave = useCallback((state: RealtimePresenceState) => {
    const leftUsers = transformPresenceState(state)
    const leftUserIds = new Set(leftUsers.map((u) => u.id))
    setUsers((prev) => prev.filter((u) => !leftUserIds.has(u.id)))
  }, [transformPresenceState])

  // Setup idle detection
  const setupIdleDetection = useCallback(() => {
    const resetIdleTimer = () => {
      lastActivityRef.current = new Date()

      // Clear existing timer
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current)
      }

      // Update status to online if was idle
      const currentState = realtimeManager.getPresenceState(channel)
      const userId = user?.id
      if (userId && currentState[userId]?.[0] && 'status' in currentState[userId][0] && currentState[userId][0].status === 'idle') {
        updateUserPresence(channel, { status: 'online' })
      }

      // Set new idle timer (5 minutes)
      idleTimerRef.current = setTimeout(() => {
        updateUserPresence(channel, { status: 'idle' })
      }, 5 * 60 * 1000)
    }

    // Listen to user activity
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart']
    events.forEach(event => {
      document.addEventListener(event, resetIdleTimer, true)
    })

    // Initial timer
    resetIdleTimer()

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, resetIdleTimer, true)
      })
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current)
      }
    }
  }, [channel, user?.id])

  // Initialize presence tracking
  useEffect(() => {
    if (!user || !autoTrack) return

    const config: RealtimeConfig = {
      channel,
      onPresenceSync: handlePresenceSync,
      onPresenceJoin: handlePresenceJoin,
      onPresenceLeave: handlePresenceLeave,
    }

    // Subscribe to channel
    realtimeManager.subscribe(config)

    // Track initial presence
    const presenceUser: PresenceUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      avatar: user.avatar,
      color: color || generateUserColor(),
      status: 'online',
    }

    trackUserPresence(channel, presenceUser)

    // Setup idle detection
    const cleanupIdleDetection = setupIdleDetection()

    // Cleanup
    return () => {
      cleanupIdleDetection()
      realtimeManager.unsubscribe(channel)
      setIsConnected(false)
    }
  }, [
    user,
    channel,
    autoTrack,
    color,
    handlePresenceSync,
    handlePresenceJoin,
    handlePresenceLeave,
    setupIdleDetection,
  ])

  // Throttled cursor update
  const updateCursor = useCallback(
    (x: number, y: number) => {
      if (!isConnected || !user) return

      // Clear existing throttle timer
      if (throttleTimerRef.current) {
        clearTimeout(throttleTimerRef.current)
      }

      // Set new throttle timer
      throttleTimerRef.current = setTimeout(() => {
        updateUserPresence(channel, { cursor: { x, y } })
      }, throttleMs)
    },
    [channel, isConnected, user, throttleMs]
  )

  // Update selection
  const updateSelection = useCallback(
    (selection: string) => {
      if (!isConnected || !user) return
      updateUserPresence(channel, { selection })
    },
    [channel, isConnected, user]
  )

  // Update status
  const updateStatus = useCallback(
    (status: PresenceUser['status']) => {
      if (!isConnected || !user) return
      updateUserPresence(channel, { status })
    },
    [channel, isConnected, user]
  )

  // Track activity
  const trackActivity = useCallback(() => {
    lastActivityRef.current = new Date()
    if (isConnected && user) {
      updateUserPresence(channel, { lastSeen: new Date() })
    }
  }, [channel, isConnected, user])

  // Leave presence
  const leave = useCallback(() => {
    if (isConnected) {
      updateUserPresence(channel, { status: 'away' })
      setTimeout(() => {
        realtimeManager.unsubscribe(channel)
        setIsConnected(false)
      }, 100)
    }
  }, [channel, isConnected])

  return {
    users,
    isConnected,
    updateCursor,
    updateSelection,
    updateStatus,
    trackActivity,
    leave,
  }
}

// Hook for displaying user cursors
export function useRemoteCursors(channel: string) {
  const { users } = usePresence({ channel, autoTrack: false })
  const [cursors, setCursors] = useState<Map<string, { x: number; y: number; color: string; name?: string }>>(new Map())

  useEffect(() => {
    const newCursors = new Map()
    users.forEach((user) => {
      if (user.cursor && user.id !== useAuthStore.getState().user?.id) {
        newCursors.set(user.id, {
          x: user.cursor.x,
          y: user.cursor.y,
          color: user.color || '#000000',
          name: user.name,
        })
      }
    })
    setCursors(newCursors)
  }, [users])

  return cursors
}

// Hook for typing indicators
export function useTypingIndicator(channel: string) {
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set())
  const typingTimersRef = useRef<Map<string, NodeJS.Timeout>>(new Map())

  useEffect(() => {
    const config: RealtimeConfig = {
      channel: `${channel}:typing`,
      onBroadcast: (event, payload) => {
        if (event === 'typing') {
          const userId = payload.userId
          if (userId === useAuthStore.getState().user?.id) return

          // Add to typing users
          setTypingUsers((prev) => new Set(prev).add(userId))

          // Clear existing timer
          const existingTimer = typingTimersRef.current.get(userId)
          if (existingTimer) {
            clearTimeout(existingTimer)
          }

          // Set new timer to remove after 3 seconds
          const timer = setTimeout(() => {
            setTypingUsers((prev) => {
              const newSet = new Set(prev)
              newSet.delete(userId)
              return newSet
            })
            typingTimersRef.current.delete(userId)
          }, 3000)

          typingTimersRef.current.set(userId, timer)
        }
      },
    }

    realtimeManager.subscribe(config)

    return () => {
      realtimeManager.unsubscribe(`${channel}:typing`)
      typingTimersRef.current.forEach((timer) => clearTimeout(timer))
    }
  }, [channel])

  const sendTyping = useCallback(() => {
    const userId = useAuthStore.getState().user?.id
    if (userId) {
      realtimeManager.broadcast(`${channel}:typing`, 'typing', { userId })
    }
  }, [channel])

  return {
    typingUsers: Array.from(typingUsers),
    sendTyping,
  }
}